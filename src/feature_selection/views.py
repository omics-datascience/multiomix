import json
from typing import Optional
from django.db import transaction
from rest_framework import permissions
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.utils import get_experiment_source
from biomarkers.models import Biomarker
from common.utils import get_source_pk
from feature_selection.fs_service import global_fs_service
from feature_selection.models import FSExperiment, FitnessFunction, SVMParameters, ClusteringParameters
from user_files.models_choices import FileType


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
            fitness_function = request.POST.get('fitnessFunction')
            fitness_function_parameters = request.POST.get('fitnessFunctionParameters')
            if algorithm is None or fitness_function is None or fitness_function_parameters is None:
                raise ValidationError(f'Invalid parameters: algorithm: {algorithm} | fitness_function: {fitness_function} '
                                       f'| fitness_function_parameters: {fitness_function_parameters}')

            fitness_function_parameters = json.loads(fitness_function_parameters)

            # Creates FSExperiment instance
            fit_fun_enum = self.__get_fitness_function_enum(fitness_function)
            if fit_fun_enum is None:
                raise ValidationError('Invalid fitness function')

            fs_experiment = FSExperiment.objects.create(
                origin_biomarker=biomarker,
                algorithm=int(algorithm),
                fitness_function=int(fitness_function),
                clinical_source=clinical_source,
                mrna_source=mrna_source,
                mirna_source=mirna_source,
                cna_source=cna_source,
                methylation_source=methylation_source,
                user=request.user
            )

            # Generates the correct fitness function parameters
            if fit_fun_enum == FitnessFunction.CLUSTERING:
                parameters = fitness_function_parameters['clusteringParameters']
                ClusteringParameters.objects.create(
                    algorithm=parameters['algorithm'],
                    metric=parameters['metric'],
                    scoring_method=parameters['scoringMethod'],
                    experiment=fs_experiment
                )
            elif fit_fun_enum == FitnessFunction.SVM:
                parameters = fitness_function_parameters['svmParameters']
                SVMParameters.objects.create(
                    kernel=parameters['kernel'],
                    task=parameters['task'],
                    experiment=fs_experiment
                )
            else:
                raise ValidationError('RF is not implemented yet')

            # Adds Feature Selection experiment to the ThreadPool
            global_fs_service.add_experiment(experiment=fs_experiment)

        return Response({'ok': True})
