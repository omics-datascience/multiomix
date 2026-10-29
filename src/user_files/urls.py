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
   path('file-header/<int:pk>/', views.UserFileHeaders.as_view()),
   path('switch-file-public-view/', views.ToggleFilePublicView.as_view(), name='switch-userFile-public-view'),
   path('switch-file-public-view/<int:userFileId>/', views.ToggleFilePublicView.as_view()),
   path(
       'non-institutions',
       views.InstitutionNonUserFilesSharedListView.as_view(),
       name='institution-non-user-files-list'
   ),
   path(
       'non-institutions/<int:user_file_id>/',
       views.InstitutionNonUserFilesSharedListView.as_view(),
   ),
   path(
       'shared-institutions',
       views.UserFileSharedInstitutionsListView.as_view(),
       name='shared-institutions-user-file'
   ),
   path(
       'shared-institutions/<int:user_file_id>/',
       views.UserFileSharedInstitutionsListView.as_view(),
   ),
   path(
       'share-to-institution',
       views.AddInstitutionToUserFileView.as_view(),
       name='share-user-file-to-institution'
   ),
   path(
       'remove-institution',
       views.RemoveInstitutionFromUserFileView.as_view(),
       name='remove-institution-user-file'
   ),
]
