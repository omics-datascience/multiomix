from rest_framework import serializers

from differential_expression.models import DifferentialExpressionExperiment
from drf_writable_nested import WritableNestedModelSerializer


class DifferentialExpressionExperimentSerializer(WritableNestedModelSerializer):
    """
    Serializer for Differential Expression Experiment.
    """
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    clinical_source = serializers.CharField(max_length=255, required=False)
    mrna_source = serializers.CharField(max_length=255, required=False)

    class Meta:
        model = DifferentialExpressionExperiment
        fields = '__all__'