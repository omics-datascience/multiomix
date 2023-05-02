import logging
import os
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, Future
from threading import Event
from typing import Dict, Tuple, cast, Optional, Union, List
import numpy as np
import pandas as pd
from django.conf import settings
from django.db import connection
from django.db.models import Q, QuerySet
from pymongo.errors import ServerSelectionTimeoutError
from sklearn.metrics import mean_squared_error, r2_score
from biomarkers.models import BiomarkerState, Biomarker
from common.constants import TCGA_CONVENTION
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed
from common.functions import close_db_connection
from common.utils import replace_cgds_suffix, get_subset_of_features
from feature_selection.fs_algorithms import SurvModel, select_top_cox_regression
from statistical_properties.models import StatisticalValidation, MoleculeWithCoefficient
from user_files.models_choices import MoleculeType

# Common event values
COMMON_INTEREST_VALUES = ['DEAD', 'DECEASE', 'DEATH']


class StatisticalValidationService(object):
    """
    Process statistical validations for a Biomarker in a Thread Pool as explained
    at https://docs.python.org/3.8/library/concurrent.futures.html
    """
    executor: ThreadPoolExecutor = None
    use_transaction: bool
    statistical_validations_futures: Dict[int, Tuple[Future, Event]] = {}

    def __init__(self):
        # Instantiates the executor
        # IMPORTANT: ProcessPoolExecutor doesn't work well with Channels. It wasn't sending
        # websockets messages by some weird reason that I couldn't figure out. Let's use Threads instead of
        # processes
        self.executor = ThreadPoolExecutor(max_workers=settings.THREAD_POOL_SIZE)
        self.use_transaction = settings.USE_TRANSACTION_IN_EXPERIMENT
        self.statistical_validations_futures = {}

    def __commit_or_rollback(self, is_commit: bool):
        """
        Executes a COMMIT or ROLLBACK sentence in DB
        @param is_commit: If True, COMMIT is executed. ROLLBACK otherwise
        """
        if self.use_transaction:
            query = "COMMIT" if is_commit else "ROLLBACK"
            with connection.cursor() as cursor:
                cursor.execute(query)

    @staticmethod
    def __get_common_samples(stat_validation: StatisticalValidation) -> np.ndarray:
        """
        Gets a sorted Numpy array with the samples ID in common between both ExperimentSources.
        @param stat_validation: Feature Selection stat_validation.
        @return: Sorted Numpy array with the samples in common
        """
        # NOTE: the intersection is already sorted by Numpy
        last_intersection: Optional[np.ndarray] = None

        for source in stat_validation.get_all_sources():
            if source is None:
                continue

            if last_intersection is not None:
                cur_intersection = np.intersect1d(
                    last_intersection,
                    source.get_samples()
                )
            else:
                cur_intersection = source.get_samples()
            last_intersection = cast(np.ndarray, cur_intersection)

        return cast(np.ndarray, last_intersection)

    @staticmethod
    def __replace_event_col_for_booleans(value: Union[int, str]) -> bool:
        """Replaces string or integer events in datasets to booleans values to make survival analysis later."""
        return value in [1, '1'] or any(candidate in value for candidate in COMMON_INTEREST_VALUES)

    @staticmethod
    def __generate_molecules_file(stat_validation: StatisticalValidation, samples_in_common: np.ndarray) -> str:
        """Generates the molecules DataFrame for a specific StatisticalValidation with the samples in common."""
        with tempfile.NamedTemporaryFile(mode='a', delete=False) as temp_file:
            molecules_temp_file_path = temp_file.name

            for source, molecules, file_type in stat_validation.get_sources_and_molecules():
                if source is None:
                    continue

                for chunk in source.get_df_in_chunks():
                    # Only keeps the samples in common
                    chunk = chunk[samples_in_common]

                    # Keeps only existing molecules in the current chunk
                    molecules_to_extract = np.intersect1d(chunk.index, molecules)
                    chunk = chunk.loc[molecules_to_extract]

                    # Adds type to disambiguate between genes of 'mRNA' type and 'CNA' type
                    chunk.index = chunk.index + f'_{file_type}'

                    # Removes TCGA suffix
                    chunk.columns = chunk.columns.str.replace(TCGA_CONVENTION, '', regex=True)

                    # Saves in disk
                    chunk.to_csv(temp_file, header=temp_file.tell() == 0, sep='\t', decimal='.')
        return molecules_temp_file_path

    def __generate_df_molecules_and_clinical(self, stat_validation: StatisticalValidation,
                                             samples_in_common: np.ndarray) -> Tuple[str, str]:
        """
        Generates two DataFrames: one with all the selected molecules, and other with the selected clinical data.
        @param stat_validation: StatisticalValidation instance to extract molecules and clinical data from its sources.
        @param samples_in_common: Samples in common to extract from the datasets.
        @return: Both DataFrames paths.
        """
        # Removes CGDS suffix to prevent not found indexes
        clean_samples_in_common = replace_cgds_suffix(samples_in_common)

        # Generates clinical DataFrame
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
            clinical_temp_file_path = temp_file.name

            clinical_source = stat_validation.clinical_source
            clinical_df: pd.DataFrame = clinical_source.get_df()

            # Keeps only the survival tuple and samples in common
            survival_tuple = stat_validation.survival_column_tuple
            clinical_df = clinical_df[[survival_tuple.event_column, survival_tuple.time_column]]

            clinical_df = clinical_df.loc[clean_samples_in_common]

            # Replaces str values of CGDS for
            clinical_df[survival_tuple.event_column] = clinical_df[survival_tuple.event_column].apply(
                self.__replace_event_col_for_booleans
            )

            # Saves in disk
            clinical_df.to_csv(temp_file, sep='\t', decimal='.')

        # Generates all the molecules DataFrame
        molecules_temp_file_path = self.__generate_molecules_file(stat_validation, samples_in_common)

        return molecules_temp_file_path, clinical_temp_file_path

    @staticmethod
    def __save_molecule_identifiers(created_stat_validation: StatisticalValidation,
                                    best_features: List[str], best_features_coeff: List[float]):
        """
        Saves all the molecules with the coefficients taken from the CoxnetSurvivalAnalysis for the new created
        StatisticalValidation instance.
        """
        for feature, coeff in zip(best_features, best_features_coeff):
            molecule_name, molecule_type = feature.rsplit('_', maxsplit=1)
            molecule_type = int(molecule_type)
            if molecule_type not in [MoleculeType.MRNA, MoleculeType.MIRNA, MoleculeType.CNA, MoleculeType.METHYLATION]:
                raise Exception(f'Molecule type invalid: {molecule_type}')

            # Creates the identifier
            MoleculeWithCoefficient.objects.create(
                identifier=molecule_name,
                coeff=coeff,
                type=molecule_type,
                statistical_validation=created_stat_validation
            )

    def __compute_stat_validation(self, stat_validation: StatisticalValidation, molecules_temp_file_path: str,
                                  clinical_temp_file_path: str, stop_event: Event):
        """
        Computes the Feature Selection stat_validation using the params defined by the user.
        TODO: use stop_event
        @param stat_validation: StatisticalValidation instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
        @param stop_event: Stop signal.
        """
        model: SurvModel = stat_validation.trained_model.get_model_instance()
        is_clustering = hasattr(model, 'clustering_parameters')
        is_regression = not is_clustering  # If it's not a clustering model, it's an SVM or RF

        # TODO: refactor this retrieval of data as it's repeated in the fs_service
        # Gets molecules and clinica DataFrames
        molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)
        clinical_df = pd.read_csv(clinical_temp_file_path, sep='\t', decimal='.', index_col=0)

        # In case of regression removes time == 0 in the datasets to prevent errors in the models fit() method
        if is_regression:
            time_column = clinical_df.columns.tolist()[1]  # The time column is ALWAYS the second one at this point
            clinical_df = clinical_df[clinical_df[time_column] > 0]
            valid_samples = clinical_df.index
            molecules_df = molecules_df[valid_samples]  # Samples are as columns in molecules_df

        # Formats clinical data to a Numpy structured array
        clinical_data = np.core.records.fromarrays(clinical_df.to_numpy().transpose(), names='event, time',
                                                   formats='bool, float')

        # Get top features
        best_features, _, best_features_coeff = select_top_cox_regression(molecules_df, clinical_data,
                                                                          filter_zero_coeff=False)
        self.__save_molecule_identifiers(stat_validation, best_features, best_features_coeff)

        # Computes general metrics
        # Gets all the molecules in the needed order. It's necessary to call get_subset_of_features to fix the
        # structure of data
        list_of_molecules: List[str] = molecules_df.index
        molecules_df = get_subset_of_features(molecules_df, list_of_molecules)

        # Makes predictions
        if not is_clustering:
            predictions = model.predict(molecules_df)

            # Gets all the metrics for the SVM or RF
            y_true = clinical_data['time']
            stat_validation.mean_squared_error = mean_squared_error(y_true, predictions)
            stat_validation.c_index = model.score(molecules_df, clinical_data)
            stat_validation.r2_score = r2_score(y_true, predictions)

            # TODO: add here all the metrics for every Source type

            stat_validation.save()

    def get_all_expressions(self, stat_validation: StatisticalValidation) -> pd.DataFrame:
        """
        Gets a molecules Pandas DataFrame to get all the molecules' expressions for all the samples.
        @param stat_validation: StatisticalValidation instance.
        @raise NoSamplesInCommon in case no samples in common are present for all the sources.
        @return: Molecules DataFrame
        """
        # Get samples in common
        samples_in_common = self.__get_common_samples(stat_validation)
        if samples_in_common.size == 0:
            raise NoSamplesInCommon

        # Generates all the molecules DataFrame
        molecules_temp_file_path = self.__generate_molecules_file(stat_validation, samples_in_common)

        return pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)

    def get_molecules_and_clinical_df(self,
                                      stat_validation: StatisticalValidation) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the Feature Selection stat_validation.
        @param stat_validation: StatisticalValidation instance.
        """
        # Get samples in common
        samples_in_common = self.__get_common_samples(stat_validation)
        if samples_in_common.size == 0:
            raise NoSamplesInCommon

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(stat_validation,
                                                                                                      samples_in_common)

        molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)
        clinical_df = pd.read_csv(clinical_temp_file_path, sep='\t', decimal='.', index_col=0)
        return molecules_df, clinical_df

    def __prepare_and_compute_stat_validation(self, stat_validation: StatisticalValidation,
                                              stop_event: Event) -> Tuple[str, str]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the Feature Selection stat_validation.
        TODO: use stop_event
        @param stat_validation: StatisticalValidation instance.
        @param stop_event: Stop signal
        """
        # Get samples in common
        samples_in_common = self.__get_common_samples(stat_validation)
        if samples_in_common.size == 0:
            raise NoSamplesInCommon

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(stat_validation,
                                                                                                      samples_in_common)

        self.__compute_stat_validation(stat_validation, molecules_temp_file_path, clinical_temp_file_path, stop_event)

        return molecules_temp_file_path, clinical_temp_file_path


    def eval_statistical_validation(self, stat_validation: StatisticalValidation, stop_event: Event) -> None:
        """
        Computes a Feature Selection stat_validation.
        @param stat_validation: StatisticalValidation to be processed.
        @param stop_event: Stop event to cancel the stat_validation
        """
        # Resulting Biomarker instance from the FS stat_validation.
        biomarker: Biomarker = stat_validation.biomarker

        # Computes the stat_validation
        molecules_temp_file_path: Optional[str] = None
        clinical_temp_file_path: Optional[str] = None
        try:
            logging.warning(f'ID Statistical validation -> {stat_validation.pk}')
            # IMPORTANT: uses plain SQL as Django's autocommit management for transactions didn't work as expected
            # with exceptions thrown in subprocesses
            if self.use_transaction:
                with connection.cursor() as cursor:
                    cursor.execute("BEGIN")

            # Computes Feature Selection stat_validation
            start = time.time()
            molecules_temp_file_path, clinical_temp_file_path = self.__prepare_and_compute_stat_validation(
                stat_validation,
                stop_event
            )
            total_execution_time = time.time() - start
            logging.warning(f'StatisticalValidation {stat_validation.pk} total time -> {total_execution_time} seconds')

            # If user cancel the stat_validation, discard changes
            if stop_event.is_set():
                raise ExperimentStopped
            else:
                self.__commit_or_rollback(is_commit=True)

                # Saves some data about the result of the stat_validation
                stat_validation.execution_time = total_execution_time
                stat_validation.state = BiomarkerState.COMPLETED
        except NoSamplesInCommon:
            self.__commit_or_rollback(is_commit=False)
            logging.error('No samples in common')
            stat_validation.state = BiomarkerState.NO_SAMPLES_IN_COMMON
        except ExperimentFailed:
            self.__commit_or_rollback(is_commit=False)
            logging.error(f'StatisticalValidation {stat_validation.pk} has failed. Check logs for more info')
            stat_validation.state = BiomarkerState.FINISHED_WITH_ERROR
        except ServerSelectionTimeoutError:
            self.__commit_or_rollback(is_commit=False)
            logging.error('MongoDB connection timeout!')
            stat_validation.state = BiomarkerState.WAITING_FOR_QUEUE
        except ExperimentStopped:
            # If user cancel the stat_validation, discard changes
            logging.warning(f'StatisticalValidation {stat_validation.pk} was stopped')
            self.__commit_or_rollback(is_commit=False)
            stat_validation.state = BiomarkerState.STOPPED
        except Exception as e:
            self.__commit_or_rollback(is_commit=False)
            logging.exception(e)
            logging.warning(f'Setting BiomarkerState.FINISHED_WITH_ERROR to StatisticalValidation {biomarker.pk}')
            stat_validation.state = BiomarkerState.FINISHED_WITH_ERROR
        finally:
            # Removes the temporary files
            if molecules_temp_file_path is not None:
                os.unlink(molecules_temp_file_path)

            if clinical_temp_file_path is not None:
                os.unlink(clinical_temp_file_path)

        # Saves changes in DB
        biomarker.save()
        stat_validation.save()

        # Removes key
        self.__removes_stat_validation_future(biomarker.pk)

        close_db_connection()


    def add_stat_validation(self, stat_validation: StatisticalValidation):
        """
        Adds a Feature Selection stat_validation to the ThreadPool to be processed
        @param stat_validation: StatisticalValidation to be processed
        """
        stat_validation_event = Event()

        # Submits
        stat_validation_future = self.executor.submit(self.eval_statistical_validation, stat_validation,
                                                      stat_validation_event)
        self.statistical_validations_futures[stat_validation.pk] = (stat_validation_future, stat_validation_event)

    def stop_stat_validation(self, stat_validation: StatisticalValidation):
        """
        Stops a specific stat_validation
        @param stat_validation: StatisticalValidation to stop
        """
        if stat_validation.pk in self.statistical_validations_futures:
            (stat_validation_future, stat_validation_event) = self.statistical_validations_futures[stat_validation.pk]
            if stat_validation_future.cancel():
                # If cancel() returns True it means that the stat_validation was waiting in queue and was
                # successfully canceled
                stat_validation.state = BiomarkerState.STOPPED
            else:
                # Sends signal to stop the stat_validation
                stat_validation.state = BiomarkerState.STOPPING
                stat_validation_event.set()
            stat_validation.save()

            # Removes key
            self.__removes_stat_validation_future(stat_validation.pk)

    def compute_pending_statistical_validations(self):
        """
        Gets all the not computed statistical validations to add to the queue. Get IN_PROCESS too because
        if the TaskQueue is being created It couldn't be processing stat_validations. Some stat_validations
        could be in that state due to unexpected errors in server.
        TODO: call this in the apps.py
        """
        logging.warning('Checking pending statistical validations')
        # Gets the stat_validation by submit date (ASC)
        stat_validations: QuerySet = StatisticalValidation.objects.filter(
            Q(state=BiomarkerState.WAITING_FOR_QUEUE)
            | Q(state=BiomarkerState.IN_PROCESS)
        ).order_by('submit_date')
        logging.warning(f'{stat_validations.count()} pending stat_validations are being sent for processing')
        for stat_validation in stat_validations:
            # If the stat_validation has already reached a limit of attempts, it's marked as error
            if stat_validation.attempt == 3:
                stat_validation.state = BiomarkerState.REACHED_ATTEMPTS_LIMIT
                stat_validation.save()
            else:
                stat_validation.attempt += 1
                stat_validation.save()
                logging.warning(f'Running stat_validation "{stat_validation}". Current attempt: {stat_validation.attempt}')
                self.add_stat_validation(stat_validation)

        close_db_connection()

    def __removes_stat_validation_future(self, stat_validation_pk: int):
        """
        Removes a specific key from self.stat_validations_futures
        @param stat_validation_pk: PK to remove
        """
        del self.statistical_validations_futures[stat_validation_pk]


global_stat_validation_service = StatisticalValidationService()
