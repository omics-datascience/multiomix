from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service
from biomarkers.models import Biomarker, BiomarkerState, BiomarkerOrigin
from biomarkers.serializers import BiomarkerSerializer, TrainedModelSerializer, StatisticalValidationSerializer
from common.pagination import StandardResultsSetPagination
from common.response import generate_json_response_or_404
from django.db.models import Q, Count


class BiomarkerList(generics.ListCreateAPIView):
    """REST endpoint: list and create for Biomarker model"""

    def get_queryset(self):
        only_successful = self.request.GET.get('onlySuccessful') == 'true'
        biomarkers = Biomarker.objects.filter(user=self.request.user)
        if only_successful:
            # In this case shows only Biomarkers that are valid (completed and have at least a molecule)
            biomarkers = biomarkers.annotate(
                count_number_of_mrnas=Count('mrnas'),
                count_number_of_mirnas=Count('mirnas'),
                count_number_of_cnas=Count('cnas'),
                count_number_of_methylations=Count('methylations')
            ).filter(
                Q(state=BiomarkerState.COMPLETED) & (
                        Q(count_number_of_mrnas__gt=0) |
                        Q(count_number_of_mirnas__gt=0) |
                        Q(count_number_of_cnas__gt=0) |
                        Q(count_number_of_methylations__gt=0)
                )
            )


        return biomarkers

    def perform_create(self, biomarker: Biomarker):
        """Adds some fields on saving"""
        # NOTE: it's always a manual creating if the Biomarker is created from this endpoint
        biomarker.save(origin=BiomarkerOrigin.MANUAL, state=BiomarkerState.COMPLETED, user=self.request.user)

    serializer_class = BiomarkerSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['tag']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'description', 'tag', 'upload_date']


class BiomarkerDetail(generics.RetrieveUpdateDestroyAPIView):
    """REST endpoint: get, modify and delete for Biomarker model"""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    serializer_class = BiomarkerSerializer
    permission_classes = [permissions.IsAuthenticated]


@login_required
def biomarkers_action(request):
    """Biomarkers Panel view"""
    return render(request, "frontend/biomarkers.html")


class GeneSymbolsFinder(APIView):
    """Generates a query to search genes through BioAPI"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request):
        data = global_mrna_service.get_bioapi_service_content('gene-symbols-finder', request.GET, is_paginated=False)
        return generate_json_response_or_404(data)


class GeneSymbols(APIView):
    """Get the aliases for a list of genes from BioAPI"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        data = global_mrna_service.get_bioapi_service_content(
            'gene-symbols',
            request_params=request.data,
            is_paginated=False,
            method='post'
        )
        return generate_json_response_or_404(data)


class MiRNACodesFinder(APIView):
    """Generates a query to search miRNAs through Modulector"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request):
        data = global_mrna_service.get_modulector_service_content('mirna-codes-finder', request.GET, is_paginated=False)
        return generate_json_response_or_404(data)


class MiRNACodes(APIView):
    """Get the aliases for a list of miRNAs"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        data = global_mrna_service.get_modulector_service_content(
            'mirna-codes',
            request_params=request.data,
            is_paginated=False,
            method='post'
        )
        return generate_json_response_or_404(data)


class MethylationSitesFinder(APIView):
    """Generates a query to search Methylation sites through Modulector"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request):
        data = global_mrna_service.get_modulector_service_content('methylation-sites-finder', request.GET,
                                                                  is_paginated=False)
        return generate_json_response_or_404(data)


class MethylationSites(APIView):
    """Get the aliases for a list of Methylation sites from Modulector"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        data = global_mrna_service.get_modulector_service_content(
            'methylation-sites',
            request_params=request.data,
            is_paginated=False,
            method='post'
        )
        return generate_json_response_or_404(data)


class TrainedModelsOfBiomarker(generics.RetrieveAPIView):
    """Get all the trained models for a specific Biomarker."""

    def get_queryset(self):
        biomarker_pk = self.request.GET.get('biomarker_pk')
        biomarker = get_object_or_404(Biomarker, pk=biomarker_pk)
        return biomarker.trained_models.all()

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TrainedModelSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    # filterset_fields = []  # TODO: complete, maybe is useful to get type of model or type of task
    # search_fields = []  # TODO: complete when implemented name and description
    ordering_fields = ['best_fitness_value', 'created']


class BiomarkerStatisticalValidations(generics.ListAPIView):
    """Get all the statistical validations for a specific Biomarker."""

    def get_queryset(self):
        biomarker_pk = self.request.GET.get('biomarker_pk')
        biomarker = get_object_or_404(Biomarker, pk=biomarker_pk)
        return biomarker.statistical_validations.all()

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StatisticalValidationSerializer
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['type']
    search_fields = ['name', 'description']
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    ordering_fields = ['created']
