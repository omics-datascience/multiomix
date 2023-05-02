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
        'statistical-validation-kaplan-meier',
        views.StatisticalValidationKaplanMeier.as_view(),
        name='statistical_validation_kaplan_meier'
    ),
    path(
        'statistical-validation-modal-details',
        views.StatisticalValidationModelDetails.as_view(),
        name='statistical_validation_modal_details'
    )
]
