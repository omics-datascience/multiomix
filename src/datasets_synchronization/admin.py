from django.contrib import admin

from .models import CGDSStudy, CGDSDataset

# IMPORTANT: these models should be managed in the CGDS Panel in the frontend!
admin.site.register(CGDSStudy)
admin.site.register(CGDSDataset)
