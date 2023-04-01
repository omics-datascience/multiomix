from django.contrib import admin
from feature_selection.models import FSExperiment, SVMParameters, ClusteringParameters


admin.site.register(FSExperiment)
admin.site.register(SVMParameters)
admin.site.register(ClusteringParameters)
