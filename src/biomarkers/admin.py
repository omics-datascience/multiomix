from django.contrib import admin
from .models import Biomarker

class BiomarkerAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'tag', 'upload_date')
    list_filter = ('tag', 'upload_date')
    search_fields = ('name', 'description')

admin.site.register(Biomarker, BiomarkerAdmin)
