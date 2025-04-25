from django.urls import path
import statistical_properties.views
from . import views

urlpatterns = [
    path('', views.biomarkers_action, name='biomarkers'),
    path('api', views.BiomarkerList.as_view(), name='biomarkers_api'),
    path('api/<int:pk>/', views.BiomarkerDetail.as_view()),
    path('api-simple-update', views.BiomarkerSimpleUpdate.as_view(), name='biomarkers_api_simple_update'),
    path('api-simple-update/<int:pk>/', views.BiomarkerSimpleUpdate.as_view()),
    path('create', views.BiomarkerCreate.as_view(), name='biomarkers_create'),
    path('gene-symbols', views.GeneSymbols.as_view(), name='gene_symbols'),
    path('gene-symbols-finder', views.GeneSymbols.as_view(), name='gene_symbols_finder'),
    path('clone_biomarker', views.BiomarkerClone.as_view(), name='clone_biomarker'),
    path('clone_biomarker/<int:pk>/', views.BiomarkerClone.as_view(), name='clone_biomarker'),
    path('mirna-codes', views.MiRNACodes.as_view(), name='mirna_codes'),
    path('mirna-codes-finder', views.MiRNACodes.as_view(), name='mirna_codes_finder'),
    path('methylation-sites', views.MethylationSites.as_view(), name='methylation_sites'),
    path('methylation-sites-finder', views.MethylationSites.as_view(), name='methylation_sites_finder'),
    path('biomarker-molecules', views.BiomarkerMolecules.as_view(), name='biomarker_molecules'),
    path('biomarker-correlation-api', views.BiomarkerCorrelationAPIView.as_view(), name='biomarker_correlation_api'),
    path('non-institutions-biomarker/<int:biomarker_id>/', views.InstitutionNonExperimentsSharedBiomarkerListView.as_view()),
    path('non-institutions-biomarker', views.InstitutionNonExperimentsSharedBiomarkerListView.as_view(), name='institution-non-experiments-list-biomarker'),
    path('share-biomarker-to-institution', views.AddInstitutionToBiomarkerView.as_view(), name='share-biomarker-to-institution'),
    path('shared-institution-biomarker/<int:biomarker_id>/', views.InstitutionBiomarkersSharedListView.as_view(), ),
    path('shared-institution-biomarker', views.InstitutionBiomarkersSharedListView.as_view(), name='shared-institution-biomarker'),
    path('remove-institution-biomarker', views.RemoveInstitutionFromBiomarkerView.as_view(), name='remove-institution-biomarker'),
    path('shared-users-biomarker/<int:biomarker_id>/', views.UsersSharedBiomarkerListView.as_view(), ),
    path('shared-users-biomarker', views.UsersSharedBiomarkerListView.as_view(), name='shared-users-biomarker'),
    path('remove-user-biomarker', views.RemoveUserFromBiomarkerView.as_view(), name='remove-user-biomarker'),
    path('non-users', views.UsersNonBiomarkersSharedListView.as_view(), name='user-non-biomarker-list'),
    path('non-users/<int:biomarker_id>/', views.UsersNonBiomarkersSharedListView.as_view()),
    path('share-biomarker-to-user', views.AddUserToBiomarkerView.as_view(), name='share-biomarker-to-user'),
]
