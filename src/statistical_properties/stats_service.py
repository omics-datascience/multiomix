import logging
import os
import time
import warnings
from concurrent.futures import ThreadPoolExecutor, Future
from threading import Event
from typing import Dict, Tuple, cast, Optional, Union, List
import numpy as np
import pandas as pd
from django.conf import settings
from django.db import connection
from django.db.models import Q, QuerySet
from lifelines import CoxPHFitter
from pymongo.errors import ServerSelectionTimeoutError
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sksurv.metrics import concordance_index_censored
from biomarkers.models import BiomarkerState, Biomarker, TrainedModelState
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed, NoBestModelFound, \
    NumberOfSamplesFewerThanCVFolds
from common.functions import close_db_connection
from common.utils import get_subset_of_features
from common.datasets_utils import get_common_samples, generate_molecules_file, process_chunk, format_data, \
    generate_clinical_file
from feature_selection.fs_algorithms import SurvModel, select_top_cox_regression
from feature_selection.fs_models import ClusteringModels
from feature_selection.models import TrainedModel, ClusteringScoringMethod, ClusteringParameters, FitnessFunction, \
    RFParameters
from feature_selection.utils import create_models_parameters_and_classifier, save_model_dump_and_best_score
from statistical_properties.models import StatisticalValidation, MoleculeWithCoefficient
from user_files.models_choices import MoleculeType, FileType


