import json
import logging
import os
import pickle
import shutil
from datetime import datetime
from typing import Optional, Any, Dict, Tuple
import pandas as pd
from common.enums import ResponseCode
from common.response import ResponseStatus
from .tasks import eval_feature_selection_experiment
from celery.contrib.abortable import AbortableAsyncResult
from django.conf import settings
from django.db import transaction
from rest_framework import permissions
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.utils import get_experiment_source
from biomarkers.models import Biomarker, BiomarkerState, TrainedModelState, BiomarkerOrigin
from common.utils import get_source_pk
from feature_selection.models import FSExperiment, FitnessFunction, SVMTimesRecord, TrainedModel, ClusteringTimesRecord, \
    ClusteringAlgorithm, RFTimesRecord, ClusteringScoringMethod, SVMKernel
from feature_selection.utils import save_molecule_identifiers, get_svm_kernel_enum, save_model_dump_and_best_score
from user_files.models_choices import FileType


class CouldNotSaveTimesRecord(Exception):
    """Raised for edge cases where TimesRecord instances could not be stored."""
    pass


# Keys to keep from the Spark result JSONs
JSON_KEYS = ['number_of_features', 'execution_times', 'fitness', 'times_by_iteration',
             'test_times', 'train_scores', 'number_of_iterations', 'number_of_samples', 'parameters']


