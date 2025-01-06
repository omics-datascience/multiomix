from django.urls import path

from . import views

urlpatterns = [
    path('', views.institutions_action, name='institutions'),
    path('my-institutions', views.UserInstitution.as_view(), name='user_institutions'),
    path('my-institutions-list', views.UserInstitutionList.as_view(), name='user_institutions_list'),
    path('user-candidates', views.UserCandidatesList.as_view(), name='user_candidates'),
    path('user-candidates/<int:institution_id>/', views.UserCandidatesList.as_view()),
    path('create', views.CreateInstitutionView.as_view(), name='create_institution'),
    path('edit', views.UpdateInstitutionView.as_view(), name='edit_institution'),
    path('edit/<int:id>/', views.UpdateInstitutionView.as_view()),
    path('delete', views.DeleteInstitutionView.as_view(), name='delete-institution'),
    path('delete/<int:id>/', views.DeleteInstitutionView.as_view()),
    path('admin-update', views.UpdateInstitutionAdminView.as_view(), name='update-institution-admin'),
    path('admin-update/<int:id>/', views.UpdateInstitutionAdminView.as_view()),
    path(
        'add-remove-user-to-institution',
        views.add_remove_user_to_institution_action,
        name='add_remove_user_to_institution'
    )
]
