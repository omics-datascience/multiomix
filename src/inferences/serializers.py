from typing import Union
from django.db.models import Q, OuterRef
from rest_framework import serializers
from rest_framework.generics import get_object_or_404
from feature_selection.fs_algorithms import FitnessFunction
from feature_selection.models import ClusterLabelsSet, ClusterLabel, PredictionRangeLabelsSet, PredictionRangeLabel
from .models import InferenceExperiment, SampleAndClusterPrediction, SampleAndTimePrediction


def generate_prediction_condition(predicted_time: Union[float, OuterRef]) -> Q:
    """Generates a condition to filter the prediction range labels."""
    return Q(min_value__lte=predicted_time) & (
            Q(max_value__isnull=True) | (Q(max_value__isnull=False) & Q(max_value__gte=predicted_time))
    )

class InferenceExperimentSerializer(serializers.ModelSerializer):
    """Serializer for InferenceExperiment model."""
    model = serializers.SerializerMethodField(method_name='get_model')
    trained_model = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = InferenceExperiment
        fields = ['id', 'name', 'description', 'created', 'model', 'state', 'trained_model', 'clinical_source_id']

    @staticmethod
    def get_model(ins: InferenceExperiment) -> FitnessFunction:
        """Gets the type of model used for training/testing (SVM/RF/Clustering)."""
        return ins.trained_model.fitness_function


class SampleAndClusterPredictionSerializer(serializers.ModelSerializer):
    """SampleAndClusterPrediction serializer."""

    class Meta:
        model = SampleAndClusterPrediction
        exclude = ['id', 'experiment']

    def to_representation(self, instance: SampleAndClusterPrediction):
        """Checks if a ClusterLabelsSet was requested to get all the cluster labels."""
        data = super(SampleAndClusterPredictionSerializer, self).to_representation(instance)
        data['color'] = None

        request = self.context.get('request')
        if request is None:
            return data

        # If specified, gets the labels for a cluster set
        cluster_labels_set_pk = request.GET.get('cluster_labels_set_pk')

        if cluster_labels_set_pk:
            cluster_labels_set = get_object_or_404(ClusterLabelsSet, pk=cluster_labels_set_pk)
            # This should be always return a single object. But the first() prevents issues with duplicated
            # 'cluster_id' set in the ClusterLabel instances.
            cluster_id = data['cluster']
            label_obj: ClusterLabel = cluster_labels_set.labels.filter(cluster_id=cluster_id).first()
            if label_obj:
                label = label_obj.label
                color = label_obj.color
            else:
                label = cluster_id
                color = None
            data['cluster'] = label
            data['color'] = color

        return data


class SampleAndTimePredictionSerializer(serializers.ModelSerializer):
    """SampleAndTimePrediction serializer."""

    class Meta:
        model = SampleAndTimePrediction
        exclude = ['id', 'experiment']

    def to_representation(self, instance: SampleAndTimePrediction):
        """Checks if a ClusterLabelsSet was requested to get all the cluster labels."""
        data = super(SampleAndTimePredictionSerializer, self).to_representation(instance)
        data['color'] = None

        request = self.context.get('request')
        if request is None:
            return data

        # If specified, gets the labels for a range prediction set
        prediction_range_labels_set_pk = request.GET.get('prediction_range_labels_set_pk')

        if prediction_range_labels_set_pk:
            prediction_range_labels_set = get_object_or_404(PredictionRangeLabelsSet, pk=prediction_range_labels_set_pk)
            predicted_time = data['prediction']
            try:
                label_obj: PredictionRangeLabel = prediction_range_labels_set.labels.get(
                    generate_prediction_condition(predicted_time)
                )
                data['prediction'] = label_obj.label
                data['color'] = label_obj.color
            except PredictionRangeLabel.DoesNotExist:
                pass

        return data
