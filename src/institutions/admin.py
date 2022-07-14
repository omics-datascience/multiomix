from django.contrib import admin
from .models import Institution, InstitutionAdministration


class InstitutionAdmin(admin.ModelAdmin):
    fields_display_search = ('name', 'location', 'email', 'telephone_number')
    list_display = fields_display_search
    search_fields = fields_display_search


admin.site.register(Institution, InstitutionAdmin)
admin.site.register(InstitutionAdministration)
