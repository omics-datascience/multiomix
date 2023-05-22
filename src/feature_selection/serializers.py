from drf_writable_nested import WritableNestedModelSerializer
from rest_framework import serializers
from .models import TrainedModel, ClusterLabel, ClusterLabelsSet


class ClusterLabelSerializer(serializers.ModelSerializer):
    """Serializer for ClusterLabel model."""

    class Meta:
        model = ClusterLabel
        exclude = ['cluster_label_set']


class ClusterLabelSetSerializer(WritableNestedModelSerializer):
    """Serializer for ClusterLabelSet model."""
    labels = ClusterLabelSerializer(many=True)
    trained_model = serializers.PrimaryKeyRelatedField(queryset=TrainedModel.objects.all())

    class Meta:
        model = ClusterLabelsSet
        fields = '__all__'