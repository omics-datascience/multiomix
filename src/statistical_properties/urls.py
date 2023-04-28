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
    )
]
