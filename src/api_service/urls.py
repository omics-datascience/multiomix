from django.urls import path

import statistical_properties.views
from . import views

urlpatterns = [
    path('', views.mrna_gem_action, name='run_experiment'),
    # Experiments URLs
    path('last-experiments', views.LastList.as_view(), name='last_experiments'),
    path('experiments', views.ExperimentList.as_view(), name='mrna_gem_experiment'),
    path(
        'experiments/<int:pk>/',
        views.ExperimentDetail.as_view()
    ),
    path('get-full-experiment', views.FullExperimentDetail.as_view(), name='get_full_experiment'),
    path('get-full-experiment/<int:pk>/', views.FullExperimentDetail.as_view()),
    path('get-experiment-data', views.ExperimentResultCombinationsDetails.as_view(), name='get_experiment_data'),
    # Common samples
    path('number-samples-in-common', views.get_number_samples_in_common_action, name='get_number_samples_in_common'),
    path(
        'number-samples-in-common-one-front',
        views.get_number_samples_in_common_action_one_front,
        name='get_number_samples_in_common_one_front'
    ),
    # Correlation Graph
    path('correlation-graph', views.get_correlation_graph_action, name='correlation_graph'),
    # MiRNA Interaction
    path('mirna-interaction', views.get_mirna_interaction_action, name='mirna_interaction'),
    # MiRNA Disease associated
    path('mirna-disease', views.get_mirna_diseases_action, name='mirna_diseases'),
    path('mirna-drugs', views.get_mirna_drugs_action, name='mirna_drugs'),
    # Get Dataset column names
    path('get-dataset-columns-name', views.get_dataset_columns_name_action, name='get_dataset_columns_name'),
    path(
        'get-combination-stats',
        statistical_properties.views.CombinationSourceDataStatisticalPropertiesDetails.as_view(),
        name='get_combination_stats'
    ),
    path('get-combination-stats/<int:pk>/', statistical_properties.views.CombinationSourceDataStatisticalPropertiesDetails.as_view()),
    path('download-full-result', views.download_full_result, name='download_full_result'),
    path('download-full-result/<int:pk>/', views.download_full_result),
    path('download-result-with-filters', views.download_result_with_filters, name='download_result_with_filters'),
    path('clinical-source-user-file', views.add_clinical_source, name='clinical_source_user_file'),
    path('clinical-source-user-file/<int:pk>/', views.ExperimentClinicalSourceDetail.as_view()),
    path(
        'clinical-source-user-file-unlink',
        views.unlink_clinical_source_user_file,
        name='unlink_clinical_source_user_file'
    ),
    path(
        'clinical-source-user-file-unlink/<int:pk>/',
        views.unlink_clinical_source_user_file
    ),
    path('get-survival-data', views.SurvivalDataDetails.as_view(), name='get_survival_data'),
    path('get-mirna-data', views.get_mirna_data_action, name='get_mirna_data')
]
