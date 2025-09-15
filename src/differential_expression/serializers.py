from rest_framework import serializers
from django.contrib.auth.models import User
from institutions.models import Institution
from differential_expression.models import (
    DifferentialExpressionExperiment, 
    DifferentialExpressionExperimentResult,
    DifferentialExpressionSource,
    DifferentialExpressionClinicalSource
)


class DifferentialExpressionSourceSerializer(serializers.ModelSerializer):
    """
    Serializer for Differential Expression Source.
    """
    source_type = serializers.SerializerMethodField()
    source_name = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()
    
    class Meta:
        model = DifferentialExpressionSource
        fields = ['id', 'source_type', 'source_name', 'file_type', 'number_of_samples', 'number_of_rows']
        read_only_fields = ['id', 'number_of_samples', 'number_of_rows']
    
    def get_source_type(self, obj):
        """Returns the type of source."""
        if obj.user_file:
            return 'user_file'
        elif obj.cgds_dataset:
            return 'cgds_dataset'
        return 'unknown'
    
    def get_source_name(self, obj):
        """Returns the name of the source."""
        try:
            valid_source = obj.get_valid_source()
            return getattr(valid_source, 'name', str(valid_source))
        except:
            return 'No source'
    
    def get_file_type(self, obj):
        """Returns the file type of the source."""
        try:
            valid_source = obj.get_valid_source()
            return getattr(valid_source, 'file_type', None)
        except:
            return None


class DifferentialExpressionClinicalSourceSerializer(serializers.ModelSerializer):
    """
    Serializer for Differential Expression Clinical Source.
    """
    source_type = serializers.SerializerMethodField()
    source_name = serializers.SerializerMethodField()
    attributes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DifferentialExpressionClinicalSource
        fields = ['id', 'source_type', 'source_name', 'attributes_count', 'number_of_samples', 'number_of_rows']
        read_only_fields = ['id', 'number_of_samples', 'number_of_rows']
    
    def get_source_type(self, obj):
        """Returns the type of clinical source."""
        if obj.user_file:
            return 'user_file'
        elif obj.cgds_dataset and obj.extra_cgds_dataset:
            return 'cgds_clinical_combined'
        elif obj.cgds_dataset:
            return 'cgds_clinical'
        return 'unknown'
    
    def get_source_name(self, obj):
        """Returns the name of the clinical source."""
        try:
            if obj.user_file:
                return obj.user_file.name
            elif obj.cgds_dataset and obj.extra_cgds_dataset:
                # For combined CGDS clinical sources, show both dataset names
                main_name = str(obj.cgds_dataset)
                extra_name = str(obj.extra_cgds_dataset)
                return f"Clinical Combined: {main_name} + {extra_name}"
            elif obj.cgds_dataset:
                return str(obj.cgds_dataset)
            return 'No source'
        except Exception as e:
            # More detailed error logging for debugging
            import logging
            logging.error(f"Error getting clinical source name: {e}")
            return 'No source'
    
    def get_attributes_count(self, obj):
        """Returns the number of clinical attributes."""
        try:
            return len(obj.get_attributes())
        except:
            return 0


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
        fields = ['id', 'gene', 'ave_expr', 'p_value', 'adj_p_val', 'log_fc', 't_statistic', 'b_statistic', 'is_significant'
        ]
        read_only_fields = ['id']
    
    def get_is_significant(self, obj):
        """Check if this gene is significantly differentially expressed."""
        return obj.adj_p_val <= 0.05 and abs(obj.log_fc) >= 1.0


class DifferentialExpressionExperimentListSerializer(serializers.ModelSerializer):
    """
    Serializer para la lista general de experimentos de expresión diferencial.
    Devuelve solo los campos solicitados: id, User, Name, Description, Date, State, Sources y si es publico.
    """
    # Sources - información de las fuentes de datos
    clinical_source = DifferentialExpressionClinicalSourceSerializer(read_only=True)
    mrna_source = DifferentialExpressionSourceSerializer(read_only=True)

    # State information
    state_display = serializers.CharField(source='get_state_display', read_only=True)

    class Meta:
        model = DifferentialExpressionExperiment
        fields = [
            'id',           # ID del experimento
            'user',         # Información del usuario
            'name',         # Nombre del experimento 
            'description',  # Descripción del experimento
            'created_at',   # Fecha de creación
            'state',        # Estado del experimento
            'state_display', # Estado legible
            'clinical_source', # Fuente de datos clínicos
            'mrna_source',     # Fuente de datos mRNA
            'is_public'     # Si es público
        ]
        read_only_fields = [
            'id', 'created_at', 'state', 'state_display'
        ]


class DifferentialExpressionExperimentSerializer(serializers.ModelSerializer):
    """
    Serializer for Differential Expression Experiment (General view with all fields).
    """
    user = UserSimpleSerializer(read_only=True)
    clinical_source = DifferentialExpressionClinicalSourceSerializer(read_only=True)
    mrna_source = DifferentialExpressionSourceSerializer(read_only=True)

    # Computed fields
    has_results = serializers.SerializerMethodField()
    results_count = serializers.SerializerMethodField()
    significant_genes_count = serializers.SerializerMethodField()
    state_display = serializers.CharField(source='get_state_display', read_only=True)

    class Meta:
        model = DifferentialExpressionExperiment
        fields = [
            'id', 'name', 'description', 'user', 'clinical_source', 'mrna_source',
            'clinical_attribute', 'threshold_percentile', 'threshold', 'top', 'state', 'state_display',
            'execution_time', 'created_at', 'updated_at', 'is_public',
            'has_results', 'results_count', 'significant_genes_count'
        ]
        read_only_fields = [
            'id', 'execution_time', 'created_at', 'updated_at', 
            'has_results', 'results_count', 'significant_genes_count'
        ]
    
    def get_has_results(self, obj):
        """Check if the experiment has results."""
        try:
            return obj.results.exists()
        except:
            return False
    
    def get_results_count(self, obj):
        """Get the total number of genes in results."""
        try:
            return obj.results.count()
        except:
            return 0
    
    def get_significant_genes_count(self, obj):
        """Get the number of significant genes (adj.P.Val <= 0.05 and |logFC| >= 1.0)."""
        try:
            return obj.get_significant_genes().count()
        except:
            return 0


class DifferentialExpressionExperimentDetailSerializer(DifferentialExpressionExperimentSerializer):
    """
    Detailed serializer for Differential Expression Experiment (Detail view).
    Includes additional information like shared users and institutions.
    """
    shared_users = UserSimpleSerializer(many=True, read_only=True)
    shared_institutions = InstitutionSimpleSerializer(many=True, read_only=True)
    
    class Meta(DifferentialExpressionExperimentSerializer.Meta):
        fields = DifferentialExpressionExperimentSerializer.Meta.fields + [
            'shared_users', 'shared_institutions', 'task_id', 'attempt'
        ]
        read_only_fields = DifferentialExpressionExperimentSerializer.Meta.read_only_fields + [
            'task_id', 'attempt'
        ]