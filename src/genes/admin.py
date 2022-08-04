from django.contrib import admin
from .models import Gene


class GeneAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'description', 'chromosome', 'start', 'end')
    list_filter = ('chromosome', )
    search_fields = ('name', 'type', 'description')


admin.site.register(Gene, GeneAdmin)
