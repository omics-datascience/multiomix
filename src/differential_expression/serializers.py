from rest_framework import serializers

from differential_expression.models import DifferentialExpressionExperiment
from drf_writable_nested.serializers import WritableNestedModelSerializer


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
    
    # Results-related fields
    results_json = serializers.JSONField(read_only=True)
    has_results = serializers.SerializerMethodField()
    results_count = serializers.SerializerMethodField()
    significant_genes_count = serializers.SerializerMethodField()

    class Meta:
        model = DifferentialExpressionExperiment
        fields = '__all__'
    
    def get_has_results(self, obj):
        """Check if the experiment has results."""
        return obj.results_json is not None and len(obj.results_json) > 0
    
    def get_results_count(self, obj):
        """Get the total number of genes in results."""
        if obj.results_json:
            return len(obj.results_json)
        return 0
    
    def get_significant_genes_count(self, obj):
        """Get the number of significant genes (adj.P.Val <= 0.05)."""
        if not obj.results_json:
            return 0
        
        significant_count = 0
        for gene in obj.results_json:
            adj_p_val = gene.get('adj.P.Val', gene.get('adjusted_p_value', 1.0))
            if adj_p_val <= 0.05:
                significant_count += 1
        
        return significant_count