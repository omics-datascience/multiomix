from django.urls import path
from . import views


urlpatterns = [
    path('gene-information', views.GeneInformation.as_view(), name='gene_information'),
    path('pathways-information', views.PathwaysInformation.as_view(), name='pathways_information'),
    path(
        'metabolic-pathways-information',
        views.MetabolicPathwaysInformation.as_view(),
        name='metabolic_pathways_information'
    ),
    path('gene-ontology-terms', views.GeneOntologyTerms.as_view(), name='gene_ontology_terms')
]
