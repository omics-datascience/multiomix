from django.contrib import admin
from .models import (
    DifferentialExpressionSource,
    DifferentialExpressionClinicalSource,
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentResult
)


@admin.register(DifferentialExpressionSource)
class DifferentialExpressionSourceAdmin(admin.ModelAdmin):
    """Admin configuration for DifferentialExpressionSource model."""
    
    list_display = ('id', 'get_source_type', 'get_source_name', 'number_of_samples', 'number_of_rows')
    list_filter = ('user_file__file_type',)  # Removed cgds_dataset__file_type as it might not exist
    search_fields = ('user_file__name', 'cgds_dataset__name', 'user_file__user__username')
    readonly_fields = ('id', 'number_of_samples', 'number_of_rows')
    
    fieldsets = (
        ('Source Information', {
            'fields': ('id', 'user_file', 'cgds_dataset')
        }),
        ('Statistics', {
            'fields': ('number_of_samples', 'number_of_rows'),
            'classes': ('collapse',)
        }),
    )
    
    def get_source_type(self, obj):
        """Returns the type of source (UserFile or CGDS)."""
        if obj.user_file:
            return f"User File ({obj.user_file.file_type})"
        elif obj.cgds_dataset:
            return f"CGDS Dataset ({obj.cgds_dataset.file_type})"
        return "No source"
    get_source_type.short_description = 'Source Type'
    
    def get_source_name(self, obj):
        """Returns the name of the source."""
        try:
            valid_source = obj.get_valid_source()
            return valid_source.name if hasattr(valid_source, 'name') else str(valid_source)
        except:
            return "No source"
    get_source_name.short_description = 'Source Name'


@admin.register(DifferentialExpressionClinicalSource)
class DifferentialExpressionClinicalSourceAdmin(admin.ModelAdmin):
    """Admin configuration for DifferentialExpressionClinicalSource model."""
    
    list_display = ('id', 'get_source_type', 'get_source_name', 'get_attributes_count', 'number_of_samples')
    list_filter = ('user_file__file_type',)  # Removed cgds_dataset__file_type as it might not exist
    search_fields = ('user_file__name', 'cgds_dataset__name', 'user_file__user__username')
    readonly_fields = ('id', 'number_of_samples', 'number_of_rows', 'get_attributes_count')
    
    fieldsets = (
        ('Source Information', {
            'fields': ('id', 'user_file', 'cgds_dataset', 'extra_cgds_dataset')
        }),
        ('Statistics', {
            'fields': ('number_of_samples', 'number_of_rows', 'get_attributes_count'),
            'classes': ('collapse',)
        }),
    )
    
    def get_source_type(self, obj):
        """Returns the type of clinical source."""
        if obj.user_file:
            return f"User File ({obj.user_file.file_type})"
        elif obj.cgds_dataset and obj.extra_cgds_dataset:
            return "CGDS Clinical (Patient + Sample)"
        elif obj.cgds_dataset:
            return "CGDS Clinical (Patient only)"
        return "No source"
    get_source_type.short_description = 'Clinical Source Type'
    
    def get_source_name(self, obj):
        """Returns the name of the clinical source."""
        try:
            if obj.user_file:
                return obj.user_file.name
            elif obj.cgds_dataset:
                return obj.cgds_dataset.name
            return "No source"
        except:
            return "No source"
    get_source_name.short_description = 'Source Name'
    
    def get_attributes_count(self, obj):
        """Returns the number of clinical attributes."""
        try:
            return len(obj.get_attributes())
        except:
            return 0
    get_attributes_count.short_description = 'Clinical Attributes Count'


@admin.register(DifferentialExpressionExperiment)
class DifferentialExpressionExperimentAdmin(admin.ModelAdmin):
    """Admin configuration for DifferentialExpressionExperiment model."""
    
    list_display = (
        'id', 'name', 'user', 'state', 'clinical_attribute', 
        'threshold_percentile', 'threshold', 'top', 'execution_time', 'created_at'
    )
    list_filter = (
        'state', 'is_public', 'clinical_attribute', 'created_at'
    )
    search_fields = ('name', 'description', 'user__username', 'clinical_attribute')
    readonly_fields = (
        'id', 'task_id', 'execution_time', 'attempt', 'created_at', 'updated_at',
        'get_results_count', 'get_significant_genes_count'
    )
    filter_horizontal = ('shared_institutions', 'shared_users')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description', 'user')
        }),
        ('Data Sources', {
            'fields': ('clinical_source', 'mrna_source')
        }),
        ('Analysis Parameters', {
            'fields': ('clinical_attribute', 'threshold_percentile', 'threshold', 'top')
        }),
        ('Execution Information', {
            'fields': ('state', 'task_id', 'execution_time', 'attempt', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Results Statistics', {
            'fields': ('get_results_count', 'get_significant_genes_count'),
            'classes': ('collapse',)
        }),
        ('Sharing', {
            'fields': ('is_public', 'shared_institutions', 'shared_users'),
            'classes': ('collapse',)
        }),
    )
    
    def get_results_count(self, obj):
        """Returns the total number of results."""
        try:
            return obj.results.count()
        except:
            return 0
    get_results_count.short_description = 'Total Results'
    
    def get_significant_genes_count(self, obj):
        """Returns the number of significant genes with default thresholds."""
        try:
            return obj.get_significant_genes().count()
        except:
            return 0
    get_significant_genes_count.short_description = 'Significant Genes (p<0.05, |logFC|>1)'


@admin.register(DifferentialExpressionExperimentResult)
class DifferentialExpressionExperimentResultAdmin(admin.ModelAdmin):
    """Admin configuration for DifferentialExpressionExperimentResult model."""
    
    list_display = (
        'id', 'experiment', 'gene', 'adj_p_val', 'log_fc', 
        'p_value', 'ave_expr', 'is_significant_display'
    )
    list_filter = ('experiment__state', 'experiment__user')
    search_fields = ('gene', 'experiment__name', 'experiment__user__username')
    readonly_fields = ('id', 'is_significant_display')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'experiment', 'gene')
        }),
        ('Statistical Results', {
            'fields': ('p_value', 'adj_p_val', 'log_fc', 'ave_expr', 't_statistic', 'b_statistic')
        }),
        ('Significance', {
            'fields': ('is_significant_display',),
            'classes': ('collapse',)
        }),
    )
    
    def is_significant_display(self, obj):
        """Display if the gene is significant with default thresholds."""
        try:
            return obj.is_significant()
        except:
            return False
    is_significant_display.short_description = 'Is Significant (p<0.05, |logFC|>1)'
    is_significant_display.boolean = True


# Custom admin site configuration
admin.site.site_header = "Multiomix Administration"
admin.site.site_title = "Multiomix Admin"
admin.site.index_title = "Welcome to Multiomix Administration"