class FeatureSelectionSubmit(APIView):
    """Endpoint to submit a Feature Selection experiment."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def __get_fitness_function_enum(fitness_function: str) -> Optional[FitnessFunction]:
        """Gets the correct FitnessFunction from the str value."""
        try:
            value_int = int(fitness_function)
        except ValueError:
            return None

        if value_int == FitnessFunction.CLUSTERING.value:
            return FitnessFunction.CLUSTERING
        elif value_int == FitnessFunction.SVM.value:
            return FitnessFunction.SVM
        elif value_int == FitnessFunction.RF.value:
            return FitnessFunction.RF
        else:
            return None

    @staticmethod
    def __create_target_biomarker(fs_experiment: FSExperiment):
        """Creates a new Biomarker and assigns it to the FSExperiment instance."""
        origin_biomarker = fs_experiment.origin_biomarker
        new_biomarker = Biomarker.objects.create(
            name=f'"{origin_biomarker.name}" (FS optimized {fs_experiment.pk})',
            description=origin_biomarker.description,
            origin=BiomarkerOrigin.FEATURE_SELECTION,
            state=BiomarkerState.WAITING_FOR_QUEUE,
            user=origin_biomarker.user
        )
        fs_experiment.created_biomarker = new_biomarker
        fs_experiment.save()

    def post(self, request: Request):
        with transaction.atomic():
            # Gets Biomarker instance
            biomarker_pk = request.POST.get('biomarkerPk')
            biomarker: Biomarker = get_object_or_404(Biomarker, pk=biomarker_pk)

            # Clinical source
            clinical_source_type = get_source_pk(request.POST, 'clinicalType')
            clinical_source, clinical_aux = get_experiment_source(clinical_source_type, request, FileType.CLINICAL,
                                                                  'clinical')

            # Select the valid one (if it's a CGDSStudy it needs clinical_aux as it has both needed CGDSDatasets)
            clinical_source = clinical_aux if clinical_aux is not None else clinical_source

            if clinical_source is None:
                raise ValidationError('Invalid clinical source')

            # mRNA source
            mrna_source_type = get_source_pk(request.POST, 'mRNAType')
            mrna_source, _mrna_clinical = get_experiment_source(mrna_source_type, request, FileType.MRNA, 'mRNA')
            if biomarker.number_of_mrnas > 0 and mrna_source is None:
                raise ValidationError('Invalid mRNA source')

            # miRNA source
            mirna_source_type = get_source_pk(request.POST, 'miRNAType')
            mirna_source, _mirna_clinical = get_experiment_source(mirna_source_type, request, FileType.MIRNA, 'miRNA')
            if biomarker.number_of_mirnas > 0 and mirna_source is None:
                raise ValidationError('Invalid miRNA source')

            # CNA source
            cna_source_type = get_source_pk(request.POST, 'cnaType')
            cna_source, _cna_clinical = get_experiment_source(cna_source_type, request, FileType.CNA, 'cna')
            if biomarker.number_of_cnas > 0 and cna_source is None:
                raise ValidationError('Invalid CNA source')

            # Methylation source
            methylation_source_type = get_source_pk(request.POST, 'methylationType')
            methylation_source, _methylation_clinical = get_experiment_source(methylation_source_type, request,
                                                                              FileType.METHYLATION, 'methylation')
            if biomarker.number_of_methylations > 0 and methylation_source is None:
                raise ValidationError('Invalid Methylation source')

            # Gets all the FS settings
            algorithm = request.POST.get('algorithm')
            algorithm_parameters = request.POST.get('algorithmParameters')
            fitness_function = request.POST.get('fitnessFunction')
            fitness_function_parameters = request.POST.get('fitnessFunctionParameters')
            cross_validation_parameters = request.POST.get('crossValidationParameters')
            if algorithm is None or fitness_function is None or fitness_function_parameters is None or \
                    algorithm_parameters is None or cross_validation_parameters is None:
                raise ValidationError(f'Invalid parameters: algorithm: {algorithm}'
                                      f'| algorithm_parameters: {algorithm_parameters} '
                                      f'| fitness_function: {fitness_function} '
                                      f'| fitness_function_parameters: {fitness_function_parameters}'
                                      f'| cross_validation_parameters: {cross_validation_parameters}')

            # Parses from JSON to dict
            algorithm_parameters = json.loads(algorithm_parameters)
            fitness_function_parameters = json.loads(fitness_function_parameters)
            cross_validation_parameters = json.loads(cross_validation_parameters)

            # Creates FSExperiment instance
            fit_fun_enum = self.__get_fitness_function_enum(fitness_function)
            if fit_fun_enum is None:
                raise ValidationError('Invalid fitness function')

            fs_experiment = FSExperiment.objects.create(
                origin_biomarker=biomarker,
                algorithm=int(algorithm),
                clinical_source=clinical_source,
                mrna_source=mrna_source,
                mirna_source=mirna_source,
                cna_source=cna_source,
                methylation_source=methylation_source,
                user=request.user
            )

            # Adds Feature Selection experiment to the ThreadPool
            self.__create_target_biomarker(fs_experiment)

        async_res: AbortableAsyncResult = eval_feature_selection_experiment.apply_async(
            (fs_experiment.pk, fit_fun_enum, fitness_function_parameters, algorithm_parameters,
             cross_validation_parameters), queue='feature_selection')

        fs_experiment.task_id = async_res.task_id
        fs_experiment.save(update_fields=['task_id'])

        return Response({'ok': True})


class FeatureSelectionExperimentAWSNotification(APIView):
    """This endpoint receives the AWS notification and updates the Feature Selection experiment's state."""

    @staticmethod
    def __get_date_time_from_format(date_str: str) -> datetime:
        """Parses a date in the format "2023-06-29 17:08:56+00:00" to a datetime object."""
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S+00:00')

    def __compute_execution_time(self, created_at: str, finished_at: str) -> int:
        """Computed the difference between to dates in seconds."""
        created_at = self.__get_date_time_from_format(created_at)
        finished_at = self.__get_date_time_from_format(finished_at)
        seconds = (finished_at - created_at).total_seconds()
        return round(seconds)  # Rounds to the nearest second

    @staticmethod
    def __remove_folder_if_exists(path: str):
        """Removes a folder if exists. Otherwise, logs an error."""
        if os.path.exists(path):
            shutil.rmtree(path)
        else:
            logging.warning(f'Trying to remove folder in {path}. But it does not exist')

    def __remove_datasets(self, fs_experiment: FSExperiment, emr_settings: Dict[str, Any]):
        """Removes the datasets from the shared folder."""
        # Gets paths of both molecules_df and clinical_df in the shared volume with the microservice
        data_folder = emr_settings['shared_folder_data']
        app_folder_path = os.path.join(data_folder, fs_experiment.app_name)

        # Removes datasets folder
        self.__remove_folder_if_exists(app_folder_path)

    @staticmethod
    def __get_svm_parameters_columns(row: pd.Series) -> Tuple[str, str, str, SVMKernel]:
        """Iterates over rows generating some columns with SVM model parameters"""
        parameters_desc = row['parameters']
        params = parameters_desc.split('_')
        task, max_iterations, optimizer, kernel = params[0], params[1], params[4], params[6]
        kernel = get_svm_kernel_enum(kernel)
        return task, max_iterations, optimizer, kernel

    @staticmethod
    def __get_clustering_parameters_columns(row: pd.Series) -> Tuple[int, ClusteringAlgorithm, ClusteringScoringMethod]:
        """Iterates over rows generating some columns with Clustering model parameters"""
        parameters_desc = row['parameters']
        params = parameters_desc.split('_')
        number_of_clusters, algorithm_description, scoring_method = params[0], params[2], params[4]
        # algorithm = ClusteringAlgorithm.K_MEANS if algorithm_description == 'k-means' else ClusteringAlgorithm.SPECTRAL
        if algorithm_description == 'k-means':
            algorithm = ClusteringAlgorithm.K_MEANS
        elif algorithm_description == 'spectral':
            algorithm = ClusteringAlgorithm.SPECTRAL
        elif algorithm_description == 'bk-means':
            algorithm = ClusteringAlgorithm.BK_MEANS
        else:
            algorithm = ClusteringAlgorithm.DBSCAN
        scoring = ClusteringScoringMethod.C_INDEX if scoring_method == 'concordance-index' \
            else ClusteringScoringMethod.LOG_LIKELIHOOD
        return number_of_clusters, algorithm, scoring

    @staticmethod
    def __get_rf_parameters_columns(row: pd.Series) -> Tuple[int]:
        """Iterates over rows generating some columns with RF model parameters"""
        parameters_desc = row['parameters']
        params = parameters_desc.split('_')
        number_of_trees = params[0]
        return (number_of_trees,)  #  NOTE: must be a tuple or the setting of columns names won't work in Pandas

    def __save_svm_times_data(self, fs_experiment: FSExperiment, times_df: pd.DataFrame):
        """Saves all the data about times from the Spark job for an SVM model."""
        # Gets the parameters from the parameters column
        parameters_df = times_df.apply(self.__get_svm_parameters_columns, axis=1, result_type='expand')
        parameters_df.columns = ['task', 'max_iterations', 'optimizer', 'kernel']

        # Appends to original DataFrame
        times_df = pd.concat((times_df, parameters_df), axis='columns')

        # Saves times in the database
        SVMTimesRecord.objects.bulk_create([
            SVMTimesRecord(
                number_of_features=row['number_of_features'],
                number_of_samples=row['number_of_samples'],
                execution_time=row['execution_times'],
                test_time=row['test_times'],
                fitness=row['fitness'],
                train_score=row['train_scores'],
                # SVM parameters
                number_of_iterations=row['number_of_iterations'],
                time_by_iteration=row['times_by_iteration'],
                max_iterations=row['max_iterations'],
                optimizer=row['optimizer'],
                kernel=row['kernel'],
                fs_experiment=fs_experiment
            )
            for _, row in times_df.iterrows()
        ])

    def __save_clustering_times_data(self, fs_experiment: FSExperiment, times_df: pd.DataFrame):
        """Saves all the data about times from the Spark job for a Clustering model."""
        # Gets the parameters from the parameters column
        parameters_df = times_df.apply(self.__get_clustering_parameters_columns, axis=1, result_type='expand')
        parameters_df.columns = ['number_of_clusters', 'algorithm', 'scoring_method']

        # Appends to original DataFrame
        times_df = pd.concat((times_df, parameters_df), axis='columns')

        # Saves times in the database
        ClusteringTimesRecord.objects.bulk_create([
            ClusteringTimesRecord(
                number_of_features=row['number_of_features'],
                number_of_samples=row['number_of_samples'],
                execution_time=row['execution_times'],
                fitness=row['fitness'],
                train_score=row['train_scores'],
                # Clustering parameters
                number_of_clusters=row['number_of_clusters'],
                algorithm=row['algorithm'],
                scoring_method=row['scoring_method'],
                fs_experiment=fs_experiment
            )
            for _, row in times_df.iterrows()
        ])

    def __save_rf_times_data(self, fs_experiment: FSExperiment, times_df: pd.DataFrame):
        """Saves all the data about times from the Spark job for a Random Forest model."""
        # Gets the parameters from the parameters column
        parameters_df = times_df.apply(self.__get_rf_parameters_columns, axis=1, result_type='expand')
        parameters_df.columns = ['number_of_trees']

        # Appends to original DataFrame
        times_df = pd.concat((times_df, parameters_df), axis='columns')

        # Saves times in the database
        RFTimesRecord.objects.bulk_create([
            RFTimesRecord(
                number_of_features=row['number_of_features'],
                number_of_samples=row['number_of_samples'],
                execution_time=row['execution_times'],
                test_time=row['test_times'],
                fitness=row['fitness'],
                train_score=row['train_scores'],
                # RF parameters
                number_of_trees=row['number_of_trees'],
                fs_experiment=fs_experiment
            )
            for _, row in times_df.iterrows()
        ])

    def __save_results(self, fs_experiment: FSExperiment, emr_settings: Dict[str, Any]):
        """
        Gets results from the shared folder and saves them in the database.
        @param fs_experiment: FSExperiment instance.
        @param emr_settings: EMR settings to get the shared folder path.
        @raises: FileNotFoundError if the result file is not found.
        @raises: CouldNotSaveTimesRecord if the results could not be saved due to some integrity or DB errors.
        """
        shared_results_folder = emr_settings['shared_folder_results']

        # Stores molecules in the target biomarker, the best model and its fitness value
        experiment_results_folder = os.path.join(shared_results_folder, fs_experiment.app_name)
        result_path = os.path.join(experiment_results_folder, 'result.json')
        with open(result_path, 'r') as fp:
            json_content: Dict = json.load(fp)

        best_features = json_content['features'].split(' | ')
        save_molecule_identifiers(fs_experiment.created_biomarker, best_features)

        # Gets the best model and its fitness value and saves them in the database
        trained_model: TrainedModel = fs_experiment.best_model
        self.__save_trained_model_data(trained_model, json_content, experiment_results_folder)

        # Iterates over all JSON files in the Experiment's folder to accumulate time data in a DataFrame
        times_df = pd.DataFrame()
        for (_, _, files) in os.walk(experiment_results_folder):
            for filename in files:
                # Skips non-JSON files
                if not filename.endswith('.json'):
                    continue

                # Skips the result.json file
                if filename == 'result.json':
                    continue

                file_path = os.path.join(experiment_results_folder, filename)
                with open(file_path, 'r') as fp:
                    json_content: Dict = json.load(fp)

                    # NOTE: discards some columns as some experiments were made with different versions of the code and
                    # some columns were renamed or removed. This prevents 'ValueError: Mixing dicts with non-Series may
                    # lead to ambiguous ordering.' exception
                    json_content_filtered = {key: json_content[key] for key in JSON_KEYS}

                    current_df = pd.DataFrame.from_dict(json_content_filtered)
                    times_df = pd.concat((times_df, current_df), axis='rows', ignore_index=True)

        # Finally, saves the times data
        try:
            fitness_function_enum = trained_model.fitness_function
            if fitness_function_enum == FitnessFunction.SVM:
                self.__save_svm_times_data(fs_experiment, times_df)
            elif fitness_function_enum == FitnessFunction.CLUSTERING:
                self.__save_clustering_times_data(fs_experiment, times_df)
            elif fitness_function_enum == FitnessFunction.RF:
                self.__save_rf_times_data(fs_experiment, times_df)
            else:
                logging.error(f'Fitness function {fitness_function_enum} not supported for saving times data')
                logging.error(f'FSExperiment ID: {fs_experiment.pk}')
        except Exception as e:
            raise CouldNotSaveTimesRecord(e)

    @staticmethod
    def __save_trained_model_data(trained_model: TrainedModel, json_content: Dict, experiment_results_folder: str):
        """Saves all the data about the best model in the database. Getting the model dump from the shared folder."""
        best_fitness = json_content['best_metric']

        model_path = os.path.join(experiment_results_folder, 'model.pkl')
        if os.path.exists(model_path):
            with open(model_path, "rb") as fp:
                fs_generated_model = pickle.load(fp)
            save_model_dump_and_best_score(trained_model, fs_generated_model, best_fitness)
        else:
            trained_model.state = TrainedModelState.MODEL_DUMP_NOT_AVAILABLE
            trained_model.save(update_fields=['state'])

    @staticmethod
    def __update_trained_model_state(fs_experiment: FSExperiment, is_ok: bool):
        """Updates the state of the TrainedModel instance."""
        trained_model = fs_experiment.best_model

        # If the model dump is not available, the state is not updated
        if trained_model.state == TrainedModelState.MODEL_DUMP_NOT_AVAILABLE:
            return

        if is_ok:
            trained_model.state = TrainedModelState.COMPLETED
        else:
            trained_model.state = TrainedModelState.FINISHED_WITH_ERROR
        trained_model.save(update_fields=['state'])

    def post(self, request: Request, job_id: str):
        # Gets the instance (must be in process)
        fs_experiment = get_object_or_404(FSExperiment, emr_job_id=job_id,
                                          created_biomarker__state=BiomarkerState.IN_PROCESS)
        created_biomarker = fs_experiment.created_biomarker

        job_data = json.loads(request.body)

        emr_settings = settings.AWS_EMR_SETTINGS

        # Checks state
        state = job_data['state']
        if state == 'COMPLETED':
            # If everything went well, sets as completed, gets results, saves the corresponding data and returns ok
            created_biomarker.state = BiomarkerState.COMPLETED

            # Saves execution time
            try:
                exec_time = self.__compute_execution_time(job_data['createdAt'], job_data['finishedAt'])
                fs_experiment.execution_time = exec_time
                fs_experiment.save(update_fields=['execution_time'])
            except Exception as ex:
                logging.error(f'Could not save execution time for FSExperiment with pk {fs_experiment.pk}. '
                              f'Leaving default...')
                logging.exception(ex)

            # Saves results and time records (these last ones are optional)
            try:
                self.__save_results(fs_experiment, emr_settings)
            except FileNotFoundError as ex:
                logging.error(f'Could not find results file for FSExperiment ID {fs_experiment.pk}.'
                              f' Setting as FINISHED_WITH_ERROR')
                logging.exception(ex)
                created_biomarker.state = BiomarkerState.FINISHED_WITH_ERROR
            except CouldNotSaveTimesRecord as ex:
                logging.error(f'Could not save times data for FSExperiment ID {fs_experiment.pk}. Setting as '
                              f'COMPLETED anyway. See Spark logs or the exception for more details.')
                logging.exception(ex)
        elif state == 'CANCELLED':
            created_biomarker.state = BiomarkerState.STOPPED
        else:
            logging.warning(f'Job {fs_experiment.pk} failed with state: {state}. Setting as FINISHED_WITH_ERROR')
            created_biomarker.state = BiomarkerState.FINISHED_WITH_ERROR

        created_biomarker.save(update_fields=['state'])

        # Updates TrainedModel state
        trained_model_is_ok = created_biomarker.state == BiomarkerState.COMPLETED
        self.__update_trained_model_state(fs_experiment, trained_model_is_ok)

        # Removes the molecules and clinical datasets from the shared folder
        self.__remove_datasets(fs_experiment, emr_settings)

        return Response({'ok': True})


