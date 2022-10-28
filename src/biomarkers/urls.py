from django.urls import path

from . import views

urlpatterns = [
    path('', views.biomarkers_action, name='biomarkers'),
    path('api', views.BiomarkerList.as_view(), name='biomarkers_api'),
    path('api/<int:pk>/', views.BiomarkerDetail.as_view()),
    path('gene-symbols-finder', views.GenesFinder.as_view(), name='gene_symbols_finder'),
    path('genes-symbols', views.GenesSymbols.as_view(), name='genes_symbols')
]
