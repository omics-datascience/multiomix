from django.urls import path
from . import views
from .views import UserFileChunkedUploadCompleteView, UserFileChunkedUploadView

urlpatterns = [
    path('', views.UserFileList.as_view(), name='user_files'),
    path('all', views.AllUserFileList.as_view(), name='all_user_files'),
    path('<int:pk>/', views.UserFileDetail.as_view()),
    path('chunked-upload/', UserFileChunkedUploadView.as_view(), name='api_chunked_upload'),
    path('chunked-upload-complete/', UserFileChunkedUploadCompleteView.as_view(), name='api_chunked_upload_complete'),
]
