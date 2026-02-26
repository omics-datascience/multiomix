from rest_framework import generics, permissions, filters
from .models import Tissue
from .serializers import TissueSerializer


class TissueList(generics.ListAPIView):
    """REST endpoint: read-only list for Tissue model."""
    queryset = Tissue.objects.all()
    serializer_class = TissueSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']