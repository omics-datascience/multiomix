from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_action, name='index'),
    path('gem', views.gem_action, name='gem'),
    path('my-datasets', views.datasets_action, name='datasets'),
    path('survival', views.survival_action, name='survival'),
    path('about-us', views.about_us_action, name='about_us'),
    path('site-policy', views.terms_and_privacy_policy_action, name='site_policy'),
    path('gene-symbols', views.GeneSymbols.as_view(), name='gene_symbols'),
    path('gene-symbols-finder', views.GeneSymbols.as_view(), name='gene_symbols_finder'),
    path('api', views.BiomarkerList.as_view(), name='biomarkers_api'),
    path('api-simple-update', views.BiomarkerSimpleUpdate.as_view(), name='biomarkers_api_simple_update'),
    path('mirna-codes', views.MiRNACodes.as_view(), name='mirna_codes'),
    path('mirna-codes-finder', views.MiRNACodes.as_view(), name='mirna_codes_finder'),
    path('create', views.BiomarkerCreate.as_view(), name='biomarkers_create'),
    path('methylation-sites', views.MethylationSites.as_view(), name='methylation_sites'),
    path('methylation-sites-finder', views.MethylationSites.as_view(), name='methylation_sites_finder'),
]

