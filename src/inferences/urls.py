from django.urls import path
from . import views

urlpatterns = [
    path(
        'biomarker-inference-experiments',
        views.BiomarkerStatisticalInferenceExperiments.as_view(),
        name='biomarker_inference_experiments'
    ),
    path('submit-inference-experiment', views.PredictionExperimentSubmit.as_view(), name='submit_inference_experiment')
]
