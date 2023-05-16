from rest_framework import serializers
from .models import TrainedModel, ClusterLabel


class ClusterLabelSerializer(serializers.ModelSerializer):
    """Serializer for ClusterLabel model."""
    trained_model = serializers.PrimaryKeyRelatedField(queryset=TrainedModel.objects.all())

    class Meta:
        model = ClusterLabel
        fields = '__all__'
