from math import isnan
from typing import Optional, cast
from rest_framework import serializers
from api_service.serializers import ExperimentSourceSerializer, ExperimentClinicalSourceSerializer
from feature_selection.fs_algorithms import FitnessFunction
from feature_selection.models import TrainedModel, ClusteringScoringMethod, FitnessFunction, ClusteringParameters
from statistical_properties.models import NormalityTest, GoldfeldQuandtTest, LinearityTest, MonotonicTest, \
    BreuschPaganTest, SourceDataStatisticalProperties, SourceDataOutliers, StatisticalValidationSourceResult, \
    StatisticalValidation, MoleculeWithCoefficient, SampleAndCluster

from api_service.models import ExperimentClinicalSource, ExperimentSource


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
    gene_outliers = SourceDataOutliersSerializer(read_only=True, many=True)
    gem_outliers = SourceDataOutliersSerializer(read_only=True, many=True)

    class Meta:
        model = SourceDataStatisticalProperties
        fields = '__all__'


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

    clinical_source = ExperimentClinicalSourceSerializer()
    mrna_source_result = ExperimentSourceSerializer()
    mirna_source_result = ExperimentSourceSerializer()
    cna_source_result = ExperimentSourceSerializer()
    methylation_source_result = ExperimentSourceSerializer()

    class Meta:
        model = StatisticalValidation
        fields = ['id', 'name', 'description', 'state', 'created', 'fitness_function', 'trained_model',
                  'clinical_source', 'mrna_source_result', 'mirna_source_result', 'cna_source_result',
                  'methylation_source_result']

    @staticmethod
    def get_fitness_function(ins: StatisticalValidation) -> FitnessFunction:
        """Gets the type of model used for training/testing (SVM/RF/Clustering)."""
        return ins.trained_model.fitness_function


class StatisticalValidationSerializer(serializers.ModelSerializer):
    """StatisticalValidation serializer with only the metrics."""

    clinical_source = ExperimentSourceSerializer()
    mrna_source_result = ExperimentSourceSerializer()
    mirna_source_result = ExperimentSourceSerializer()
    cna_source_result = ExperimentSourceSerializer()
    methylation_source_result = ExperimentSourceSerializer()

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


class TrainedModelForTableSerializer(serializers.ModelSerializer):
    """TrainedModel serializer."""
    best_fitness_value = serializers.SerializerMethodField(method_name='get_best_fitness_value')
    fitness_metric = serializers.SerializerMethodField(method_name='get_fitness_metric')
    can_be_deleted = serializers.SerializerMethodField(method_name='get_can_be_deleted')

    clinical_source = ExperimentSourceSerializer()
    mrna_source = ExperimentSourceSerializer()
    mirna_source = ExperimentSourceSerializer()
    cna_source = ExperimentSourceSerializer()
    methylation_source = ExperimentSourceSerializer()

    class Meta:
        model = TrainedModel
        fields = ['id', 'name', 'fitness_function', 'description', 'state', 'created', 'best_fitness_value',
                  'fitness_metric', 'cv_folds_modified', 'can_be_deleted', 'clinical_source', 'mrna_source',
                  'mirna_source', 'cna_source',
                  'methylation_source', ]

    @staticmethod
    def get_best_fitness_value(instance: TrainedModel) -> Optional[float]:
        """Gets the best fitness value of the TrainedModel setting it to None if it's NaN"""
        if instance.best_fitness_value is not None and not isnan(instance.best_fitness_value):
            return instance.best_fitness_value
        return None

    @staticmethod
    def __get_scoring_method_description(scoring_method: ClusteringScoringMethod) -> Optional[str]:
        if scoring_method == ClusteringScoringMethod.C_INDEX:
            return 'C-Index'
        if scoring_method == ClusteringScoringMethod.LOG_LIKELIHOOD:
            return 'Log Likelihood'  # Default is kmeans
        return None

    def get_fitness_metric(self, instance: TrainedModel) -> Optional[str]:
        """Gets the fitness metric of the TrainedModel."""
        if instance.fitness_function == FitnessFunction.CLUSTERING:
            parameters = instance.get_model_parameter()
            if parameters is not None:
                parameters = cast(ClusteringParameters, parameters)
                return self.__get_scoring_method_description(parameters.scoring_method)
        elif instance.fitness_function in [FitnessFunction.SVM, FitnessFunction.RF]:
            return 'C-Index'

        return None

    @staticmethod
    def get_can_be_deleted(instance: TrainedModel) -> bool:
        """
        Gets if the TrainedModel can be deleted (i.e. doesn't have related StatisticalValidations or
        InferenceExperiments).
        """
        return not instance.statistical_validations.exists() and not instance.inference_experiments.exists()
