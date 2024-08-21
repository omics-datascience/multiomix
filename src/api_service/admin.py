from django.contrib import admin
from .models import Experiment, ExperimentSource, ExperimentClinicalSource, GeneMiRNACombination, GeneCNACombination, \
    GeneMethylationCombination


class ExperimentAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'type', 'submit_date', 'state', 'user')
    list_filter = ('state', 'submit_date')
    search_fields = ('name', 'description', 'user__username')


class GeneGEMCombinationAdmin(admin.ModelAdmin):
    """Admin view for all GeneMiRNACombination, GeneCNACombination and GeneMethylationCombination models"""
    list_display = ('gene', 'gem', 'correlation', 'p_value', 'adjusted_p_value', 'experiment')
    search_fields = ('gene__name', 'gem__name', 'experiment__name')
    ordering = ('-experiment__submit_date', 'gene', 'gem')


admin.site.register(Experiment, ExperimentAdmin)
admin.site.register(ExperimentSource)
admin.site.register(ExperimentClinicalSource)
admin.site.register(GeneMiRNACombination, GeneGEMCombinationAdmin)
admin.site.register(GeneCNACombination, GeneGEMCombinationAdmin)
admin.site.register(GeneMethylationCombination, GeneGEMCombinationAdmin)
