from datasets_synchronization.serializers import SimpleCGDSDatasetSerializer
from genes.serializers import GeneForResultTableSerializer
from tags.serializers import TagSerializer
from user_files.serializers import SimpleUserFileSerializer, UserFileSerializer
from .models import Experiment, ExperimentSource, GeneGEMCombination, GeneMiRNACombination, GeneCNACombination, \
    GeneMethylationCombination, ExperimentClinicalSource
from rest_framework import serializers
from django.contrib.auth import get_user_model

class GeneGEMCombinationSerializer(serializers.ModelSerializer):
    """GeneGEMCombination serializer"""
    gene_extra_data = GeneForResultTableSerializer(source='gene', read_only=True)
    experiment_type = serializers.IntegerField(source='experiment.type')

    class Meta:
        model = GeneGEMCombination
        fields = ['id', 'gene', 'gem', 'correlation', 'p_value', 'adjusted_p_value', 'gene_extra_data',
                  'experiment_type']
        abstract = True


class GeneMiRNACombinationSerializer(GeneGEMCombinationSerializer):
    """GeneMiRNACombination serializer"""
    class Meta:
        model = GeneMiRNACombination
        fields = GeneGEMCombinationSerializer.Meta.fields


class GeneCNACombinationSerializer(GeneGEMCombinationSerializer):
    """GeneCNACombination serializer"""
    class Meta:
        model = GeneCNACombination
        fields = GeneGEMCombinationSerializer.Meta.fields


class GeneMethylationCombinationSerializer(GeneGEMCombinationSerializer):
    """GeneMethylationCombination serializer"""
    class Meta:
        model = GeneMethylationCombination
        fields = GeneGEMCombinationSerializer.Meta.fields


class ExperimentSerializerDetail(serializers.ModelSerializer):
    """Serializer for Experiment update"""
    class Meta:
        model = Experiment
        fields = ['id', 'name', 'description', 'tag']


class ExperimentSourceSerializer(serializers.ModelSerializer):
    """ExperimentSource serializer"""
    number_of_rows = serializers.IntegerField()
    number_of_samples = serializers.IntegerField()
    user_file = SimpleUserFileSerializer()
    cgds_dataset = SimpleCGDSDatasetSerializer()

    class Meta:
        model = ExperimentSource
        fields = '__all__'

class LimitedUserSerializer(serializers.ModelSerializer):
    """A lightweight serializer for User model"""
    class Meta:
        model = get_user_model()
        fields = ['id', 'username']

class ExperimentSerializer(serializers.ModelSerializer):
    """Experiment serializer"""
    mRNA_source = ExperimentSourceSerializer()
    gem_source = ExperimentSourceSerializer()
    user = LimitedUserSerializer()
    tag = TagSerializer()

    class Meta:
        model = Experiment
        fields = [
            'id',
            'name',
            'description',
            'mRNA_source',
            'gem_source',
            'submit_date',
            'minimum_coefficient_threshold',
            'state',
            'correlation_method',
            'evaluated_row_count',
            'result_total_row_count',
            'result_final_row_count',
            'p_values_adjustment_method',
            'type',
            'tag',
            'clinical_source_id',
            'is_public',
            'user'
        ]


class ExperimentClinicalSourceSerializer(serializers.ModelSerializer):
    """ExperimentClinicalSource serializer"""
    number_of_rows = serializers.IntegerField()
    number_of_samples = serializers.IntegerField()
    user_file = UserFileSerializer()
    cgds_dataset = SimpleCGDSDatasetSerializer()
    extra_cgds_dataset = SimpleCGDSDatasetSerializer()

    class Meta:
        model = ExperimentClinicalSource
        fields = '__all__'
