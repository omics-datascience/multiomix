from django.urls import path
from . import views

urlpatterns = [
    path('submit-experiment', views.FeatureSelectionSubmit.as_view(), name='feature_selection_submit'),
    path('aws-notification/<str:job_id>/', views.FeatureSelectionExperimentAWSNotification.as_view()),
    path('stop-experiment', views.StopFSExperiment.as_view(), name='stop_fs_experiment')
]
