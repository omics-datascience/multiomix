from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions
from .models import Tag
from .serializers import TagSerializer


class TagList(generics.ListCreateAPIView):
    """REST endpoint: list and create for Tag model"""

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, file_tag):
        file_tag.save(user=self.request.user)

    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]


class TagDetail(generics.RetrieveUpdateDestroyAPIView):
    """REST endpoint: get, modify or delete  for Tag model"""

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)

    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type']
