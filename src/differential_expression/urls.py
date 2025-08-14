from django.urls import path
from . import views

urlpatterns = [
    path('', views.DifferentialExpressionList.as_view(), name='differential_expression_list'),
    path('<int:pk>/', views.DifferentialExpressionDetail.as_view()),
    path('<int:pk>/results/', views.DifferentialExpressionResults.as_view()),
    path('<int:pk>/significant-genes/', views.DifferentialExpressionSignificantGenes.as_view()),
    path('submit-experiment', views.DifferentialExpressionSubmit.as_view(), name='differential_expression_submit'),
]