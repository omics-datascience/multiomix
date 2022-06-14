"""multiomics_intermediate URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings
from django_email_verification import urls as mail_urls

# NOTE: the static path to MEDIA_URL should not be setted in production it.
# See: https://docs.djangoproject.com/en/3.0/howto/static-files/deployment/

urlpatterns = [
    path('', include('frontend.urls')),
    path('api-service/', include('api_service.urls')),
    path('tags/', include('tags.urls')),
    path('user-files/', include('user_files.urls')),
    path('cgds/', include('datasets_synchronization.urls')),
    path('institutions/', include('institutions.urls')),
    path('biomarkers/', include('biomarkers.urls')),
    path('admin/', admin.site.urls),
    path('email/', include(mail_urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
