from copy import deepcopy
from typing import List, Optional, Dict
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service
from biomarkers.models import Biomarker, BiomarkerState, BiomarkerOrigin, MoleculeIdentifier
from biomarkers.serializers import BiomarkerSerializer, TrainedModelSerializer, MoleculeIdentifierSerializer, \
    BiomarkerSimpleSerializer
from common.pagination import StandardResultsSetPagination
from common.response import generate_json_response_or_404
from django.db.models import Q, Count, QuerySet


class BiomarkerList(generics.ListAPIView):
    """REST endpoint: list for Biomarker model"""

    def get_queryset(self):
        only_successful = self.request.GET.get('onlySuccessful') == 'true'
        biomarkers = Biomarker.objects.filter(user=self.request.user)
        if only_successful:
            # In this case shows only Biomarkers that are valid (completed and have at least a molecule)
            biomarkers = biomarkers.alias(
                count_number_of_mrnas=Count('mrnas'),
                count_number_of_mirnas=Count('mirnas'),
                count_number_of_cnas=Count('cnas'),
                count_number_of_methylations=Count('methylations'),
                total_molecules=Count('mrnas') + Count('mirnas') + Count('cnas') + Count('methylations')
            ).filter(
                Q(state=BiomarkerState.COMPLETED) & (
                        Q(count_number_of_mrnas__gt=0) |
                        Q(count_number_of_mirnas__gt=0) |
                        Q(count_number_of_cnas__gt=0) |
                        Q(count_number_of_methylations__gt=0)
                ) & Q(total_molecules__gt=1)  # Optimizing a 1 molecule Biomarker is not useful
            )

        return biomarkers

    serializer_class = BiomarkerSimpleSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['tag']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'description', 'tag', 'upload_date']


class BiomarkerCreate(generics.CreateAPIView):
    """REST endpoint: create for Biomarker model"""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    def perform_create(self, biomarker: Biomarker):
        """Adds some fields on saving"""
        # NOTE: it's always a manual creating if the Biomarker is created from this endpoint
        biomarker.save(origin=BiomarkerOrigin.MANUAL, state=BiomarkerState.COMPLETED, user=self.request.user)

    serializer_class = BiomarkerSerializer
    permission_classes = [permissions.IsAuthenticated]


class BiomarkerDetail(generics.RetrieveUpdateDestroyAPIView):
    """REST endpoint: get, modify and delete for Biomarker model"""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    serializer_class = BiomarkerSerializer
    permission_classes = [permissions.IsAuthenticated]


class BiomarkerClone(APIView):
    """Clones a Biomarker instance."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def __copy_molecules_instances(biomarker: Biomarker, molecules: QuerySet[MoleculeIdentifier]):
        """Copies the molecules instances from a Biomarker to another."""
        for molecule in molecules:
            molecule.pk = None
            molecule.biomarker = biomarker
            molecule.save()

    def get(self, request: Request, pk: int):
        biomarker = get_object_or_404(Biomarker, pk=pk, user=request.user)

        with transaction.atomic():
            biomarker_copy: Biomarker = deepcopy(biomarker)
            biomarker_copy.pk = None
            biomarker_copy.name = f'{biomarker.name} (copy)'
            biomarker_copy.origin = BiomarkerOrigin.MANUAL
            biomarker_copy.state = BiomarkerState.COMPLETED

            # Needs to be saved before copying the molecules instances
            biomarker_copy.save()

            # Copies all the related models
            self.__copy_molecules_instances(biomarker_copy, biomarker.mrnas.all())
            self.__copy_molecules_instances(biomarker_copy, biomarker.mirnas.all())
            self.__copy_molecules_instances(biomarker_copy, biomarker.cnas.all())
            self.__copy_molecules_instances(biomarker_copy, biomarker.methylations.all())


        return Response({'ok': True})


@login_required
def biomarkers_action(request):
    """Biomarkers Panel view"""
    return render(request, "frontend/biomarkers.html", context={
        'enable_aws_emr_integration': settings.ENABLE_AWS_EMR_INTEGRATION,
        'min_iterations_metaheuristics': settings.MIN_ITERATIONS_METAHEURISTICS,
        'max_iterations_metaheuristics': settings.MAX_ITERATIONS_METAHEURISTICS,
        'min_stars_bbha': settings.MIN_STARS_BBHA,
        'max_stars_bbha': settings.MAX_STARS_BBHA,
        'max_features_cox_regression': settings.MAX_FEATURES_COX_REGRESSION,
        'max_features_blind_search': settings.MAX_FEATURES_BLIND_SEARCH,
        'min_features_metaheuristics': settings.MIN_FEATURES_METAHEURISTICS
    })


def get_gene_aliases(genes_ids: List[str]) -> Optional[Dict]:
    """Get the aliases for a list of genes from BioAPI"""
    return global_mrna_service.get_bioapi_service_content(
        'gene-symbols',
        request_params={'gene_ids': genes_ids},
        is_paginated=False,
        method='post'
    )

def find_genes_from_request(request: Request) -> List[Dict]:
    """
    Generates the structure for the frontend for a list of genes. The needed structure is a list of dicts with
    the following keys: molecule, standard
    """
    genes_found = global_mrna_service.get_bioapi_service_content('gene-symbols-finder',
                                                                 request.GET, is_paginated=False)
    aliases = get_gene_aliases(genes_found)
    return [{'molecule': gene, 'standard': aliases.get(gene, [None])[0]} for gene in genes_found]


class GeneSymbols(APIView):
    """Genes finder and genes symbols validator services."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: Request):
        """Generates a query to search genes through BioAPI"""
        data = find_genes_from_request(request)

        return generate_json_response_or_404(data)

    @staticmethod
    def post(request: Request):
        """Get the aliases for a list of genes from BioAPI"""
        data = get_gene_aliases(request.data.get('gene_ids'))
        return generate_json_response_or_404(data)


