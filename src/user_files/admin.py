from django.contrib import admin
from .models import UserFile


class UserFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'file_type', 'upload_date', 'contains_nan_values', 'number_of_rows',
                    'number_of_samples', 'decimal_separator', 'is_public', 'is_cpg_site_id', 'platform')
    list_filter = ('file_type', 'upload_date', 'is_public', 'is_cpg_site_id')
    search_fields = ('name', 'description', 'user__username')


admin.site.register(UserFile, UserFileAdmin)
