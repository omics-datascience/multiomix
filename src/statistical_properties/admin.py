from django.contrib import admin
from .models import (
    NormalityTest,
    GoldfeldQuandtTest,
    LinearityTest,
    MonotonicTest,
    BreuschPaganTest,
    SourceDataStatisticalProperties,
    SourceDataOutliers,
    StatisticalValidationSourceResult,
    StatisticalValidation,
    MoleculeWithCoefficient,
    SampleAndCluster,
)


@admin.register(NormalityTest)
class NormalityTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'statistic', 'p_value')
    search_fields = ('id',)
    list_filter = ('p_value',)


@admin.register(GoldfeldQuandtTest)
class GoldfeldQuandtTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'statistic', 'p_value')
    search_fields = ('id',)
    list_filter = ('p_value',)


@admin.register(LinearityTest)
class LinearityTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'statistic', 'p_value')
    search_fields = ('id',)
    list_filter = ('p_value',)


@admin.register(MonotonicTest)
class MonotonicTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'statistic', 'p_value')
    search_fields = ('id',)
    list_filter = ('p_value',)


@admin.register(BreuschPaganTest)
class BreuschPaganTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'lagrange_multiplier', 'p_value', 'f_value', 'f_p_value')
    search_fields = ('id',)
    list_filter = ('p_value', 'f_p_value')


@admin.register(SourceDataStatisticalProperties)
class SourceDataStatisticalPropertiesAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'gene_mean', 'gem_mean', 'gene_standard_deviation', 'gem_standard_deviation',
        'number_of_samples_evaluated'
    )
    search_fields = ('id',)
    list_filter = ('number_of_samples_evaluated',)


@admin.register(SourceDataOutliers)
class SourceDataOutliersAdmin(admin.ModelAdmin):
    list_display = ('id', 'sample_identifier', 'expression', 'is_gene_data', 'stats_property')
    search_fields = ('sample_identifier',)
    list_filter = ('is_gene_data',)


@admin.register(StatisticalValidationSourceResult)
class StatisticalValidationSourceResultAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'mean_squared_error', 'c_index', 'cox_c_index', 'cox_log_likelihood', 'r2_score', 'source'
    )
    search_fields = ('id', 'source__id')
    list_filter = ('source',)


@admin.register(StatisticalValidation)
class StatisticalValidationAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'biomarker', 'state', 'created', 'mean_squared_error', 'c_index', 'cox_c_index', 'r2_score'
    )
    search_fields = ('name', 'description', 'biomarker__name')
    list_filter = ('state', 'created',)


@admin.register(MoleculeWithCoefficient)
class MoleculeWithCoefficientAdmin(admin.ModelAdmin):
    list_display = ('id', 'identifier', 'coeff', 'type', 'statistical_validation')
    search_fields = ('identifier',)
    list_filter = ('type',)


@admin.register(SampleAndCluster)
class SampleAndClusterAdmin(admin.ModelAdmin):
    list_display = ('id', 'sample', 'cluster', 'statistical_validation')
    search_fields = ('sample',)
    list_filter = ('cluster',)
