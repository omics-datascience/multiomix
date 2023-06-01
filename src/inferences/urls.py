from django.urls import path
from . import views

urlpatterns = [
    path(
        'biomarker-inference-experiments',
        views.BiomarkerStatisticalInferenceExperiments.as_view(),
        name='biomarker_inference_experiments'
    ),
    path(
        'biomarker-inference-experiments/<int:pk>/',
        views.BiomarkerStatisticalInferenceExperimentsDetails.as_view()
    ),
    path(
        'inference-experiment-clinical-attrs',
        views.InferenceExperimentClinicalAttributes.as_view(),
        name='inference_experiment_clinical_attrs'
    ),
    path('submit-inference-experiment', views.PredictionExperimentSubmit.as_view(), name='submit_inference_experiment'),
    path(
        'inference-experiment-samples-and-clusters',
        views.SampleAndClusterPredictionSamples.as_view(),
        name='inference_experiment_samples_and_clusters'
    ),
    path(
        'inference-experiment-samples-and-time',
        views.SampleAndTimePredictionSamples.as_view(),
        name='inference_experiment_samples_and_time'
    ),
    path(
        'clinical-source-inference-experiment',
        views.AddEditClinicalSourceInferenceExperiment.as_view(),
         name='clinical_source_inference_experiment'
    ),
    path(
        'clinical-source-unlink-inference-experiment',
        views.UnlinkClinicalSourceInferenceExperiment.as_view(),
        name='unlink_clinical_source_inference_experiment'
    ),
    path(
        'chart-data-by-attribute',
        views.InferenceExperimentChartDataByAttribute.as_view(),
        name='chart_data_by_attribute'
    ),
]
