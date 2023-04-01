import json
from typing import Optional
from django.contrib.auth.decorators import login_required
from django.http import QueryDict
from django.shortcuts import render
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service
from api_service.utils import get_experiment_source
from biomarkers.models import Biomarker, BiomarkerState, BiomarkerOrigin
from biomarkers.serializers import BiomarkerSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from common.pagination import StandardResultsSetPagination
from common.response import generate_json_response_or_404
from user_files.models_choices import FileType


class BiomarkerList(generics.ListCreateAPIView):
    """REST endpoint: list and create for Biomarker model"""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    def perform_create(self, biomarker: Biomarker):
        """Adds some fields on saving"""
        # NOTE: it's always a manual creating if the Biomarker is created from this endpoint
        biomarker.save(origin=BiomarkerOrigin.MANUAL, state=BiomarkerState.CREATED, user=self.request.user)

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


class FeatureSelectionSubmit(APIView):
    """Endpoint to submit a Feature Selection experiment."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def __get_source_pk(post_request: QueryDict, key: str) -> Optional[int]:
        """
        Gets a PK as int from the POST QueryDict. None if it's invalid
        @param post_request: POST QueryDict
        @param key: Key in the POST QueryDict to retrieve
        @return: Int PK or None if it's invalid
        """
        content = post_request.get(key)
        if content is None or content == 'null':
            return None
        return int(content)

    def post(self, request: Request):
        # Gets Biomarker instance
        biomarker_pk = request.POST.get('biomarkerPk')
        biomarker: Biomarker = get_object_or_404(Biomarker, pk=biomarker_pk)

        # Clinical source
        clinical_source_type = self.__get_source_pk(request.POST, 'clinicalType')
        clinical_source, _clinical_aux = get_experiment_source(clinical_source_type, request, FileType.CLINICAL,
                                                               'clinical')
        if clinical_source is None:
            return ValidationError('Invalid clinical source')

        # mRNA source
        mrna_source_type = self.__get_source_pk(request.POST, 'mRNAType')
        mrna_source, mrna_clinical = get_experiment_source(mrna_source_type, request, FileType.MRNA, 'mRNA')
        if biomarker.number_of_mrnas > 0 and mrna_source is None:
            return ValidationError('Invalid mRNA source')

        # miRNA source
        mirna_source_type = self.__get_source_pk(request.POST, 'miRNAType')
        mirna_source, mirna_clinical = get_experiment_source(mirna_source_type, request, FileType.MIRNA, 'miRNA')
        if biomarker.number_of_mirnas > 0 and mirna_source is None:
            return ValidationError('Invalid miRNA source')

        # CNA source
        # TODO: remove block
        print(request.POST.get('cnaType'))
        print(type(request.POST.get('cnaType')))

        cna_source_type = self.__get_source_pk(request.POST, 'cnaType')
        cna_source, cna_clinical = get_experiment_source(cna_source_type, request, FileType.CNA, 'cna')
        if biomarker.number_of_cnas > 0 and cna_source is None:
            return ValidationError('Invalid CNA source')

        # Methylation source
        methylation_source_type = self.__get_source_pk(request.POST, 'methylationType')
        methylation_source, methylation_clinical = get_experiment_source(methylation_source_type, request,
                                                                         FileType.METHYLATION, 'methylation')
        if biomarker.number_of_methylations > 0 and methylation_source is None:
            return ValidationError('Invalid Methylation source')

        # Gets all the FS settings
        algorithm = request.POST.get('algorithm')
        fitness_function = request.POST.get('fitnessFunction')
        fitness_function_parameters = request.POST.get('fitnessFunctionParameters')
        if algorithm is None or fitness_function is None or fitness_function_parameters is None:
            return ValidationError(f'Invalid parameters: algorithm: {algorithm} | fitness_function: {fitness_function} '
                                   f'| fitness_function_parameters: {fitness_function_parameters}')

        fitness_function_parameters = json.loads(fitness_function_parameters)
        # TODO: remove block
        print('biomarker:', biomarker)
        print('algorithm:', algorithm)
        print('fitness_function:', fitness_function)
        print('fitness_function_parameters:', fitness_function_parameters)
        print(fitness_function_parameters)
        print(clinical_source,_clinical_aux)
        print(mrna_source,mrna_clinical)
        print(mirna_source,mirna_clinical)
        print(cna_source,cna_clinical)
        print(methylation_source,methylation_clinical)


        return Response({})
