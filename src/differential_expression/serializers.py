from django.contrib.auth.models import User
from rest_framework import serializers

from api_service.serializers import ExperimentSourceSerializer, ExperimentClinicalSourceSerializer
from differential_expression.models import (
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentResult
)
from institutions.models import Institution


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple serializer for User model."""

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'email']


class InstitutionSimpleSerializer(serializers.ModelSerializer):
    """Simple serializer for Institution model."""

    class Meta:
        model = Institution
        fields = ['id', 'name']
        read_only_fields = ['id', 'name']


class DifferentialExpressionExperimentResultSerializer(serializers.ModelSerializer):
    """
    Serializer for Differential Expression Experiment Results.
    """
    is_significant = serializers.SerializerMethodField()

    class Meta:
        model = DifferentialExpressionExperimentResult
        fields = ['id', 'gene', 'ave_expr', 'p_value', 'adj_p_val', 'log_fc', 't_statistic', 'b_statistic',
                  'is_significant']

    @staticmethod
    def get_is_significant(obj):
        """Check if this gene is significantly differentially expressed."""
        return obj.adj_p_val <= 0.05 and abs(obj.log_fc) >= 1.0


class DifferentialExpressionExperimentListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for differential expression experiments list view.
    Returns essential fields for table display: id, user, name, description, created_at,
    state, clinical_source, mrna_source, and is_public.
    Uses compatible source serializers that match frontend DjangoExperimentSource interface.
    """
    # Sources - using standard API serializers compatible with frontend interfaces
    clinical_source = ExperimentClinicalSourceSerializer(read_only=True)
    mrna_source = ExperimentSourceSerializer(read_only=True)
    user = UserSimpleSerializer(read_only=True)

    # State information
    state_display = serializers.CharField(source='get_state_display', read_only=True)

    class Meta:
        model = DifferentialExpressionExperiment
        fields = [
            'id',  # Experiment ID
            'user',  # User ID (compatible with frontend expectations)
            'name',  # Experiment name
            'description',  # Experiment description
            'created_at',  # Creation date
            'state',  # Experiment state
            'state_display',  # Human-readable state
            'clinical_source',  # Clinical data source (ExperimentClinicalSourceSerializer)
            'mrna_source',  # mRNA data source (ExperimentSourceSerializer)
            'is_public',  # Public visibility flag
            'tool'
        ]
        read_only_fields = [
            'id', 'created_at', 'state', 'state_display'
        ]


class DifferentialExpressionExperimentSerializer(serializers.ModelSerializer):
    """
    Serializer for Differential Expression Experiment (General view with all fields).
    """
    user = UserSimpleSerializer(read_only=True)
    clinical_source = ExperimentClinicalSourceSerializer(read_only=True)
    mrna_source = ExperimentSourceSerializer(read_only=True)

    # Computed fields
    has_results = serializers.SerializerMethodField(method_name='get_has_results')
    results_count = serializers.SerializerMethodField(method_name='get_results_count')
    significant_genes_count = serializers.SerializerMethodField(method_name='get_significant_genes_count')
    state_display = serializers.CharField(source='get_state_display', read_only=True)

    class Meta:
        model = DifferentialExpressionExperiment
        fields = [
            'id', 'name', 'description', 'user', 'clinical_source', 'mrna_source',
            'clinical_attribute', 'tool', 'threshold_percentile', 'threshold', 'top', 'state', 'state_display',
            'execution_time', 'created_at', 'updated_at', 'is_public',
            'has_results', 'results_count', 'significant_genes_count'
        ]
        read_only_fields = [
            'id', 'execution_time', 'created_at', 'updated_at',
            'has_results', 'results_count', 'significant_genes_count'
        ]

    @staticmethod
    def get_has_results(obj: DifferentialExpressionExperiment) -> bool:
        """Check if the experiment has results."""
        return obj.results.exists()

    @staticmethod
    def get_results_count(obj: DifferentialExpressionExperiment) -> int:
        """Get the total number of genes in results."""
        return obj.results.count()

    @staticmethod
    def get_significant_genes_count(obj: DifferentialExpressionExperiment) -> int:
        """Get the number of significant genes (adj.P.Val <= 0.05 and |logFC| >= 1.0)."""
        return obj.get_significant_genes().count()


class DifferentialExpressionExperimentDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for Differential Expression Experiment (Detail view).
    Includes additional information like shared users and institutions.
    """
    #shared_users = UserSimpleSerializer(many=True, read_only=True)
    #shared_institutions = InstitutionSimpleSerializer(many=True, read_only=True)

    class Meta:#DifferentialExpressionExperimentSerializer.Meta):
        fields = '__all__'
        model = DifferentialExpressionExperimentResult