from django.contrib import admin
from inferences.models import InferenceExperiment, SampleAndClusterPrediction

admin.site.register(InferenceExperiment)
admin.site.register(SampleAndClusterPrediction)
