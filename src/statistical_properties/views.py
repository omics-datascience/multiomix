from typing import Optional
import numpy as np
from django.db import transaction
from django.db.models.functions import Abs
from django.http.response import Http404
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, generics, filters
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.models import get_combination_class, GeneGEMCombination, ExperimentSource
from api_service.models_choices import ExperimentType
from api_service.pipelines import global_pipeline_manager
from api_service.utils import get_experiment_source
from biomarkers.models import Biomarker, BiomarkerState
from common.exceptions import NoSamplesInCommon
from common.pagination import StandardResultsSetPagination
from common.utils import get_source_pk
from datasets_synchronization.models import SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleUserFile
from feature_selection.models import TrainedModel
from statistical_properties.models import StatisticalValidation, StatisticalValidationSourceResult
from statistical_properties.serializers import SourceDataStatisticalPropertiesSerializer, \
    StatisticalValidationSimpleSerializer, StatisticalValidationSerializer, MoleculeWithCoefficientSerializer
from common.functions import get_integer_enum_from_value
from statistical_properties.statistics_utils import COMMON_DECIMAL_PLACES, compute_source_statistical_properties
from statistical_properties.stats_service import global_stat_validation_service
from statistical_properties.survival_functions import generate_survival_groups_by_clustering
from user_files.models_choices import FileType
from user_files.serializers import SurvivalColumnsTupleUserFileSimpleSerializer

NUMBER_OF_NEEDED_SAMPLES: int = 3


class CombinationSourceDataStatisticalPropertiesDetails(APIView):
    """REST endpoint: get for a Gene x GEM SourceDataStatisticalProperties model"""
    @staticmethod
    def get(request, pk=None):
        combination_type = request.GET.get('experiment_type', None)
        combination_type: ExperimentType = get_integer_enum_from_value(combination_type, ExperimentType)
        if combination_type is None:
            raise Http404('Missing required parameters')

        # Gets the specific GenexGEM combination
        combination_class = get_combination_class(combination_type)
        queryset = combination_class.objects.all()
        gene_gem_combination: GeneGEMCombination = get_object_or_404(queryset, pk=pk)
        source_stats_props = gene_gem_combination.source_statistical_data

        # If it wasn't computed previously, computes all the statistical properties
        gene = gene_gem_combination.gene_name
        gem = gene_gem_combination.gem
        gene_data, gem_data, gene_samples, gem_samples = global_pipeline_manager.get_valid_data_from_sources(
            gene_gem_combination.experiment,
            gene,
            gem,
            round_values=False,
            return_samples_identifiers=True
        )

        # Most of the statistics need at least 3 samples
        if len(gene_data) < NUMBER_OF_NEEDED_SAMPLES or len(gem_data) < NUMBER_OF_NEEDED_SAMPLES:
            source_stats_props = None
            is_data_ok = False
        else:
            is_data_ok = True
            if source_stats_props is None:
                with transaction.atomic():
                    # All the Foreign fields' objects are saved in compute_source_statistical_properties()
                    source_stats_props = compute_source_statistical_properties(
                        gene_data,
                        gem_data,
                        gene_samples,
                        gem_samples
                    )
                    gene_gem_combination.source_statistical_data = source_stats_props
                    gene_gem_combination.save()

            # Rounds to improve network usage and performance in frontend charts
            gene_data = np.round(gene_data, COMMON_DECIMAL_PLACES)
            gem_data = np.round(gem_data, COMMON_DECIMAL_PLACES)

        # Serializes and adds Genes and GEMs data
        serializer = SourceDataStatisticalPropertiesSerializer(source_stats_props)
        data = serializer.data
        data['gene_data'] = gene_data
        data['gem_data'] = gem_data
        data['is_data_ok'] = is_data_ok

        return Response(data)

    permission_classes = [permissions.IsAuthenticated]


class BiomarkerStatisticalValidations(generics.ListAPIView):
    """Get all the statistical validations for a specific Biomarker."""

    def get_queryset(self):
        biomarker_pk = self.request.GET.get('biomarker_pk')
        user = self.request.user
        biomarker = get_object_or_404(Biomarker, pk=biomarker_pk, user=user)
        return biomarker.statistical_validations.all()

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StatisticalValidationSimpleSerializer
    pagination_class = StandardResultsSetPagination
    search_fields = ['name', 'description']
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    ordering_fields = ['name', 'description', 'state', 'created']


class StatisticalValidationMetrics(generics.RetrieveAPIView):
    """Gets a specific statistical validation information."""

    def get_queryset(self):
        return StatisticalValidation.objects.filter(biomarker__user=self.request.user)

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StatisticalValidationSerializer


class StatisticalValidationBestFeatures(generics.ListAPIView):
    """Gets a list of top features for the StatisticalValidation details modal sorted by ABS(coefficient)."""

    def get_queryset(self):
        statistical_validation_pk = self.request.GET.get('statistical_validation_pk')
        stat_validation = get_object_or_404(StatisticalValidation, pk=statistical_validation_pk,
                                            biomarker__user=self.request.user)
        return stat_validation.molecules_with_coefficients.annotate(coeff_abs=Abs('coeff')).order_by('-coeff_abs')

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MoleculeWithCoefficientSerializer


