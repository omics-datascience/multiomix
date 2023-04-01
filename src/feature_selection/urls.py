from django.urls import path
from . import views

urlpatterns = [
    path('submit-experiment', views.FeatureSelectionSubmit.as_view(), name='feature_selection_submit')
]
