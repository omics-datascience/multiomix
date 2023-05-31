from rest_framework import serializers
from api_service.serializers import ExperimentSourceSerializer, ExperimentClinicalSourceSerializer
from feature_selection.fs_algorithms import FitnessFunction
from statistical_properties.models import NormalityTest, GoldfeldQuandtTest, LinearityTest, MonotonicTest, \
    BreuschPaganTest, SourceDataStatisticalProperties, SourceDataOutliers, StatisticalValidationSourceResult, \
    StatisticalValidation, MoleculeWithCoefficient, SampleAndCluster


class NormalityTestSerializer(serializers.ModelSerializer):
    """NormalityTest serializer"""
    class Meta:
        model = NormalityTest
        exclude = ['id']


class BreuschPaganTestSerializer(serializers.ModelSerializer):
    """BreuschPaganTest serializer"""
    class Meta:
        model = BreuschPaganTest
        exclude = ['id']


class GoldfeldQuandtTestSerializer(serializers.ModelSerializer):
    """GoldfeldQuandtTest serializer"""
    class Meta:
        model = GoldfeldQuandtTest
        exclude = ['id']


class LinearityTestSerializer(serializers.ModelSerializer):
    """LinearityTest serializer"""
    class Meta:
        model = LinearityTest
        exclude = ['id']


class MonotonicTestSerializer(serializers.ModelSerializer):
    """LinearityTest serializer"""
    class Meta:
        model = MonotonicTest
        exclude = ['id']


class SourceDataOutliersSerializer(serializers.ModelSerializer):
    """SourceDataOutliers serializer"""
    class Meta:
        model = SourceDataOutliers
        fields = ['sample_identifier', 'expression']


class SourceDataStatisticalPropertiesSerializer(serializers.ModelSerializer):
    """SourceDataStatisticalProperties serializer"""
    gene_normality = NormalityTestSerializer(read_only=True)
    gem_normality = NormalityTestSerializer(read_only=True)
    heteroscedasticity_breusch_pagan = BreuschPaganTestSerializer(read_only=True)
    homoscedasticity_goldfeld_quandt = GoldfeldQuandtTestSerializer(read_only=True)
    linearity = LinearityTestSerializer(read_only=True)
    monotonicity = MonotonicTestSerializer(read_only=True)

    class Meta:
        model = SourceDataStatisticalProperties
        fields = '__all__'

    def to_representation(self, instance):
        data = super(SourceDataStatisticalPropertiesSerializer, self).to_representation(instance)

        # Adds gene/GEM outliers
        data['gene_outliers'] = SourceDataOutliersSerializer(instance.gene_outliers, read_only=True, many=True).data
        data['gem_outliers'] = SourceDataOutliersSerializer(instance.gem_outliers, read_only=True, many=True).data

        return data


class StatisticalValidationSourceResultSerializer(serializers.ModelSerializer):
    """StatisticalValidationSourceResult serializer"""
    source = ExperimentSourceSerializer()

    class Meta:
        model = StatisticalValidationSourceResult
        fields = '__all__'


class StatisticalValidationSimpleSerializer(serializers.ModelSerializer):
    """StatisticalValidation serializer with few fields"""
    fitness_function = serializers.SerializerMethodField(method_name='get_fitness_function')
    trained_model = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = StatisticalValidation
        fields = ['id', 'name', 'description', 'state', 'created', 'fitness_function', 'trained_model']

    @staticmethod
    def get_fitness_function(ins: StatisticalValidation) -> FitnessFunction:
        """Gets the type of model used for training/testing (SVM/RF/Clustering)."""
        return ins.trained_model.fitness_function


class StatisticalValidationSerializer(serializers.ModelSerializer):
    """StatisticalValidation serializer with only the metrics."""

    class Meta:
        model = StatisticalValidation
        fields = [
            'id',
            'name',
            'description',
            'state',
            'created',
            'mean_squared_error',
            'c_index',
            'cox_c_index',
            'cox_log_likelihood',
            'r2_score'
        ]

class StatisticalValidationCompleteSerializer(serializers.ModelSerializer):
    """StatisticalValidation serializer with all the sources. TODO: check if used"""
    clinical_source = ExperimentClinicalSourceSerializer()

    # Sources
    mrna_source_result = StatisticalValidationSourceResultSerializer()
    mirna_source_result = StatisticalValidationSourceResultSerializer()
    cna_source_result = StatisticalValidationSourceResultSerializer()
    methylation_source_result = StatisticalValidationSourceResultSerializer()

    class Meta:
        model = StatisticalValidation
        fields = [
            'id',
            'name',
            'description',
            'state',
            'created',
            'mean_squared_error',
            'c_index',
            'cox_c_index',
            'cox_log_likelihood',
            'r2_score',
            'clinical_source',
            'mrna_source_result',
            'mirna_source_result',
            'cna_source_result',
            'methylation_source_result'
        ]


class MoleculeWithCoefficientSerializer(serializers.ModelSerializer):
    """MoleculeWithCoefficient serializer."""

    class Meta:
        model = MoleculeWithCoefficient
        exclude = ['type', 'statistical_validation']


class SampleAndClusterSerializer(serializers.ModelSerializer):
    """SampleAndCluster serializer."""

    class Meta:
        model = SampleAndCluster
        exclude = ['id']
