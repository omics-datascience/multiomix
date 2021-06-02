from django.contrib import admin
from .models import Experiment, ExperimentSource, ExperimentClinicalSource

admin.site.register(Experiment)
admin.site.register(ExperimentSource)
admin.site.register(ExperimentClinicalSource)
