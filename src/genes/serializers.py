from rest_framework import serializers
from genes.models import Gene


class GeneForResultTableSerializer(serializers.ModelSerializer):
    """Gene serializer used in the result table view"""
    class Meta:
        model = Gene
        fields = ['type', 'chromosome', 'start', 'end', 'description']

class GeneGEMWithType(serializers.Serializer):
    """Serializer for GeneGEMWithType"""
    id = serializers.IntegerField()
    molecule_type = serializers.IntegerField()

