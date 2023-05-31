from drf_writable_nested import WritableNestedModelSerializer
from rest_framework import serializers
from .models import TrainedModel, ClusterLabel, ClusterLabelsSet, PredictionRangeLabelsSet, PredictionRangeLabel


class ClusterLabelSerializer(serializers.ModelSerializer):
    """Serializer for ClusterLabel model."""

    class Meta:
        model = ClusterLabel
        exclude = ['cluster_label_set']


class ClusterLabelsSetSerializer(WritableNestedModelSerializer):
    """Serializer for ClusterLabelsSet model."""
    labels = ClusterLabelSerializer(many=True)
    trained_model = serializers.PrimaryKeyRelatedField(queryset=TrainedModel.objects.all())

    class Meta:
        model = ClusterLabelsSet
        fields = '__all__'


class PredictionRangeLabelSerializer(serializers.ModelSerializer):
    """Serializer for PredictionRangeLabel model."""

    class Meta:
        model = PredictionRangeLabel
        exclude = ['prediction_range_labels_set']


class PredictionRangeLabelsSetSerializer(WritableNestedModelSerializer):
    """Serializer for PredictionRangeLabelsSet model."""
    labels = PredictionRangeLabelSerializer(many=True)
    trained_model = serializers.PrimaryKeyRelatedField(queryset=TrainedModel.objects.all())

    class Meta:
        model = PredictionRangeLabelsSet
        fields = '__all__'
