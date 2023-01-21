from rest_framework import serializers
from .models import Biomarker, GeneIdentifier, MethylationIdentifier, CNAIdentifier, MiRNAIdentifier
from tags.serializers import TagSerializer
from drf_writable_nested import WritableNestedModelSerializer

class GeneIdentifierSerializer(serializers.ModelSerializer):
    """GeneIdentifier serializer"""

    class Meta:
        model = GeneIdentifier
        exclude = ['biomarker']

class MiRNAIdentifierSerializer(serializers.ModelSerializer):
    """MiRNAIdentifier serializer"""

    class Meta:
        model = MiRNAIdentifier
        exclude = ['biomarker']

class CNAIdentifierSerializer(serializers.ModelSerializer):
    """CNAIdentifier serializer"""

    class Meta:
        model = CNAIdentifier
        exclude = ['biomarker']

class MethylationIdentifierSerializer(serializers.ModelSerializer):
    """MethylationIdentifier serializer"""

    class Meta:
        model = MethylationIdentifier
        exclude = ['biomarker']


class BiomarkerSerializer(WritableNestedModelSerializer):
    """Biomarker model serializer"""
    number_of_genes = serializers.SerializerMethodField(method_name='get_number_of_genes')
    number_of_mirnas = serializers.SerializerMethodField(method_name='get_number_of_mirnas')
    number_of_cnas = serializers.SerializerMethodField(method_name='get_number_of_cnas')
    number_of_methylations = serializers.SerializerMethodField(method_name='get_number_of_methylations')

    genes = GeneIdentifierSerializer(many=True, required=False)
    mirnas = MiRNAIdentifierSerializer(many=True, required=False)
    cnas = CNAIdentifierSerializer(many=True, required=False)
    methylations = MethylationIdentifierSerializer(many=True, required=False)

    tag = TagSerializer(required=False)

    class Meta:
        model = Biomarker
        exclude = ['user']

    @staticmethod
    def get_number_of_genes(ins: Biomarker) -> int:
        """Gets the number of genes in this Biomarker"""
        return ins.genes.count()

    @staticmethod
    def get_number_of_mirnas(ins: Biomarker) -> int:
        """Gets the number of miRNAs in this Biomarker"""
        return ins.mirnas.count()

    @staticmethod
    def get_number_of_cnas(ins: Biomarker) -> int:
        """Gets the number of CNAs in this Biomarker"""
        return ins.cnas.count()

    @staticmethod
    def get_number_of_methylations(ins: Biomarker) -> int:
        """Gets the number of Methylations in this Biomarker"""
        return ins.methylations.count()
