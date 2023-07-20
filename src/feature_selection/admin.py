from typing import Optional
from django.contrib import admin
from biomarkers.models import BiomarkerState
from feature_selection.models import FSExperiment, SVMParameters, ClusteringParameters, TrainedModel, ClusterLabelsSet, \
    ClusterLabel, SVMTimesRecord, RFTimesRecord, ClusteringTimesRecord, RFParameters, CoxRegressionParameters, \
    BBHAParameters


class FSExperimentAdmin(admin.ModelAdmin):
    @staticmethod
    @admin.display(description='Origin Biomarker')
    def origin_biomarker(obj: FSExperiment) -> Optional[str]:
        return obj.created_biomarker.name if obj.created_biomarker else None

    @staticmethod
    @admin.display(description='Target Biomarker')
    def target_biomarker(obj: FSExperiment) -> Optional[str]:
        return obj.created_biomarker.name if obj.created_biomarker else None

    @staticmethod
    @admin.display(description='Target Biomarker State')
    def target_biomarker_state(obj: FSExperiment) -> Optional[BiomarkerState]:
        return obj.created_biomarker.get_state_display() if obj.created_biomarker else None

    list_display = ('pk', 'origin_biomarker', 'target_biomarker', 'target_biomarker_state', 'algorithm', 'app_name',
                    'emr_job_id')
    list_filter = ('algorithm', )
    search_fields = ('origin_biomarker__name', 'created_biomarker__name')


class TrainedModelAdmin(admin.ModelAdmin):
    @staticmethod
    @admin.display(description='Biomarker')
    def biomarker(obj: TrainedModel) -> Optional[str]:
        return obj.biomarker.name if obj.biomarker else None

    list_display = ('name', 'description', 'biomarker', 'state', 'fitness_function', 'best_fitness_value')
    list_filter = ('state', 'fitness_function')
    search_fields = ('name', 'description', 'biomarker__name')


common_time_record_fields = ('pk', 'number_of_features', 'number_of_samples', 'execution_time', 'fitness')


class SVMTimesRecordAdmin(admin.ModelAdmin):
    list_display = common_time_record_fields + ('test_time', 'number_of_iterations', 'time_by_iteration',
                                                'max_iterations', 'optimizer', 'kernel')


class RFTimesRecordAdmin(admin.ModelAdmin):
    list_display = common_time_record_fields + ('test_time', 'number_of_trees')


class ClusteringTimesRecordAdmin(admin.ModelAdmin):
    list_display = common_time_record_fields + ('number_of_clusters', 'algorithm', 'scoring_method', 'fs_experiment')


class BBHAParametersAdmin(admin.ModelAdmin):
    list_display = ('n_stars', 'n_iterations', 'version_used', 'fs_experiment')
    list_filter = ('version_used', )


class CoxRegressionParametersAdmin(admin.ModelAdmin):
    list_display = ('top_n', )


admin.site.register(FSExperiment, FSExperimentAdmin)
admin.site.register(SVMParameters)
admin.site.register(RFParameters)
admin.site.register(ClusteringParameters)
admin.site.register(TrainedModel, TrainedModelAdmin)
admin.site.register(ClusterLabelsSet)
admin.site.register(ClusterLabel)
admin.site.register(SVMTimesRecord, SVMTimesRecordAdmin)
admin.site.register(RFTimesRecord, RFTimesRecordAdmin)
admin.site.register(ClusteringTimesRecord, ClusteringTimesRecordAdmin)
admin.site.register(BBHAParameters, BBHAParametersAdmin)
admin.site.register(CoxRegressionParameters, CoxRegressionParametersAdmin)
