from django.contrib import admin
from inferences.models import InferenceExperiment, SampleAndClusterPrediction

class InferenceExperimentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'biomarker', 'trained_model', 'created')
    search_fields = ('name', 'description', 'biomarker__name', 'biomarker__description')
    list_filter = ('created', )

admin.site.register(InferenceExperiment, InferenceExperimentAdmin)
admin.site.register(SampleAndClusterPrediction)
