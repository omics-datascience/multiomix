from django.urls import path, re_path
from . import views


urlpatterns = [
    path('', views.UserFileList.as_view(), name='user_files'),
    path('all', views.AllUserFileList.as_view(), name='all_user_files'),
    path('<int:pk>/', views.UserFileDetail.as_view()),
]
