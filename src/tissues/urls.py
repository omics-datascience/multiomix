from django.urls import path
from . import views

urlpatterns = [
    path('', views.TissueList.as_view(), name='tissues'),
]