class StopFSExperiment(APIView):
    """Stops a FSExperiment"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: Request):
        # TODO: replicate this code in api_service.views where function views
        # TODO: is being used instead of APIViews
        biomarker_id = request.GET.get('biomarkerId')

        # Check if all the required parameters are in request
        if biomarker_id is None:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='Invalid request params'
                )
            }
        else:
            try:
                # Gets Biomarker and FSExperiment
                biomarker: Biomarker = Biomarker.objects.get(pk=biomarker_id, user=request.user)
                experiment: FSExperiment = biomarker.fs_experiment

                logging.warning(f'Aborting FSExperiment {biomarker_id}')

                # Sends the signal to abort it
                if experiment.task_id:
                    abortable_async_result = AbortableAsyncResult(experiment.task_id)
                    abortable_async_result.abort()

                # Updates Biomarker state
                biomarker.state = BiomarkerState.STOPPED
                biomarker.save(update_fields=['state'])

                response = {
                    'status': ResponseStatus(ResponseCode.SUCCESS).to_json()
                }
            except ValueError as ex:
                # Cast errors...
                logging.exception(ex)
                response = {
                    'status': ResponseStatus(
                        ResponseCode.ERROR,
                        message='Invalid request params type'
                    ).to_json()
                }
            except FSExperiment.DoesNotExist:
                # If the experiment does not exist, returns an error
                response = {
                    'status': ResponseStatus(
                        ResponseCode.ERROR,
                        message='The FSExperiment does not exists'
                    ).to_json()
                }

        # Formats to JSON the ResponseStatus object
        return Response(response)
