from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserFileList.as_view(), name='user_files'),
    path('<int:pk>/', views.UserFileDetail.as_view()),
    path('chunked-upload/', views.UserFileChunkedUploadView.as_view(), name='api_chunked_upload'),
    path('download-user-file/', views.DownloadUserFile.as_view(), name='download_user_file'),
    path('download-user-file/<int:pk>/', views.DownloadUserFile.as_view()),
    path(
        'chunked-upload-complete/',
        views.UserFileChunkedUploadCompleteView.as_view(),
        name='api_chunked_upload_complete'
    ),
   path('file-header/', views.UserFileHeaders.as_view(), name='user_file_headers'),
   path('file-header/<int:pk>/', views.UserFileHeaders.as_view())
]
