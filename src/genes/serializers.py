from rest_framework import serializers
from genes.models import Gene


class GeneForResultTableSerializer(serializers.ModelSerializer):
    """Gene serializer used in the result table view"""
    class Meta:
        model = Gene
        fields = ['type', 'chromosome', 'start', 'end', 'description']
