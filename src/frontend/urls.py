from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_action, name='index'),
    path('gem', views.gem_action, name='gem'),
    path('my-datasets', views.datasets_action, name='datasets'),
    path('survival', views.survival_action, name='survival'),
    path('about-us', views.about_us_action, name='about_us'),
    path('site-policy', views.terms_and_privacy_policy_action, name='site_policy')
]

