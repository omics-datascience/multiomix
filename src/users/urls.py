from django.conf import settings
from django.urls import path
from users import views

urlpatterns = [
    path('login', views.login_action, name='login'),
    path('authenticate', views.authenticate_action, name='authentication'),
    path('create-user', views.create_user_action, name='create_user'),
    path('logout', views.logout_action, name='logout'),
    path('user', views.CurrentUserView.as_view(), name='current_user'),
    path('edit-profile', views.UserRetrieveUpdateView.as_view(), name='update_user')
]

if settings.DEBUG:
    urlpatterns.append(path('new-user-email-test', views.test_new_user_email))
    urlpatterns.append(path('confirmation-email-test', views.test_confirmation_email))