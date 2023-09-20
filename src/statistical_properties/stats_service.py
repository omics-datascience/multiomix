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
from sksurv.exceptions import NoComparablePairException
from sksurv.metrics import concordance_index_censored
from biomarkers.models import TrainedModelState
from common.exceptions import ExperimentStopped, NoSamplesInCommon, ExperimentFailed, NoBestModelFound, \
    NumberOfSamplesFewerThanCVFolds
from common.functions import close_db_connection, check_if_stopped
from common.typing import AbortEvent
from common.utils import get_subset_of_features
from common.datasets_utils import get_common_samples, generate_molecules_file, format_data, \
    generate_clinical_file, generate_molecules_dataframe, check_sample_classes
from feature_selection.fs_algorithms import SurvModel, select_top_cox_regression
from feature_selection.fs_models import ClusteringModels
from feature_selection.models import TrainedModel, ClusteringScoringMethod, ClusteringParameters, FitnessFunction, \
    RFParameters
from feature_selection.utils import create_models_parameters_and_classifier, save_model_dump_and_best_score
from statistical_properties.models import StatisticalValidation, MoleculeWithCoefficient
from user_files.models_choices import MoleculeType


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

def __compute_stat_validation(stat_validation: StatisticalValidation, molecules_temp_file_path: str,
                              clinical_temp_file_path: str, is_aborted: AbortEvent):
    """
    Computes the statistical validation using the params defined by the user.
    @param stat_validation: StatisticalValidation instance.
    @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
    @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
    @param is_aborted: Stop signal.
    """
    check_if_stopped(is_aborted, ExperimentStopped)
    trained_model: TrainedModel = stat_validation.trained_model
    model: SurvModel = trained_model.get_model_instance()
    is_clustering = hasattr(model, 'clustering_parameters')
    is_regression = not is_clustering  # If it's not a clustering model, it's an SVM or RF

    # Gets data in the correct format
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_df, clinical_df, clinical_data = format_data(molecules_temp_file_path, clinical_temp_file_path,
                                                           is_regression)

    # Get top features
    check_if_stopped(is_aborted, ExperimentStopped)
    best_features, _, best_features_coeff = select_top_cox_regression(molecules_df, clinical_data,
                                                                      filter_zero_coeff=True,
                                                                      top_n=20)

    check_if_stopped(is_aborted, ExperimentStopped)
    __save_molecule_identifiers(stat_validation, best_features, best_features_coeff)

    # Computes general metrics
    # Gets all the molecules in the needed order. It's necessary to call get_subset_of_features to fix the
    # structure of data
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_df = get_subset_of_features(molecules_df, molecules_df.index)

    # Makes predictions
    if is_regression:
        # FIXME: this is broken as the model expects other data shape. There should be a new state indicating that some features are missing for this
        # FIXME: TrainedModel and another one should be created
        check_if_stopped(is_aborted, ExperimentStopped)
        predictions = model.predict(molecules_df)

        # Gets all the metrics for the SVM or RF
        check_if_stopped(is_aborted, ExperimentStopped)
        y_true = clinical_data['time']
        stat_validation.mean_squared_error = mean_squared_error(y_true, predictions)
        stat_validation.c_index = model.score(molecules_df, clinical_data)
        stat_validation.r2_score = r2_score(y_true, predictions)

        # TODO: add here all the metrics for every Source type

        check_if_stopped(is_aborted, ExperimentStopped)
        stat_validation.save()

