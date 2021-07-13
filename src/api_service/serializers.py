from datasets_synchronization.serializers import SimpleCGDSDatasetSerializer
from genes.serializers import GeneForResultTableSerializer
from tags.serializers import TagSerializer
from user_files.serializers import SimpleUserFileSerializer, UserFileSerializer
from .models import Experiment, ExperimentSource, GeneGEMCombination, GeneMiRNACombination, GeneCNACombination, \
    GeneMethylationCombination, ExperimentClinicalSource
from rest_framework import serializers


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
    class Meta:
        model = ExperimentSource
        fields = '__all__'

    def to_representation(self, instance):
        data = super(ExperimentSourceSerializer, self).to_representation(instance)

        # Adds number of rows and samples
        data['number_of_rows'] = instance.number_of_rows
        data['number_of_samples'] = instance.number_of_samples

        # If it's a UserFile, sets the file's URL
        if instance.user_file:
            data['user_file'] = SimpleUserFileSerializer(instance.user_file).data
        else:
            data['cgds_dataset'] = SimpleCGDSDatasetSerializer(instance.cgds_dataset).data

        return data


class ExperimentSerializer(serializers.ModelSerializer):
    """Experiment serializer"""

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
            'clinical_source_id'
        ]

    def to_representation(self, instance):
        # IMPORTANT: makes a nested representation of the UserFile's file path only
        # when it gets, but we can still sending only the UserFile's id when creating
        data = super(ExperimentSerializer, self).to_representation(instance)
        data['mRNA_source'] = ExperimentSourceSerializer(instance.mRNA_source).data
        data['gem_source'] = ExperimentSourceSerializer(instance.gem_source).data

        # Also, parses tag
        if instance.tag:
            data['tag'] = TagSerializer(instance.tag).data
        return data


class ExperimentClinicalSourceSerializer(serializers.ModelSerializer):
    """ExperimentClinicalSource serializer"""
    class Meta:
        model = ExperimentClinicalSource
        fields = '__all__'

    def to_representation(self, instance):
        data = super(ExperimentClinicalSourceSerializer, self).to_representation(instance)

        # Adds number of rows and samples
        data['number_of_rows'] = instance.number_of_rows
        data['number_of_samples'] = instance.number_of_samples

        # If it's a UserFile, sets the file's URL
        if instance.user_file:
            # For clinical file it's needed complete UserFile serializer, not simple
            data['user_file'] = UserFileSerializer(instance.user_file).data
        else:
            data['cgds_dataset'] = SimpleCGDSDatasetSerializer(instance.cgds_dataset).data
            data['extra_cgds_dataset'] = SimpleCGDSDatasetSerializer(instance.extra_cgds_dataset).data

        return data
