from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from rest_framework import generics, permissions, filters
import json
from common.enums import ResponseCode
from common.functions import encode_json_response_status
from common.response import ResponseStatus
from .enums import AddRemoveUserToInstitutionStatusErrorCode
from .models import Institution
from .serializers import InstitutionSerializer, UserCandidateSerializer
from django.contrib.auth.models import User
from common.pagination import StandardResultsSetPagination
from django_filters.rest_framework import DjangoFilterBackend


class InstitutionAsAdminList(generics.ListAPIView):
    """REST endpoint: list for Institution model of which the current user is admin"""

    def get_queryset(self):
        return Institution.objects.filter(
            institutionadministration__user=self.request.user,
            institutionadministration__is_institution_admin=True
        )

    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = []
    search_fields = ['name']
    ordering_fields = ['name', 'location']


class InstitutionList(generics.ListAPIView):
    """REST endpoint: list for Institution model of which the current user is part"""

    def get_queryset(self):
        return Institution.objects.filter(institutionadministration__user=self.request.user)

    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserCandidatesList(generics.ListAPIView):
    """REST endpoint: list for User model. Used to add to an Institution"""

    def get_queryset(self):
        # Parses the request search param
        query_search = self.request.GET.get('querySearch', '')
        query_search = query_search.strip()
        
        if not query_search:
            return User.objects.none()
        
        # Returns only 3 results
        return User.objects.filter(username__icontains=query_search)[:3]

    serializer_class = UserCandidateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = []
    search_fields = ['name']
    ordering_fields = ['name']


@login_required
def add_remove_user_to_institution_action(request):
    """Adds/remove an User to an Institution"""
    json_request_data = json.loads(request.body)
    user_id = json_request_data.get('userId')
    institution_id = json_request_data.get('institutionId')
    is_adding = json_request_data.get('isAdding')

    if user_id is None or institution_id is None or is_adding is None:
        response = {
            'status': ResponseStatus(
                ResponseCode.ERROR,
                message='Invalid request params',
                internal_code=AddRemoveUserToInstitutionStatusErrorCode.INVALID_PARAMS
            )
        }
    else:
        try:
            user: User = User.objects.get(id=int(user_id))

            if user.username != request.user.username:
                # Gets the Institution
                # and check if current user is admin of the Institution his is adding Users to
                institution: Institution = Institution.objects.get(
                    id=int(institution_id),
                    institutionadministration__user=request.user,
                    institutionadministration__is_institution_admin=True
                )

                # Adds/Remove user
                if is_adding:
                    institution.users.add(user)
                else:
                    institution.users.remove(user)

                institution.save()

                response = {
                    'status': ResponseStatus(ResponseCode.SUCCESS)
                }
            else:
                response = {
                    'status': ResponseStatus(
                        ResponseCode.ERROR,
                        message='You cannot remove yourself from the institution!',
                        internal_code=AddRemoveUserToInstitutionStatusErrorCode.CANNOT_REMOVE_YOURSELF
                    )
                }
        except User.DoesNotExist:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='The user does not exists',
                    internal_code=AddRemoveUserToInstitutionStatusErrorCode.USER_DOES_NOT_EXIST
                )
            }
        except Institution.DoesNotExist:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='The institution does not exists or user is not its admin',
                    internal_code=AddRemoveUserToInstitutionStatusErrorCode.INSTITUTION_DOES_NOT_EXIST
                )
            }

    return encode_json_response_status(response)


@login_required
def institutions_action(request):
    """Institutions Panel view"""
    return render(request, "frontend/institutions.html")
