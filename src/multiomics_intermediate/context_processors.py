from django.conf import settings


def enable_security(_request):
    """Makes ENABLE_SECURITY setting available in base.html"""
    return {'ENABLE_SECURITY': settings.ENABLE_SECURITY, 'VERSION': settings.VERSION}
