from django.contrib import admin
from feature_selection.models import FSExperiment, SVMParameters, ClusteringParameters, TrainedModel, ClusterLabelsSet, \
    ClusterLabel

admin.site.register(FSExperiment)
admin.site.register(SVMParameters)
admin.site.register(ClusteringParameters)
admin.site.register(TrainedModel)
admin.site.register(ClusterLabelsSet)
admin.site.register(ClusterLabel)
