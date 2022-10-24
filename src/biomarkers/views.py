from typing import Optional
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render
from rest_framework.views import APIView
from api_service.mrna_service import global_mrna_service
from biomarkers.models import Biomarker
from biomarkers.serializers import BiomarkerSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from common.pagination import StandardResultsSetPagination
from common.response import generate_json_response_or_404


class BiomarkerList(generics.ListCreateAPIView):
    """REST endpoint: list and create for Biomarker model"""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    serializer_class = BiomarkerSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['tag']
    search_fields = ['name']
    ordering_fields = ['name']


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


class GenesFinder(APIView):
    """Generates a query to search genes through BioAPI"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request):
        data = global_mrna_service.get_bioapi_service_content('genes-symbols-finder', request.GET, is_paginated=False)
        return generate_json_response_or_404(data)


class GenesSymbols(APIView):
    """Get the aliases for a list of genes"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        data = global_mrna_service.get_bioapi_service_content(
            'genes-symbols',
            request_params=request.data,
            is_paginated=False,
            method='post'
        )
        return generate_json_response_or_404(data)
