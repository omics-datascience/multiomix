from typing import Optional, Union
from django.contrib import admin
from .models import CGDSStudy, CGDSDataset, SurvivalColumnsTupleUserFile, SurvivalColumnsTupleCGDSDataset


class CGDSStudyAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'version', 'date_last_synchronization', 'state')
    list_filter = ('state',)
    search_fields = ('name', 'description')

    def delete_queryset(self, request, queryset):
        """
        This makes this call the delete method of the model, which is overriden to delete the related CGDS datasets.
        """
        for obj in queryset:
            obj.delete()


class CGDSDatasetAdmin(admin.ModelAdmin):
    @staticmethod
    @admin.display(description='CGDS Study')
    def study(obj: CGDSDataset) -> str:
        return obj.study.name if obj.study else '-'

    @staticmethod
    @admin.display(description='Study version')
    def study_version(obj: CGDSDataset) -> Optional[int]:
        return obj.study.version if obj.study else None

    def delete_queryset(self, request, queryset):
        """
        This makes this call the delete method of the model, which is overriden to delete the related Mongo collection.
        """
        for obj in queryset:
            obj.delete()

    list_display = ('file_path', 'date_last_synchronization', 'study', 'study_version', 'number_of_rows',
                    'number_of_samples', 'state', 'mongo_collection_name')
    list_filter = ('state',)
    search_fields = ('file_path', 'mongo_collection_name', 'clinical_patient_dataset__name',
                     'clinical_sample_dataset__name', 'cna_dataset__name', 'methylation_dataset__name',
                     'mirna_dataset__name', 'mrna_dataset__name')



class SurvivalColumnsTupleAdmin(admin.ModelAdmin):
    """Useful for SurvivalColumnsTupleCGDSDataset and SurvivalColumnsTupleUserFile models."""
    @staticmethod
    @admin.display(description='CGDS Dataset')
    def dataset(obj: Union[SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleUserFile]) -> str:
        return str(obj.clinical_dataset)

    list_display = ('pk', 'dataset', 'time_column', 'event_column')
    search_fields = ('time_column', 'event_column')

# IMPORTANT: these models should be managed in the CGDS Panel in the frontend!
admin.site.register(CGDSStudy, CGDSStudyAdmin)
admin.site.register(CGDSDataset, CGDSDatasetAdmin)
admin.site.register(SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleAdmin)
admin.site.register(SurvivalColumnsTupleUserFile, SurvivalColumnsTupleAdmin)
