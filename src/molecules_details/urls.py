from django.urls import path
from . import views


urlpatterns = [
    path('gene-information', views.GeneInformation.as_view(), name='gene_information'),
    path('gene-groups', views.GeneGroups.as_view(), name='gene_groups'),
    path('pathways-information', views.PathwaysInformation.as_view(), name='pathways_information'),
    path(
        'metabolic-pathways-information',
        views.MetabolicPathwaysInformation.as_view(),
        name='metabolic_pathways_information'
    ),
    path('gene-ontology-gene-terms', views.GeneOntologyTermsOfGene.as_view(), name='gene_ontology_gene_terms'),
    path('gene-ontology-term-terms', views.GeneOntologyTermsOfTerm.as_view(), name='gene_ontology_term_terms'),
    path('actionable-cancer-genes', views.ActionableAndCancerGenes.as_view(), name='actionable_cancer_genes'),
    path('drugs-pharmgkb', views.DrugsPharmGKB.as_view(), name='drugs_pharmgkb'),
    path('predicted-functional-associations-network', views.PredictedFunctionalAssociationsNetwork.as_view(), name='predicted_functional_associations_network'),
    path('drugs-regulating-gene', views.DrugsRegulatingGene.as_view(), name='drugs_regulating_gene'),
    path('methylation-site-information', views.MethylationSiteInformation.as_view(), name='methylation_site_information')
]
