import json
import os
from datetime import datetime
from typing import Optional, Any, Dict, Tuple
import pandas as pd
from django.conf import settings
from django.db import transaction
from rest_framework import permissions
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.utils import get_experiment_source
from biomarkers.models import Biomarker, BiomarkerState
from common.utils import get_source_pk
from feature_selection.fs_service import global_fs_service
from feature_selection.models import FSExperiment, FitnessFunction, SVMTimesRecord
from feature_selection.utils import save_molecule_identifiers
from user_files.models_choices import FileType


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
            return  FitnessFunction.SVM
        elif value_int == FitnessFunction.RF.value:
            return FitnessFunction.RF
        else:
            return None

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
            if algorithm is None or fitness_function is None or fitness_function_parameters is None or \
                    algorithm_parameters is None:
                raise ValidationError(f'Invalid parameters: algorithm: {algorithm}'
                                      f'| algorithm_parameters: {algorithm_parameters} '
                                      f'| fitness_function: {fitness_function} '
                                      f'| fitness_function_parameters: {fitness_function_parameters}')

            algorithm_parameters = json.loads(algorithm_parameters)
            fitness_function_parameters = json.loads(fitness_function_parameters)

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
            global_fs_service.add_experiment(fs_experiment, fit_fun_enum, fitness_function_parameters,
                                             algorithm_parameters)

        return Response({'ok': True})


class FeatureSelectionExperimentAWSNotification(APIView):
    """This endpoint receives the AWS notification and updates the Feature Selection experiment's state."""

    @staticmethod
    def __get_date_time_from_format(date_str: str) -> datetime:
        """Parses a date in the format "Fri, 09 Jun 2023 16:13:13 GMT" to a datetime object."""
        return datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %Z')

    def __compute_execution_time(self, created_at: str, finished_at: str) -> int:
        """Computed the difference between to dates in seconds."""
        created_at = self.__get_date_time_from_format(created_at)
        finished_at = self.__get_date_time_from_format(finished_at)
        seconds = (finished_at - created_at).total_seconds()
        return round(seconds)  # Rounds to the nearest second

    @staticmethod
    def __remove_datasets(fs_experiment: FSExperiment, emr_settings: Dict[str, Any]):
        """Removes the datasets from the shared folder."""
        # Gets paths of both molecules_df and clinical_df in the shared volume with the microservice
        data_folder = emr_settings['shared_folder_data']
        molecular_df_path = os.path.join(data_folder, fs_experiment.app_name, 'molecules.csv')
        clinical_df_path = os.path.join(data_folder, fs_experiment.app_name, 'clinical.csv')

        # Removes files in both paths
        if os.path.exists(molecular_df_path):
            os.remove(molecular_df_path)
        if os.path.exists(clinical_df_path):
            os.remove(clinical_df_path)

    @staticmethod
    def __get_parameters_columns(row: pd.Series) -> Tuple[str, str, str, str]:
        """Iterates over rows generating some columns with model parameters"""
        parameters_desc = row['parameters']
        params = parameters_desc.split('_')
        task, max_iterations, optimizer, kernel = params[0], params[1], params[4], params[6]
        return task, max_iterations, optimizer, kernel

    def __save_results(self, fs_experiment: FSExperiment, emr_settings: Dict[str, Any]):
        """Gets results from the shared folder and saves them in the database."""
        shared_results_folder = emr_settings['shared_folder_results']

        # Stores molecules in the target biomarker, the best model and its fitness value
        experiment_results_folder = os.path.join(shared_results_folder, fs_experiment.app_name)
        res_df = pd.read_csv(experiment_results_folder, sep=',', index_col=0)
        best_features = res_df['feature'].split(' | ')
        save_molecule_identifiers(fs_experiment.created_biomarker, best_features)

        # Iterates over all JSON files in the Experiment's folder to save time data
        times_df = pd.DataFrame()
        for (_, _, files) in os.walk(experiment_results_folder):
            for filename in files:
                if not filename.endswith('.json'):
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

            # TODO: add support for RF and Clustering parameters too when times data is available
            # Generate parameters columns
            parameters_df = times_df.apply(self.__get_parameters_columns, axis=1, result_type='expand')
            parameters_keys = ['task', 'max_iterations', 'optimizer', 'kernel']
            parameters_df.columns = parameters_keys
            times_df = pd.concat((times_df, parameters_df), axis='columns')

            # Saves times in the database iterating over chunks of 1000 rows
            for _, row in times_df.iterrows():
                SVMTimesRecord.objects.bulk_create([
                    SVMTimesRecord(
                        number_of_features=row['number_of_features'],
                        number_of_samples=row['number_of_samples'],
                        execution_time=row['execution_time'],
                        test_time=row['test_times'],
                        fitness=row['fitness'],
                        train_score=row['train_scores'],
                        number_of_iterations=row['number_of_iterations'],
                        time_by_iteration=row['times_by_iteration'],
                        max_iterations=row['max_iterations'],
                        optimizer=row['optimizer'],
                        kernel=row['kernel'],
                        fs_experiment=fs_experiment
                    )
                ])

    def post(self, request: Request, job_id: str):
        # Sets new state and execution time
        fs_experiment = get_object_or_404(FSExperiment, emr_job_id=job_id)

        job_data = json.loads(request.body)

        with transaction.atomic():
            fs_experiment.state = BiomarkerState.COMPLETED

            # Checks state
            if job_data['state'] == 'COMPLETED':
                fs_experiment.state = BiomarkerState.COMPLETED

                # Saves execution time
                exec_time = self.__compute_execution_time(job_data['createdAt'], job_data['finishedAt'])
                fs_experiment.execution_time = exec_time
            elif job_data['state'] == 'CANCELLED':
                fs_experiment.state = BiomarkerState.STOPPED
            else:
                fs_experiment.state = BiomarkerState.FINISHED_WITH_ERROR
            fs_experiment.save(update_fields=['state'])

            emr_settings = settings.AWS_EMR_SETTINGS

            # Removes the molecules and clinical datasets from the shared folder
            self.__remove_datasets(fs_experiment, emr_settings)

            # If everything went well, gets results, saves the corresponding data and returns ok
            self.__save_results(fs_experiment, emr_settings)

        return Response({'ok': True})
