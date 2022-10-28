from rest_framework import serializers
from .models import Biomarker
from tags.serializers import TagSerializer

class BiomarkerSerializer(serializers.ModelSerializer):
    """Biomarker model serializer"""
    number_of_mrnas = serializers.SerializerMethodField(method_name='get_number_of_mrnas')
    tag = TagSerializer()
    class Meta:
        model = Biomarker
        exclude = ['user']

    def get_number_of_mrnas(self, ins: Biomarker):
        return ins.genes.count()