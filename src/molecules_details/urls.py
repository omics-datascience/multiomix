from django.urls import path
from . import views


urlpatterns = [
    path('gene-information', views.GeneInformation.as_view(), name='gene_information'),
]
