from django.urls import path
from . import views

urlpatterns = [
    path(
        'biomarker-statistical-validations',
        views.BiomarkerStatisticalValidations.as_view(),
        name='biomarker_statistical_validations'
    ),
    path(
        'biomarker-statistical-validations/<int:pk>/',
        views.StatisticalValidationDestroy.as_view()
    ),
    path(
        'biomarker-new-statistical-validation',
        views.BiomarkerNewStatisticalValidations.as_view(),
        name='biomarker_new_statistical_validation'
    ),
    path(
        'statistical-validation-metrics',
        views.StatisticalValidationMetrics.as_view(),
        name='statistical_validation_metrics'
    ),
    path('statistical-validation-metrics/<int:pk>/', views.StatisticalValidationMetrics.as_view()),
    path(
        'statistical-validation-best-features',
        views.StatisticalValidationBestFeatures.as_view(),
        name='statistical_validation_best_features'
    ),
    path(
        'statistical-validation-heatmap',
        views.StatisticalValidationHeatMap.as_view(),
        name='statistical_validation_heatmap'
    ),
    path(
        'statistical-validation-kaplan-meier-clustering',
        views.StatisticalValidationKaplanMeierClustering.as_view(),
        name='statistical_validation_kaplan_meier_clustering'
    ),
    path(
        'statistical-validation-kaplan-meier-by-attr',
        views.StatisticalValidationKaplanMeierByAttribute.as_view(),
        name='statistical_validation_kaplan_meier_by_attr'
    ),
    path(
        'statistical-validation-modal-details',
        views.ModelDetails.as_view(),
        name='statistical_validation_modal_details'
    ),
    path(
        'statistical-validation-samples-and-clusters',
        views.StatisticalValidationSamplesAndClusters.as_view(),
        name='statistical_validation_samples_and_clusters'
    ),
    path(
        'clusters-unique-stat-validation',
        views.ClustersUniqueStatValidation.as_view(),
        name='clusters_unique_stat_validation'
    ),
    path(
        'clusters-unique-stat-validation/<int:pk>/',
        views.ClustersUniqueStatValidation.as_view()
    ),
    path(
        'statistical-validation-clinical-attrs',
        views.StatisticalValidationClinicalAttributes.as_view(),
        name='statistical_validation_clinical_attrs'
    ),
    path('biomarker-trained-models', views.TrainedModelsOfBiomarker.as_view(), name='biomarker_trained_models'),
    path('biomarker-trained-models/<int:pk>/', views.TrainedModelDestroy.as_view()),
    path('biomarker-new-trained-model', views.BiomarkerNewTrainedModel.as_view(), name='biomarker_new_trained_model'),
    path('cluster-labels-sets', views.ClusterLabelsSetsList.as_view(), name='cluster_labels_sets'),
    path(
        'cluster-labels-sets-paginated',
        views.ClusterLabelsSetsListPaginated.as_view(),
        name='cluster_labels_sets_paginated'
    ),
    path(
        'prediction-range-labels-sets',
        views.PredictionRangeLabelsSetsList.as_view(),
        name='prediction_range_labels_sets'
    ),
    path(
        'prediction-range-labels-paginated-sets',
        views.PredictionRangeLabelsSetsListPaginated.as_view(),
        name='prediction_range_labels_sets_paginated'
    ),
    path('stop-statistical-validation', views.StopStatisticalValidation.as_view(), name='stop_statistical_validation'),
    path('stop-trained-model', views.StopTrainedModel.as_view(), name='stop_trained_model')
]
