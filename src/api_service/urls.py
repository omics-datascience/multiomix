from django.urls import path

import statistical_properties.views
from . import views

urlpatterns = [
    path('', views.CorrelationAnalysis.as_view(), name='run_experiment'),
    # Experiments URLs
    path('last-experiments', views.LastList.as_view(), name='last_experiments'),
    path('experiments', views.ExperimentList.as_view(),
         name='mrna_gem_experiment'),
    path(
        'experiments/<int:pk>/',
        views.ExperimentDetail.as_view()
    ),
    path('get-full-experiment', views.FullExperimentDetail.as_view(),
         name='get_full_experiment'),
    path('get-full-experiment/<int:pk>/', views.FullExperimentDetail.as_view()),
    path('get-experiment-data', views.ExperimentResultCombinationsDetails.as_view(),
         name='get_experiment_data'),
    # Common samples
    path('number-samples-in-common', views.get_number_samples_in_common_action,
         name='get_number_samples_in_common'),
    path('number-samples-in-common-clinical-validation', views.get_number_samples_in_common_clinical_validation,
         name='get_number_samples_in_common_clinical_validation'),
    path('number-samples-in-common-clinical-validation-source', views.get_number_samples_in_common_clinical_validation_source,
         name='get_number_samples_in_common_clinical_validation_source'),
    path(
        'number-samples-in-common-one-front',
        views.get_number_samples_in_common_action_one_front,
        name='get_number_samples_in_common_one_front'
    ),
    # Correlation Graph
    path('correlation-graph', views.get_correlation_graph_action,
         name='correlation_graph'),
    # MiRNA Interaction
    path('mirna-target-interaction', views.get_mirna_target_interaction_action,
         name='mirna_target_interaction'),
    # MiRNA Disease associated
    path('mirna-disease', views.get_mirna_diseases_action, name='mirna_diseases'),
    path('mirna-drugs', views.get_mirna_drugs_action, name='mirna_drugs'),
    # Get Dataset column names
    path('get-dataset-columns-name', views.get_dataset_columns_name_action,
         name='get_dataset_columns_name'),
    path(
        'get-combination-stats',
        statistical_properties.views.CombinationSourceDataStatisticalPropertiesDetails.as_view(),
        name='get_combination_stats'
    ),
    path('get-combination-stats/<int:pk>/',
         statistical_properties.views.CombinationSourceDataStatisticalPropertiesDetails.as_view()),
    path('download-full-result', views.download_full_result,
         name='download_full_result'),
    path('download-full-result/<int:pk>/', views.download_full_result),
    path('download-result-with-filters', views.download_result_with_filters,
         name='download_result_with_filters'),
    path('clinical-source-user-file', views.add_clinical_source,
         name='clinical_source_user_file'),
    path('clinical-source-user-file/<int:pk>/',
         views.ExperimentClinicalSourceDetail.as_view()),
    path(
        'clinical-source-user-file-unlink',
        views.unlink_clinical_source_user_file,
        name='unlink_clinical_source_user_file'
    ),
    path(
        'clinical-source-user-file-unlink/<int:pk>/',
        views.unlink_clinical_source_user_file
    ),
    path('survival-data', views.SurvivalDataDetails.as_view(),
         name='survival_data'),
    path('mirna-data', views.mirna_data_action, name='mirna_data'),
    path('methylation-data', views.methylation_data_action, name='methylation_data'),
    path('stop-experiment', views.stop_experiment_action, name='stop_experiment'),
    path('non-institutions', views.InstitutionNonExperimentsSharedListView.as_view(), name='institution-non-experiments-list'),
    path('non-institutions/<int:experiment_id>/', views.InstitutionNonExperimentsSharedListView.as_view()),
    path('non-users', views.UsersNonExperimentsSharedListView.as_view(), name='user-non-experiments-list'),
    path('non-users/<int:experiment_id>/', views.UsersNonExperimentsSharedListView.as_view()),
    path('share-experiment-to-institution', views.AddInstitutionToExperimentView.as_view(), name='share-experiment-to-institution'),
    path('share-experiment-to-user', views.AddUserToExperimentView.as_view(), name='share-experiment-to-user'),
    path('shared-institution', views.UsersExperimentsSharedListView.as_view(), name='shared-institution'),
    path('shared-users/<int:experiment_id>/', views.UsersExperimentsSharedListView.as_view(), ),
    path('shared-users', views.InstitutionExperimentsSharedListView.as_view(), name='shared-users'),
    path('shared-institution/<int:experiment_id>/', views.InstitutionExperimentsSharedListView.as_view(), ),
    path('switch-institution-public-view', views.ToggleExperimentPublicView.as_view(), name='switch-experiment-public-view'),
    path('remove-institution', views.RemoveInstitutionFromExperimentView.as_view(), name='remove-institution'),
    path('remove-user', views.RemoveUserFromExperimentView.as_view(), name='remove-user')

]
