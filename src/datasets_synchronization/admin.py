from typing import Optional
from django.contrib import admin
from .models import CGDSStudy, CGDSDataset


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
    search_fields = ('file_path', 'mongo_collection_name', 'study__name')


# IMPORTANT: these models should be managed in the CGDS Panel in the frontend!
admin.site.register(CGDSStudy, CGDSStudyAdmin)
admin.site.register(CGDSDataset, CGDSDatasetAdmin)
