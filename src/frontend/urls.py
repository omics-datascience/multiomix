from django.conf import settings
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_action, name='index'),
    path('gem', views.gem_action, name='gem'),
    path('login', views.login_action, name='login'),
    path('my-datasets', views.datasets_action, name='datasets'),
    path('survival', views.survival_action, name='survival'),
    path('authenticate', views.authenticate_action, name='authentication'),
    path('create-user', views.create_user_action, name='create_user'),
    path('about-us', views.about_us_action, name='about_us'),
    path('logout', views.logout_action, name='logout'),
    path('user', views.CurrentUserView.as_view(), name='current_user')
]

if settings.DEBUG:
    urlpatterns.append(path('new-user-email-test', views.test_new_user_email))
    urlpatterns.append(path('confirmation-email-test', views.test_confirmation_email))
