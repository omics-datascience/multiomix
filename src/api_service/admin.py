from django.contrib import admin
from .models import Experiment, ExperimentSource, ExperimentClinicalSource


class ExperimentAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'type', 'submit_date', 'state', 'user')
    list_filter = ('state', 'submit_date')
    search_fields = ('name', 'description', 'user__username')


admin.site.register(Experiment, ExperimentAdmin)
admin.site.register(ExperimentSource)
admin.site.register(ExperimentClinicalSource)