class StatisticalValidationService(object):
    """
    Process statistical validations for a Biomarker in a Thread Pool as explained
    at https://docs.python.org/3.8/library/concurrent.futures.html
    """
    executor: ThreadPoolExecutor = None
    use_transaction: bool
    statistical_validations_futures: Dict[int, Tuple[Future, Event]] = {}
    trained_model_futures: Dict[int, Tuple[Future, Event]] = {}

    def __init__(self):
        # Instantiates the executor
        # IMPORTANT: ProcessPoolExecutor doesn't work well with Channels. It wasn't sending
        # websockets messages by some weird reason that I couldn't figure out. Let's use Threads instead of
        # processes
        self.executor = ThreadPoolExecutor(max_workers=settings.THREAD_POOL_SIZE)
        self.use_transaction = settings.USE_TRANSACTION_IN_EXPERIMENT
        self.statistical_validations_futures = {}
        self.trained_model_futures = {}

    def __commit_or_rollback(self, is_commit: bool):
        """
        Executes a COMMIT or ROLLBACK sentence in DB. IMPORTANT: uses plain SQL as Django's autocommit
        management for transactions didn't work as expected with exceptions thrown in subprocesses.
        @param is_commit: If True, COMMIT is executed. ROLLBACK otherwise
        """
        if self.use_transaction:
            query = "COMMIT" if is_commit else "ROLLBACK"
            with connection.cursor() as cursor:
                cursor.execute(query)

    @staticmethod
    def __process_chunk(chunk: pd.DataFrame, file_type: FileType, molecules: List[str],
                        samples_in_common: np.ndarray) -> pd.DataFrame:
        """Processes a chunk of a DataFrame adding the file type to the index and keeping just the samples in common."""
        # Only keeps the samples in common
        chunk = chunk[samples_in_common]

        # Keeps only existing molecules in the current chunk
        molecules_to_extract = np.intersect1d(chunk.index, molecules)
        chunk = chunk.loc[molecules_to_extract]

        # Adds type to disambiguate between genes of 'mRNA' type and 'CNA' type
        chunk.index = chunk.index + f'_{file_type}'

        return chunk

    @staticmethod
    def __generate_molecules_dataframe(stat_validation: StatisticalValidation,
                                       samples_in_common: np.ndarray) -> pd.DataFrame:
        """Generates the molecules DataFrame for a specific StatisticalValidation with the samples in common."""
        chunks: List[pd.DataFrame] = []
        for source, molecules, file_type in stat_validation.get_sources_and_molecules():
            if source is None:
                continue

            only_matching = file_type in [FileType.MRNA, FileType.CNA]  # Only genes must be disambiguated
            chunks.extend([
                process_chunk(chunk, file_type, molecules, samples_in_common)
                for chunk in source.get_df_in_chunks(only_matching)
            ])

        # Concatenates all the chunks for all the molecules
        return pd.concat(chunks, axis=0, sort=False)

    @staticmethod
    def __generate_df_molecules_and_clinical(stat_validation: Union[StatisticalValidation, TrainedModel],
                                             samples_in_common: np.ndarray) -> Tuple[str, str]:
        """
        Generates two DataFrames: one with all the selected molecules, and other with the selected clinical data.
        @param stat_validation: StatisticalValidation instance to extract molecules and clinical data from its sources.
        @param samples_in_common: Samples in common to extract from the datasets.
        @return: Both DataFrames paths.
        """
        # Generates clinical DataFrame
        survival_tuple = stat_validation.survival_column_tuple
        clinical_temp_file_path = generate_clinical_file(stat_validation, samples_in_common, survival_tuple)

        # Generates molecules DataFrame
        molecules_temp_file_path = generate_molecules_file(stat_validation, samples_in_common)

        return molecules_temp_file_path, clinical_temp_file_path

    @staticmethod
    def __save_molecule_identifiers(created_stat_validation: StatisticalValidation,
                                    best_features: List[str], best_features_coeff: List[float]):
        """
        Saves all the molecules with the coefficients taken from the CoxNetSurvivalAnalysis for the new created
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
        Computes the statistical validation using the params defined by the user.
        TODO: use stop_event
        @param stat_validation: StatisticalValidation instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
        @param stop_event: Stop signal.
        """
        trained_model: TrainedModel = stat_validation.trained_model
        model: SurvModel = trained_model.get_model_instance()
        is_clustering = hasattr(model, 'clustering_parameters')
        is_regression = not is_clustering  # If it's not a clustering model, it's an SVM or RF

        # Gets data in the correct format
        molecules_df, clinical_df, clinical_data = format_data(molecules_temp_file_path, clinical_temp_file_path,
                                                               is_regression)

        # Get top features
        best_features, _, best_features_coeff = select_top_cox_regression(molecules_df, clinical_data,
                                                                          filter_zero_coeff=True,
                                                                          top_n=20)
        self.__save_molecule_identifiers(stat_validation, best_features, best_features_coeff)

        # Computes general metrics
        # Gets all the molecules in the needed order. It's necessary to call get_subset_of_features to fix the
        # structure of data
        molecules_df = get_subset_of_features(molecules_df, molecules_df.index)

        # Makes predictions
        if is_regression:
            # FIXME: this is broken as the model expects other data shape. There should be a new state indicating that some features are missing for this
            # FIXME: TrainedModel and another one should be created
            predictions = model.predict(molecules_df)

            # Gets all the metrics for the SVM or RF
            y_true = clinical_data['time']
            stat_validation.mean_squared_error = mean_squared_error(y_true, predictions)
            stat_validation.c_index = model.score(molecules_df, clinical_data)
            stat_validation.r2_score = r2_score(y_true, predictions)

            # TODO: add here all the metrics for every Source type

            stat_validation.save()

    @staticmethod
    def __samples_are_fewer_than_folds(clinical_data: np.ndarray, number_of_folds: int) -> bool:
        """
        Checks if the number of samples is fewer than the number of folds.
        Code retrieved from Sklearn model_selection module.
        @param clinical_data: Clinical data Numpy array.
        @param number_of_folds: Current number of folds
        @return: True if the number of samples is fewer than the number of folds (an exception should be raised
        as the GridSearch will be fail), False otherwise.
        """
        classes, y_idx, y_inv = np.unique(clinical_data, return_index=True, return_inverse=True)
        _, class_perm = np.unique(y_idx, return_inverse=True)
        y_encoded = class_perm[y_inv]
        y_counts = np.bincount(y_encoded)
        return np.all(number_of_folds > y_counts)

    def __compute_trained_model(self, trained_model: TrainedModel, molecules_temp_file_path: str,
                                clinical_temp_file_path: str, model_parameters: Dict,
                                cross_validation_folds: int,
                                stop_event: Event):
        """
        Computes the statistical validation using the params defined by the user.
        TODO: use stop_event and cross_validation_type
        @param trained_model: StatisticalValidation instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
        @param model_parameters: A dict with all the model parameters.
        @param cross_validation_folds: Number of folds for cross validation.
        @param stop_event: Stop signal.
        """
        def score_svm_rf(model: SurvModel, x: pd.DataFrame, y: np.ndarray) -> float:
            """Gets the C-Index for an SVM/RF regression prediction."""
            prediction = model.predict(x)
            result = cast(List[float], concordance_index_censored(y['event'], y['time'], prediction))
            return result[0]

        def score_clustering(model: ClusteringModels, subset: pd.DataFrame, y: np.ndarray,
                             score_method: ClusteringScoringMethod, penalizer: Optional[float]) -> float:
            clustering_result = model.fit(subset.values)

            # Generates a DataFrame with a column for time, event and the group
            labels = clustering_result.labels_
            dfs: List[pd.DataFrame] = []
            for cluster_id in range(model.n_clusters):
                current_group_y = y[np.where(labels == cluster_id)]
                dfs.append(
                    pd.DataFrame({'E': current_group_y['event'], 'T': current_group_y['time'], 'group': cluster_id})
                )
            df = pd.concat(dfs)

            # Fits a Cox Regression model using the column group as the variable to consider
            cph: CoxPHFitter = CoxPHFitter(penalizer=penalizer).fit(df, duration_col='T', event_col='E')

            # This documentation recommends using log-likelihood to optimize:
            # https://lifelines.readthedocs.io/en/latest/fitters/regression/CoxPHFitter.html#lifelines.fitters.coxph_fitter.SemiParametricPHFitter.score
            scoring_method = 'concordance_index' if score_method == ClusteringScoringMethod.C_INDEX else 'log_likelihood'
            return cph.score(df, scoring_method=scoring_method)

        # Gets model instance and stores its parameters
        classifier, clustering_scoring_method, is_clustering, is_regression = create_models_parameters_and_classifier(
            trained_model, model_parameters)

        # Gets data in the correct format
        molecules_df, clinical_df, clinical_data = format_data(molecules_temp_file_path, clinical_temp_file_path,
                                                               is_regression)

        # Gets all the molecules in the needed order. It's necessary to call get_subset_of_features to fix the
        # structure of data
        molecules_df = get_subset_of_features(molecules_df, molecules_df.index)

        # Stratified CV
        cv = StratifiedKFold(n_splits=cross_validation_folds, shuffle=True)

        # Generates GridSearchCV instance
        clustering_parameters: Optional[ClusteringParameters] = None
        if trained_model.fitness_function == FitnessFunction.SVM:
            param_grid = {'alpha': 2. ** np.arange(-12, 13, 2)}
            gcv = GridSearchCV(
                classifier,
                param_grid,
                scoring=score_svm_rf,
                n_jobs=1,
                refit=False,
                cv=cv
            )
        elif trained_model.fitness_function == FitnessFunction.RF:
            rf_parameters: RFParameters = trained_model.rf_parameters

            # Checks if it needs to compute a range of n_clusters or a fixed value
            look_optimal_n_estimators = is_clustering and \
                                        model_parameters['rfParameters']['lookForOptimalNEstimators']

            if look_optimal_n_estimators:
                # Tries n_estimators from 10 to 20 jumping by 2
                param_grid = {'n_estimators': range(10, 21, 2)}
            else:
                param_grid = {'n_estimators': [rf_parameters.n_estimators]}

            gcv = GridSearchCV(
                classifier,
                param_grid,
                scoring=score_svm_rf,
                n_jobs=1,
                refit=False,
                cv=cv
            )
        else:
            # Clustering
            clustering_parameters: ClusteringParameters = trained_model.clustering_parameters

            # Checks if it needs to compute a range of n_clusters or a fixed value
            look_optimal_n_clusters = is_clustering and \
                                      model_parameters['clusteringParameters']['lookForOptimalNClusters']

            if look_optimal_n_clusters:
                param_grid = {'n_clusters': range(2, 11)}
            else:
                param_grid = {'n_clusters': [clustering_parameters.n_clusters]}

            gcv = GridSearchCV(
                classifier,
                param_grid,
                scoring=lambda model, x, y: score_clustering(model, x, y, clustering_parameters.scoring_method,
                                                             clustering_parameters.penalizer),
                n_jobs=1,
                refit=False,
                cv=cv
            )

        # Checks if there are fewer samples than splits in the CV to prevent ValueError
        n_samples = clinical_df.shape[0]
        if n_samples < cross_validation_folds:
            raise NoBestModelFound(f'Number of samples ({n_samples}) are fewer than CV number of folds '
                                   f'({cross_validation_folds})')

        # Checks if there are fewer samples than splits in the CV to prevent ValueError
        if self.__samples_are_fewer_than_folds(clinical_data, cross_validation_folds):
            raise NumberOfSamplesFewerThanCVFolds(f'Number of samples: {n_samples} | CV number of folds '
                                                  f'{cross_validation_folds}')

        # Trains the model
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning)
            gcv = gcv.fit(molecules_df, clinical_data)

        best_score = gcv.best_score_
        if not best_score or np.isnan(best_score):
            raise NoBestModelFound(f'Best score is None/NaN: {best_score}')

        # Saves the n_clusters in the model
        if is_clustering:
            clustering_parameters.n_clusters = gcv.best_params_['n_clusters']
            clustering_parameters.save(update_fields=['n_clusters'])

        # Saves model instance and best score
        classifier.set_params(**gcv.best_params_)
        classifier.fit(molecules_df, clinical_data)
        save_model_dump_and_best_score(trained_model, best_model=classifier, best_score=best_score)

    def get_all_expressions(self, stat_validation: StatisticalValidation) -> pd.DataFrame:
        """
        Gets a molecules Pandas DataFrame to get all the molecules' expressions for all the samples.
        @param stat_validation: StatisticalValidation instance.
        @raise NoSamplesInCommon in case no samples in common are present for all the sources.
        @return: Molecules DataFrame
        """
        # Get samples in common
        samples_in_common = get_common_samples(stat_validation)

        # Generates all the molecules DataFrame
        return self.__generate_molecules_dataframe(stat_validation, samples_in_common)

    def get_molecules_and_clinical_df(self,
                                      stat_validation: StatisticalValidation) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the statistical validation.
        @param stat_validation: StatisticalValidation instance.
        """
        # Get samples in common
        samples_in_common = get_common_samples(stat_validation)

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(stat_validation,
                                                                                                      samples_in_common)

        molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)
        clinical_df = pd.read_csv(clinical_temp_file_path, sep='\t', decimal='.', index_col=0)

        return molecules_df, clinical_df

    def __prepare_and_compute_stat_validation(self, stat_validation: StatisticalValidation,
                                              stop_event: Event) -> Tuple[str, str]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the statistical validation.
        TODO: use stop_event
        @param stat_validation: StatisticalValidation instance.
        @param stop_event: Stop signal
        """
        # Get samples in common
        samples_in_common = get_common_samples(stat_validation)

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(stat_validation,
                                                                                                      samples_in_common)

        self.__compute_stat_validation(stat_validation, molecules_temp_file_path, clinical_temp_file_path, stop_event)

        return molecules_temp_file_path, clinical_temp_file_path

    def __prepare_and_compute_trained_model(self, trained_model: TrainedModel, model_parameters: Dict,
                                            cross_validation_folds: int, stop_event: Event) -> Tuple[str, str]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the TrainedModel's training process.
        TODO: use stop_event
        @param trained_model: TrainedModel instance.
        @param model_parameters: A dict with all the model parameters.
        @param cross_validation_folds: Number of folds for cross validation.
        @param stop_event: Stop signal
        """
        # Get samples in common
        samples_in_common = get_common_samples(trained_model)

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(trained_model,
                                                                                                      samples_in_common)

        self.__compute_trained_model(trained_model, molecules_temp_file_path, clinical_temp_file_path, model_parameters,
                                     cross_validation_folds, stop_event)

        return molecules_temp_file_path, clinical_temp_file_path

    def eval_statistical_validation(self, stat_validation: StatisticalValidation, stop_event: Event) -> None:
        """
        Computes a statistical validation.
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

            # Computes statistical validation
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
        self.__removes_stat_validation_future(stat_validation.pk)

        close_db_connection()

    def eval_trained_model(self, trained_model: TrainedModel, model_parameters: Dict,
                           cross_validation_folds: int, stop_event: Event) -> None:
        """
        Computes a training to get a good TrainedModel.
        @param trained_model: TrainedModel to be processed.
        @param model_parameters: A dict with all the model parameters.
        @param cross_validation_folds: Number of folds for cross validation.
        @param stop_event: Stop event to cancel the stat_validation
        """
        # Computes the TrainedModel
        molecules_temp_file_path: Optional[str] = None
        clinical_temp_file_path: Optional[str] = None
        try:
            logging.warning(f'ID TrainedModel -> {trained_model.pk}')
            # IMPORTANT: uses plain SQL as Django's autocommit management for transactions didn't work as expected
            # with exceptions thrown in subprocesses
            if self.use_transaction:
                with connection.cursor() as cursor:
                    cursor.execute("BEGIN")

            # Computes statistical validation
            start = time.time()
            molecules_temp_file_path, clinical_temp_file_path = self.__prepare_and_compute_trained_model(
                trained_model,
                model_parameters,
                cross_validation_folds,
                stop_event
            )
            total_execution_time = time.time() - start
            logging.warning(f'TrainedModel {trained_model.pk} total time -> {total_execution_time} seconds')

            # If user cancel the stat_validation, discard changes
            if stop_event.is_set():
                raise ExperimentStopped
            else:
                self.__commit_or_rollback(is_commit=True)

                # Saves some data about the result of the stat_validation
                trained_model.execution_time = total_execution_time
                trained_model.state = TrainedModelState.COMPLETED
        except NoSamplesInCommon:
            self.__commit_or_rollback(is_commit=False)
            logging.error('No samples in common')
            trained_model.state = TrainedModelState.NO_SAMPLES_IN_COMMON
        except NoBestModelFound as ex:
            self.__commit_or_rollback(is_commit=False)
            logging.error(f'No best model found: {ex}')
            trained_model.state = TrainedModelState.NO_BEST_MODEL_FOUND
        except NumberOfSamplesFewerThanCVFolds as ex:
            self.__commit_or_rollback(is_commit=False)
            logging.error(f'ValueError raised due to number of member of each class being fewer than number '
                          f'of CV folds: {ex}')
            trained_model.state = TrainedModelState.NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS
        except ExperimentFailed:
            self.__commit_or_rollback(is_commit=False)
            logging.error(f'TrainedModel {trained_model.pk} has failed. Check logs for more info')
            trained_model.state = TrainedModelState.FINISHED_WITH_ERROR
        except ServerSelectionTimeoutError:
            self.__commit_or_rollback(is_commit=False)
            logging.error('MongoDB connection timeout!')
            trained_model.state = TrainedModelState.WAITING_FOR_QUEUE
        except ExperimentStopped:
            # If user cancel the stat_validation, discard changes
            logging.warning(f'TrainedModel {trained_model.pk} was stopped')
            self.__commit_or_rollback(is_commit=False)
            trained_model.state = TrainedModelState.STOPPED
        except Exception as e:
            self.__commit_or_rollback(is_commit=False)
            logging.exception(e)
            logging.warning(f'Setting TrainedModelState.FINISHED_WITH_ERROR to TrainedModel {trained_model.pk}')
            trained_model.state = TrainedModelState.FINISHED_WITH_ERROR
        finally:
            # Removes the temporary files
            if molecules_temp_file_path is not None:
                os.unlink(molecules_temp_file_path)

            if clinical_temp_file_path is not None:
                os.unlink(clinical_temp_file_path)

        # Saves changes in DB
        trained_model.save()

        # Removes key
        self.__removes_trained_model_future(trained_model.pk)

        close_db_connection()

    def add_stat_validation(self, stat_validation: StatisticalValidation):
        """
        Adds a stat_validation to the ThreadPool to be processed.
        @param stat_validation: StatisticalValidation to be processed.
        """
        stat_validation_event = Event()

        # Submits
        stat_validation_future = self.executor.submit(self.eval_statistical_validation, stat_validation,
                                                      stat_validation_event)
        self.statistical_validations_futures[stat_validation.pk] = (stat_validation_future, stat_validation_event)

    def add_trained_model_training(self, trained_model: TrainedModel, model_parameters: Dict,
                                   cross_validation_folds: int,):
        """
        Adds a new TrainedModel training request to the ThreadPool to be processed.
        @param trained_model: StatisticalValidation to be processed.
        @param model_parameters: A dict with all the model parameters.
        @param cross_validation_folds: Number of folds for cross validation.
        """
        trained_model_event = Event()

        # Submits
        trained_model_future = self.executor.submit(self.eval_trained_model, trained_model, model_parameters,
                                                    cross_validation_folds, trained_model_event)
        self.trained_model_futures[trained_model.pk] = (trained_model_future, trained_model_event)

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
                stat_validation.attempt += 1  # TODO: add this field to the model
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

    def __removes_trained_model_future(self, trained_model_pk: int):
        """
        Removes a specific key from self.trained_model_futures
        @param trained_model_pk: PK to remove
        """
        del self.trained_model_futures[trained_model_pk]


global_stat_validation_service = StatisticalValidationService()
