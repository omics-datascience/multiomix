from rest_framework import serializers
from feature_selection.fs_algorithms import FitnessFunction
from .models import InferenceExperiment, SampleAndClusterPrediction


class InferenceExperimentSerializer(serializers.ModelSerializer):
    """Serializer for InferenceExperiment model."""
    model = serializers.SerializerMethodField(method_name='get_model')
    trained_model = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = InferenceExperiment
        fields = ['id', 'name', 'description', 'created', 'model', 'state', 'trained_model']

    @staticmethod
    def get_model(ins: InferenceExperiment) -> FitnessFunction:
        """Gets the type of model used for training/testing (SVM/RF/Clustering)."""
        return ins.trained_model.fitness_function


class SampleAndClusterPredictionSerializer(serializers.ModelSerializer):
    """SampleAndClusterPrediction serializer."""

    class Meta:
        model = SampleAndClusterPrediction
        exclude = ['id']
