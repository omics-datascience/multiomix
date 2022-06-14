from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from biomarkers.models import Biomarker
from biomarkers.serializers import BiomarkerSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from common.pagination import StandardResultsSetPagination


class BiomarkerList(generics.ListCreateAPIView):
    """REST endpoint: list and create for Biomarker model"""

    def get_queryset(self):
        return Biomarker.objects.filter(user=self.request.user)

    serializer_class = BiomarkerSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['type']
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