def prepare_and_compute_stat_validation(stat_validation: StatisticalValidation,
                                        is_aborted: AbortEvent) -> Tuple[str, str]:
    """
    Gets samples in common, generates needed DataFrames and finally computes the statistical validation.
    @param stat_validation: StatisticalValidation instance.
    @param is_aborted: Method to call to check if the experiment has been stopped.
    """
    # Get samples in common
    check_if_stopped(is_aborted, ExperimentStopped)
    samples_in_common = get_common_samples(stat_validation)

    # Generates needed DataFrames
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_temp_file_path, clinical_temp_file_path = __generate_df_molecules_and_clinical(stat_validation,
                                                                                            samples_in_common)

    __compute_stat_validation(stat_validation, molecules_temp_file_path, clinical_temp_file_path, is_aborted)

    return molecules_temp_file_path, clinical_temp_file_path

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
    def __compute_trained_model(trained_model: TrainedModel, molecules_temp_file_path: str,
                                clinical_temp_file_path: str, model_parameters: Dict, stop_event: Event):
        """
        Computes the statistical validation using the params defined by the user.
        TODO: use stop_event
        @param trained_model: StatisticalValidation instance.
        @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
        @param clinical_temp_file_path: Path of the DataFrame with the clinical data.
        @param model_parameters: A dict with all the model parameters.
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
        cross_validation_folds = trained_model.cross_validation_folds
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
        check_sample_classes(trained_model, clinical_data, cross_validation_folds)

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

    @staticmethod
    def get_all_expressions(stat_validation: StatisticalValidation) -> pd.DataFrame:
        """
        Gets a molecules Pandas DataFrame to get all the molecules' expressions for all the samples.
        @param stat_validation: StatisticalValidation instance.
        @raise NoSamplesInCommon in case no samples in common are present for all the sources.
        @return: Molecules DataFrame
        """
        # Get samples in common
        samples_in_common = get_common_samples(stat_validation)

        # Generates all the molecules DataFrame
        return generate_molecules_dataframe(stat_validation, samples_in_common)

    def get_molecules_and_clinical_df(self,
                                      stat_validation: StatisticalValidation) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the statistical validation.
        @param stat_validation: StatisticalValidation instance.
        """
        # Get samples in common
        samples_in_common = get_common_samples(stat_validation)

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(stat_validation,
                                                                                                      samples_in_common)

        # Gets both DataFrames without NaNs values
        molecules_df, _clinical_df, clinical_data = format_data(molecules_temp_file_path, clinical_temp_file_path,
                                                                is_regression=False)

        return molecules_df, clinical_data



    def __prepare_and_compute_trained_model(self, trained_model: TrainedModel, model_parameters: Dict,
                                            stop_event: Event) -> Tuple[str, str]:
        """
        Gets samples in common, generates needed DataFrames and finally computes the TrainedModel's training process.
        TODO: use stop_event
        @param trained_model: TrainedModel instance.
        @param model_parameters: A dict with all the model parameters.
        @param stop_event: Stop signal
        """
        # Get samples in common
        samples_in_common = get_common_samples(trained_model)

        # Generates needed DataFrames
        molecules_temp_file_path, clinical_temp_file_path = self.__generate_df_molecules_and_clinical(trained_model,
                                                                                                      samples_in_common)

        self.__compute_trained_model(trained_model, molecules_temp_file_path, clinical_temp_file_path, model_parameters,
                                     stop_event)

        return molecules_temp_file_path, clinical_temp_file_path



    def eval_trained_model(self, trained_model: TrainedModel, model_parameters: Dict, stop_event: Event) -> None:
        """
        Computes a training to get a good TrainedModel.
        @param trained_model: TrainedModel to be processed.
        @param model_parameters: A dict with all the model parameters.
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
        except (NoBestModelFound, NoComparablePairException) as ex:
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


    def add_trained_model_training(self, trained_model: TrainedModel, model_parameters: Dict):
        """
        Adds a new TrainedModel training request to the ThreadPool to be processed.
        @param trained_model: StatisticalValidation to be processed.
        @param model_parameters: A dict with all the model parameters.
        """
        trained_model_event = Event()

        # Submits
        trained_model_future = self.executor.submit(self.eval_trained_model, trained_model, model_parameters,
                                                    trained_model_event)
        self.trained_model_futures[trained_model.pk] = (trained_model_future, trained_model_event)



    def __removes_trained_model_future(self, trained_model_pk: int):
        """
        Removes a specific key from self.trained_model_futures
        @param trained_model_pk: PK to remove
        """
        del self.trained_model_futures[trained_model_pk]


global_stat_validation_service = StatisticalValidationService()
