from django.urls import path
from . import views

urlpatterns = [
    path(
        'biomarker-statistical-validations',
        views.BiomarkerStatisticalValidations.as_view(),
        name='biomarker_statistical_validations'
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
        'statistical-validation-kaplan-meier-regression',
        views.StatisticalValidationKaplanMeierRegression.as_view(),
        name='statistical_validation_kaplan_meier_regression'
    ),
    path(
        'statistical-validation-modal-details',
        views.StatisticalValidationModelDetails.as_view(),
        name='statistical_validation_modal_details'
    ),
    path(
        'statistical-validation-samples-and-clusters',
        views.StatisticalValidationSamplesAndClusters.as_view(),
        name='statistical_validation_samples_and_clusters'
    ),
    path(
        'statistical-validation-clinical-attrs',
        views.StatisticalValidationClinicalAttributes.as_view(),
        name='statistical_validation_clinical_attrs'
    )
]
