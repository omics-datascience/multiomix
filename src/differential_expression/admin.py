from django.contrib import admin
from .models import (
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentResult
)


@admin.register(DifferentialExpressionExperiment)
class DifferentialExpressionExperimentAdmin(admin.ModelAdmin):
    """Admin configuration for DifferentialExpressionExperiment model."""
    
    list_display = (
        'id', 'name', 'user', 'state', 'clinical_attribute', 'tool',
        'threshold_percentile', 'threshold', 'top', 'execution_time', 'created_at'
    )
    list_filter = (
        'state', 'is_public', 'clinical_attribute', 'created_at', 'tissue'
    )
    search_fields = ('name', 'description', 'user__username', 'clinical_attribute')
    readonly_fields = (
        'id', 'task_id', 'execution_time', 'attempt', 'created_at', 'updated_at',
        'get_results_count'
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
            'fields': ('clinical_attribute', 'tool', 'threshold_percentile', 'threshold', 'top')
        }),
        ('Execution Information', {
            'fields': ('state', 'task_id', 'execution_time', 'attempt', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Results Statistics', {
            'fields': ('get_results_count',),
            'classes': ('collapse',)
        }),
        ('Sharing', {
            'fields': ('is_public', 'shared_institutions', 'shared_users', 'tissue'),
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


@admin.register(DifferentialExpressionExperimentResult)
class DifferentialExpressionExperimentResultAdmin(admin.ModelAdmin):
    """Admin configuration for DifferentialExpressionExperimentResult model."""
    
    list_display = (
        'id', 'experiment', 'gene', 'adj_p_val', 'log_fc',
        'p_value', 'ave_expr'
    )
    list_filter = ('experiment__state', 'experiment__user')
    search_fields = ('gene', 'experiment__name', 'experiment__user__username')
    readonly_fields = ('id',)

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'experiment', 'gene')
        }),
        ('Statistical Results', {
            'fields': ('p_value', 'adj_p_val', 'log_fc', 'ave_expr', 't_statistic', 'b_statistic')
        }),
    )