class MiRNACodes(APIView):
    """miRNA symbols finder and miRNA symbols validator services."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def __get_mirna_aliases(mirna_codes: List[str]) -> Optional[Dict]:
        """Get the aliases for a list of miRNAs through Modulector"""
        return global_mrna_service.get_modulector_service_content(
            'mirna-codes',
            request_params={'mirna_codes': mirna_codes},
            is_paginated=False,
            method='post'
        )

    def get(self, request):
        """Generates a query to search miRNAs through Modulector"""
        mirnas_found = global_mrna_service.get_modulector_service_content('mirna-codes-finder',
                                                                          request.GET, is_paginated=False)

        # Generates the structure for the frontend
        aliases = self.__get_mirna_aliases(mirnas_found)
        data = [{'molecule': mirna, 'standard': aliases.get(mirna, '')} for mirna in mirnas_found]

        return generate_json_response_or_404(data)

    def post(self, request: Request):
        """Get the aliases for a list of miRNAs through Modulector"""
        data = self.__get_mirna_aliases(request.data.get('mirna_codes'))

        # Standardizes the response to the same structure as mRNA and Methylation services (in case of null values
        # this returns an empty array). This is implemented this way because the miRNA service returns a unique string
        # or null instead of an array
        if data is not None:
            data = {k: [v] if v is not None else [] for k, v in data.items()}

        return generate_json_response_or_404(data)


class MethylationSites(APIView):
    """Methylation sites finder and methylation sites validator services."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def __get_methylation_sites_aliases(methylation_sites: List[str]) -> Optional[Dict]:
        """Get the aliases for a list of Methylation sites through Modulector"""
        return global_mrna_service.get_modulector_service_content(
            'methylation-sites',
            request_params={'methylation_sites': methylation_sites},
            is_paginated=False,
            method='post'
        )

    def get(self, request: Request):
        """Generates a query to search Methylation sites through Modulector"""
        # methylation_sites = request.GET.get('methylation_sites', '')

        # Gets the Methylation sites
        sites_found = global_mrna_service.get_modulector_service_content(
            'methylation-sites-finder',
            request_params=request.GET,
            is_paginated=False
        )

        # Generates the structure for the frontend
        aliases = self.__get_methylation_sites_aliases(sites_found)
        data = [{'molecule': site, 'standard': aliases.get(site, [None])[0]} for site in sites_found]

        # Appends genes to the response as cBioPortal has genes symbols and not Methylation sites
        data_genes = find_genes_from_request(request)
        data.extend(data_genes)

        return generate_json_response_or_404(data)

    def post(self, request: Request):
        """Get the aliases for a list of Methylation sites through Modulector"""
        list_of_molecules = request.data.get('methylation_sites')
        data = self.__get_methylation_sites_aliases(list_of_molecules)

        # Validates against genes DB as cBioPortal has genes symbols and not Methylation sites
        data_genes = get_gene_aliases(list_of_molecules)

        # Merges both dictionaries
        data = {**data, **data_genes}

        return generate_json_response_or_404(data)


class TrainedModelsOfBiomarker(generics.ListAPIView):
    """Get all the trained models for a specific Biomarker."""

    def get_queryset(self):
        biomarker_pk = self.request.GET.get('biomarker_pk')
        biomarker = get_object_or_404(Biomarker, pk=biomarker_pk)
        return biomarker.trained_models.all()

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TrainedModelSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['state', 'fitness_function']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'description', 'created', 'fitness_function', 'best_fitness_value']


class BiomarkerMolecules(generics.ListAPIView):
    """Get all the molecules for a specific Biomarker."""

    def get_queryset(self):
        biomarker_pk = self.request.GET.get('biomarker_pk')
        biomarker = get_object_or_404(Biomarker, pk=biomarker_pk)
        molecule_type = self.request.GET.get('type')
        return biomarker.all_molecules(molecule_type=molecule_type)

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MoleculeIdentifierSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['identifier']
    ordering_fields = ['identifier']
