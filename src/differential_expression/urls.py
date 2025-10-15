from django.urls import path
from . import views

urlpatterns = [
    path('', views.DifferentialExpressionList.as_view(), name='differential_expression_list'),
    path('<int:pk>/', views.DifferentialExpressionDetail.as_view()),
    path('<int:pk>/results/', views.DifferentialExpressionResults.as_view()),
    path('submit-experiment', views.DifferentialExpressionSubmit.as_view(), name='differential_expression_submit'),
    path('stop-experiment', views.DifferentialExpressionStop.as_view(), name='differential_expression_stop'),
    path('update', views.DifferentialExpressionUpdate.as_view(), name='differential_expression_update'),
    path('update/<int:pk>/', views.DifferentialExpressionUpdate.as_view()),
    path('delete', views.DifferentialExpressionDelete.as_view(), name='differential_expression_delete'),
    path('delete/<int:pk>/', views.DifferentialExpressionDelete.as_view()),
    path('get-common-samples-differential-experiment', views.GetCommonSamplesDifferentialExperiment.as_view(), name='get_common_samples_differential_experiment'),
    path('get-common-samples-one-front-differential-experiment', views.GetCommonSamplesDifferentialOneFrontExperiment.as_view(), name='get_common_samples_one_front_differential_experiment'),
    path('switch-institution-public-view', views.ToggleDiffExperimentPublicView.as_view(), name='switch-diff-experiment-public-view'),
    ]