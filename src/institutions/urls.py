from django.urls import path

from . import views

urlpatterns = [
    path('', views.institutions_action, name='institutions'),
    path('my-institutions-as-admin', views.InstitutionAsAdminList.as_view(), name='user_institutions_as_admin'),
    path('my-institutions', views.InstitutionList.as_view(), name='user_institutions'),
    path('user-candidates', views.UserCandidatesList.as_view(), name='user_candidates'),
    path(
        'add-remove-user-to-institution',
        views.add_remove_user_to_institution_action,
        name='add_remove_user_to_institution'
    )
]
