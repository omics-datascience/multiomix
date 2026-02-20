from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework import permissions
from typing import List, Optional, Dict
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from rest_framework.request import Request
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service
from biomarkers.models import Biomarker, BiomarkerState, BiomarkerOrigin
from biomarkers.serializers import BiomarkerSerializer, BiomarkerSimpleSerializer, BiomarkerSimpleUpdateSerializer
from common.pagination import StandardResultsSetPagination
from common.response import generate_json_response_or_404
from django.db.models import Q

def index_action(request):
    """Index view"""
    return render(request, "frontend/index.html")


def about_us_action(request):
    """About us view"""
    return render(request, "frontend/about-us.html")


def terms_and_privacy_policy_action(request):
    """Site policy view"""
    return render(request, "frontend/site-policy.html")


@login_required
def gem_action(request):
    """GEM analysis view"""
    return render(
        request,
        "frontend/gem.html",
        {
            'maximum_number_of_open_tabs': settings.MAX_NUMBER_OF_OPEN_TABS,
            'threshold_to_consider_ordinal': settings.THRESHOLD_ORDINAL
        }
    )


@login_required
def datasets_action(request):
    """Datasets Manager view"""
    return render(request, "frontend/datasets.html")


@login_required
def survival_action(request):
    """Survival Analysis view"""
    return render(request, "frontend/survival.html")


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

class BiomarkerList(generics.ListAPIView):
    """REST endpoint: list for Biomarker model"""

    def get_queryset(self):
        user = self.request.user
        only_successful = self.request.GET.get('onlySuccessful') == 'true'
        biomarkers = Biomarker.objects.filter(
            Q(is_public=True) | Q(user=user) | Q(shared_institutions__institutionadministration__user=user)).distinct()

        if only_successful:
            # FIXME: this is VERY slow. Taking more than 20secs in production. Must parametrize the DB, maybe
            # FIXME: autovacuum settings could help
            # In this case shows only Biomarkers that are valid (completed and have at least two molecules,
            # optimizing a 1 molecule Biomarker is not useful)
            # biomarkers = biomarkers.alias(
            #     total_molecules=Count('mrnas') + Count('mirnas') + Count('cnas') + Count('methylations')
            # ).filter(state=BiomarkerState.COMPLETED, total_molecules__gt=1)
            biomarkers = biomarkers.filter(state=BiomarkerState.COMPLETED)

        return biomarkers

    serializer_class = BiomarkerSimpleSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['tag']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'description', 'tag', 'upload_date']

class BiomarkerSimpleUpdate(generics.UpdateAPIView):
    """REST endpoint: modify (only name and description) for Biomarker model."""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    serializer_class = BiomarkerSimpleUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

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

class BiomarkerCreate(generics.CreateAPIView):
    """REST endpoint: create for Biomarker model."""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    def perform_create(self, biomarker: Biomarker):
        """Adds some fields on saving"""
        # NOTE: it's always a manual creating if the Biomarker is created from this endpoint
        biomarker.save(origin=BiomarkerOrigin.MANUAL, state=BiomarkerState.COMPLETED, user=self.request.user)

    serializer_class = BiomarkerSerializer

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

    permission_classes = [permissions.IsAuthenticated]

def find_genes_from_request(request: Request) -> List[Dict]:
    """
    Generates the structure for the frontend for a list of genes. The needed structure is a list of dicts with
    the following keys: molecule, standard
    """
    genes_found = global_mrna_service.get_bioapi_service_content('gene-symbols-finder',
                                                                 request.GET, is_paginated=False)
    aliases = get_gene_aliases(genes_found)
    return [{'molecule': gene, 'standard': aliases.get(gene, [None])[0]} for gene in genes_found]


def get_gene_aliases(genes_ids: List[str]) -> Optional[Dict]:
    """Get the aliases for a list of genes from BioAPI"""
    return global_mrna_service.get_bioapi_service_content(
        'gene-symbols',
        request_params={'gene_ids': genes_ids},
        is_paginated=False,
        method='post'
    )
