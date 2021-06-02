import numpy as np
from django.db import transaction
from django.http.response import Http404
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.models import get_combination_class, GeneGEMCombination
from api_service.models_choices import ExperimentType
from api_service.pipelines import global_pipeline_manager
from statistical_properties.serializers import SourceDataStatisticalPropertiesSerializer
from common.functions import get_integer_enum_from_value
from statistical_properties.statistics_utils import COMMON_DECIMAL_PLACES, compute_source_statistical_properties

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