class StatisticalValidationHeatMap(APIView):
    """Gets the expressions of all the molecules of a Biomarker for all the samples."""

    @staticmethod
    def get(request: Request):
        statistical_validation_pk = request.GET.get('statistical_validation_pk')
        stat_validation = get_object_or_404(StatisticalValidation, pk=statistical_validation_pk,
                                            biomarker__user=request.user)
        try:
            molecules_df = global_stat_validation_service.get_all_expressions(stat_validation)
            return Response({
                'data': molecules_df.to_dict('index'),
                'min': molecules_df.min().min(),
                'max': molecules_df.max().max()
            })
        except NoSamplesInCommon:
            return Response({
                'data': [],
                'min': 0,
                'max': 0
            })


    permission_classes = [permissions.IsAuthenticated]


class StatisticalValidationKaplanMeier(APIView):
    """REST endpoint: StatisticalValidation survival data"""
    @staticmethod
    def get(request: Request):
        statistical_validation_pk = request.GET.get('statistical_validation_pk')
        stat_validation = get_object_or_404(StatisticalValidation, pk=statistical_validation_pk,
                                            biomarker__user=request.user)

        # Gets Gene and GEM expression with time values
        molecules_df, clinical_df = global_stat_validation_service.get_molecules_and_clinical_df(stat_validation)

        classifier = stat_validation.trained_model.get_model_instance()
        groups = generate_survival_groups_by_clustering(classifier, molecules_df, clinical_df)

        return Response(groups)

    permission_classes = [permissions.IsAuthenticated]


class BiomarkerNewStatisticalValidations(APIView):
    """Runs a new statistical validation for a specific Biomarker."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def __create_statistical_validation_source(
            source: Optional[ExperimentSource]
    ) -> Optional[StatisticalValidationSourceResult]:
        """
        Creates a StatisticalValidationSourceResult instance from a ExperimentSource instance. In case of None,
        just ignores it.
        """
        if source is not None:
            return StatisticalValidationSourceResult.objects.create(source=source)
        return None

    def post(self, request: Request):
        with transaction.atomic():
            # Gets Biomarker instance
            biomarker_pk = request.POST.get('biomarkerPk')
            user = request.user
            biomarker: Biomarker = get_object_or_404(Biomarker, pk=biomarker_pk, user=user)

            # Gets the Biomarker's trained model instance
            trained_model_pk = request.POST.get('selectedTrainedModelPk')
            try:
                trained_model: TrainedModel = biomarker.trained_models.get(pk=trained_model_pk)
            except TrainedModel.DoesNotExist:
                return Http404('Trained model not found')

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
            stat_mrna_source = self.__create_statistical_validation_source(mrna_source)

            # miRNA source
            mirna_source_type = get_source_pk(request.POST, 'miRNAType')
            mirna_source, _mirna_clinical = get_experiment_source(mirna_source_type, request, FileType.MIRNA, 'miRNA')
            if biomarker.number_of_mirnas > 0 and mirna_source is None:
                raise ValidationError('Invalid miRNA source')
            stat_mirna_source = self.__create_statistical_validation_source(mirna_source)

            # CNA source
            cna_source_type = get_source_pk(request.POST, 'cnaType')
            cna_source, _cna_clinical = get_experiment_source(cna_source_type, request, FileType.CNA, 'cna')
            if biomarker.number_of_cnas > 0 and cna_source is None:
                raise ValidationError('Invalid CNA source')
            stat_cna_source = self.__create_statistical_validation_source(cna_source)

            # Methylation source
            methylation_source_type = get_source_pk(request.POST, 'methylationType')
            methylation_source, _methylation_clinical = get_experiment_source(methylation_source_type, request,
                                                                              FileType.METHYLATION, 'methylation')
            if biomarker.number_of_methylations > 0 and methylation_source is None:
                raise ValidationError('Invalid Methylation source')
            stat_methylation_source = self.__create_statistical_validation_source(methylation_source)

            # Gets survival tuple
            # TODO: implement the selection of the survival tuple from the frontend. This model has the corresponding
            # TODO: attribute!
            surv_tuple = clinical_source.get_survival_columns().first()
            if isinstance(surv_tuple, SurvivalColumnsTupleCGDSDataset):
                survival_column_tuple_user_file = None
                survival_column_tuple_cgds = surv_tuple
            elif isinstance(surv_tuple, SurvivalColumnsTupleUserFile):
                survival_column_tuple_user_file = surv_tuple
                survival_column_tuple_cgds = None
            else:
                raise ValidationError('Invalid survival tuple')

            # Creates the StatisticalValidation instance
            description = request.POST.get('description', 'null')
            description = description if description != 'null' else None

            stat_validation = StatisticalValidation.objects.create(
                name=request.POST.get('name'),
                description=description,
                biomarker=biomarker,
                trained_model=trained_model,
                state=BiomarkerState.IN_PROCESS,
                clinical_source=clinical_source,
                survival_column_tuple_user_file=survival_column_tuple_user_file,
                survival_column_tuple_cgds=survival_column_tuple_cgds,
                mrna_source_result=stat_mrna_source,
                mirna_source_result=stat_mirna_source,
                cna_source_result=stat_cna_source,
                methylation_source_result=stat_methylation_source,
            )

            # Runs statistical validation in background
            global_stat_validation_service.add_stat_validation(stat_validation)

        return Response({'ok': True})
