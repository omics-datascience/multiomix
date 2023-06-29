from math import isnan
from typing import Optional
from rest_framework import serializers
from feature_selection.models import TrainedModel
from user_files.models_choices import MoleculeType
from .models import Biomarker, MRNAIdentifier, MethylationIdentifier, CNAIdentifier, MiRNAIdentifier, MoleculeIdentifier
from tags.serializers import TagSerializer
from drf_writable_nested import WritableNestedModelSerializer


class MoleculeIdentifierSerializer(serializers.Serializer):
    """
    Serializer for all the types of molecules (MRNAIdentifier, MiRNAIdentifier, CNAIdentifier, or
    MethylationIdentifier). Gets their ID and identifier only.
    """
    id = serializers.IntegerField()
    identifier = serializers.CharField()
    type = serializers.SerializerMethodField(method_name='get_type')

    @staticmethod
    def get_type(instance: MoleculeIdentifier) -> MoleculeType:
        if isinstance(instance, MRNAIdentifier):
            return MoleculeType.MRNA
        if isinstance(instance, MiRNAIdentifier):
            return MoleculeType.MIRNA
        if isinstance(instance, CNAIdentifier):
            return MoleculeType.CNA
        return MoleculeType.METHYLATION


class MRNAIdentifierSerializer(serializers.ModelSerializer):
    """MRNAIdentifier serializer"""

    class Meta:
        model = MRNAIdentifier
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


class BiomarkerSimpleSerializer(WritableNestedModelSerializer):
    """Biomarker model serializer without the molecules."""
    number_of_mrnas = serializers.SerializerMethodField(method_name='get_number_of_mrnas')
    number_of_mirnas = serializers.SerializerMethodField(method_name='get_number_of_mirnas')
    number_of_cnas = serializers.SerializerMethodField(method_name='get_number_of_cnas')
    number_of_methylations = serializers.SerializerMethodField(method_name='get_number_of_methylations')
    has_fs_experiment = serializers.SerializerMethodField(method_name='get_has_fs_experiment')

    origin = serializers.IntegerField(required=False)
    state = serializers.IntegerField(required=False)

    tag = TagSerializer(required=False)

    class Meta:
        model = Biomarker
        exclude = ['user']

    @staticmethod
    def get_number_of_mrnas(ins: Biomarker) -> int:
        """Gets the number of genes in this Biomarker"""
        return ins.number_of_mrnas

    @staticmethod
    def get_number_of_mirnas(ins: Biomarker) -> int:
        """Gets the number of miRNAs in this Biomarker"""
        return ins.number_of_mirnas

    @staticmethod
    def get_number_of_cnas(ins: Biomarker) -> int:
        """Gets the number of CNAs in this Biomarker"""
        return ins.number_of_cnas

    @staticmethod
    def get_number_of_methylations(ins: Biomarker) -> int:
        """Gets the number of Methylations in this Biomarker"""
        return ins.number_of_methylations

    @staticmethod
    def get_has_fs_experiment(ins: Biomarker) -> bool:
        """Gets if the current Biomarker was created from a Feature Selection experiment"""
        return ins.has_fs_experiment


class BiomarkerSerializer(WritableNestedModelSerializer):
    """Biomarker model serializer."""
    number_of_mrnas = serializers.SerializerMethodField(method_name='get_number_of_mrnas')
    number_of_mirnas = serializers.SerializerMethodField(method_name='get_number_of_mirnas')
    number_of_cnas = serializers.SerializerMethodField(method_name='get_number_of_cnas')
    number_of_methylations = serializers.SerializerMethodField(method_name='get_number_of_methylations')
    has_fs_experiment = serializers.SerializerMethodField(method_name='get_has_fs_experiment')

    mrnas = MRNAIdentifierSerializer(many=True, required=False)
    mirnas = MiRNAIdentifierSerializer(many=True, required=False)
    cnas = CNAIdentifierSerializer(many=True, required=False)
    methylations = MethylationIdentifierSerializer(many=True, required=False)
    origin = serializers.IntegerField(required=False)
    state = serializers.IntegerField(required=False)

    tag = TagSerializer(required=False)

    class Meta:
        model = Biomarker
        exclude = ['user']

    @staticmethod
    def get_number_of_mrnas(ins: Biomarker) -> int:
        """Gets the number of genes in this Biomarker"""
        return ins.number_of_mrnas

    @staticmethod
    def get_number_of_mirnas(ins: Biomarker) -> int:
        """Gets the number of miRNAs in this Biomarker"""
        return ins.number_of_mirnas

    @staticmethod
    def get_number_of_cnas(ins: Biomarker) -> int:
        """Gets the number of CNAs in this Biomarker"""
        return ins.number_of_cnas

    @staticmethod
    def get_number_of_methylations(ins: Biomarker) -> int:
        """Gets the number of Methylations in this Biomarker"""
        return ins.number_of_methylations

    @staticmethod
    def get_has_fs_experiment(ins: Biomarker) -> bool:
        """Gets if the current Biomarker was created from a Feature Selection experiment"""
        return ins.has_fs_experiment


class TrainedModelSerializer(serializers.ModelSerializer):
    """TrainedModel serializer"""
    best_fitness_value = serializers.SerializerMethodField(method_name='get_best_fitness_value')

    class Meta:
        model = TrainedModel
        fields = ['id', 'name', 'fitness_function', 'description', 'state', 'created', 'best_fitness_value']

    @staticmethod
    def get_best_fitness_value(instance: TrainedModel) -> Optional[float]:
        """Gets the best fitness value of the TrainedModel setting it to None if it's NaN"""
        if instance.best_fitness_value is not None and not isnan(instance.best_fitness_value):
            return instance.best_fitness_value
        return None


