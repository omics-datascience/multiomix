from rest_framework import serializers
from rest_framework.generics import get_object_or_404
from feature_selection.fs_algorithms import FitnessFunction
from feature_selection.models import ClusterLabelsSet, ClusterLabel
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
            cluster_label_set = get_object_or_404(ClusterLabelsSet, pk=cluster_labels_set_pk)
            try:
                label_obj: ClusterLabel = cluster_label_set.labels.get(cluster_id=data['cluster'])
                data['cluster'] = label_obj.label
                data['color'] = label_obj.color
            except ClusterLabel.DoesNotExist:
                pass

        return data
