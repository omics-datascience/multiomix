from django.urls import path
from . import views


urlpatterns = [
    path('', views.cgds_panel_action, name='cgds_panel'),
    # CGDS Studies
    path('studies', views.CGDSStudyList.as_view(), name='cgds_studies'),
    path('studies/<int:pk>/', views.CGDSStudyDetail.as_view()),
    # Synchronization
    path('sync', views.SynCGDSStudy.as_view(), name='sync_cgds_study'),
]
