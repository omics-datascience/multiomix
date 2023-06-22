from typing import Optional
from django.contrib import admin
from biomarkers.models import BiomarkerState
from feature_selection.models import FSExperiment, SVMParameters, ClusteringParameters, TrainedModel, ClusterLabelsSet, \
    ClusterLabel


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

    list_display = ('origin_biomarker', 'target_biomarker', 'target_biomarker_state', 'algorithm', 'app_name', 'emr_job_id')
    list_filter = ('algorithm', )
    search_fields = ('origin_biomarker__name', 'target_biomarker__name')


admin.site.register(FSExperiment, FSExperimentAdmin)
admin.site.register(SVMParameters)
admin.site.register(ClusteringParameters)
admin.site.register(TrainedModel)
admin.site.register(ClusterLabelsSet)
admin.site.register(ClusterLabel)
