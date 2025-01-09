from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from rest_framework import generics, permissions, filters
import json
from common.enums import ResponseCode
from common.functions import encode_json_response_status
from common.response import ResponseStatus
from .enums import AddRemoveUserToInstitutionStatusErrorCode
from .models import Institution, InstitutionAdministration
from .serializers import InstitutionSerializer, UserCandidateSerializer, InstitutionListSerializer, InstitutionAdminUpdateSerializer, LimitedUserSerializer
from django.contrib.auth.models import User
from common.pagination import StandardResultsSetPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from api_service.websocket_functions import send_update_institutions_command, send_update_user_for_institution_command



class UserInstitutionList(generics.ListAPIView):
    """REST endpoint: list for Institution model of which the current user is part"""

    def get_queryset(self):
        return Institution.objects.filter(
            institutionadministration__user=self.request.user
        ).distinct()

    serializer_class = InstitutionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['name', 'location']
    ordering_fields = ['name', 'location', 'email', 'telephone_number']
class UserInstitution(generics.ListAPIView):
    """REST endpoint: list for Institution model of which the current user is part"""

    def get_queryset(self):
        return Institution.objects.filter(institutionadministration__user=self.request.user)
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserCandidatesList(generics.ListAPIView):
    """REST endpoint: list for User model. Used to add to an Institution"""

    def get_queryset(self):
        institution_id = self.kwargs.get('institution_id')
        return InstitutionAdministration.objects.filter(
            institution_id=institution_id
        )
    serializer_class = UserCandidateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['user__username']
    ordering_fields = ['user__username']

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

                for user in institution.users.all():
                    send_update_institutions_command(user.id)
                    send_update_user_for_institution_command(user.id)


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

class CreateInstitutionView(generics.CreateAPIView):
    """
    REST endpoint: Create an Institution and assign the creator as admin
    """
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Overrides the create method to add the creator as admin
        """
        # Save the institution instance
        institution = serializer.save()
        # Create a relationship between the creator and the institution as admin
        InstitutionAdministration.objects.create(
            user=self.request.user,
            institution=institution,
            is_institution_admin=True
        )

    def create(self, request, *args, **kwargs):
        """
        Handles the POST request to create an institution
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            serializer.data
        )

class UpdateInstitutionView(generics.UpdateAPIView):
    """
    REST endpoint: Update an Institution
    Allows editing 'name', 'location', 'email', and 'telephone_number'.
    """
    queryset = Institution.objects.all()
    serializer_class = InstitutionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        """
        Allow only admins of the institution to edit
        """
        return Institution.objects.filter(
            institutionadministration__user=self.request.user,
            institutionadministration__is_institution_admin=True
        )

    def update(self, request, *args, **kwargs):
        """
        Handle partial updates
        """
        partial = kwargs.pop('partial', True)  # Permite actualizaciones parciales
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

class DeleteInstitutionView(generics.DestroyAPIView):
    """
    REST endpoint: Delete an Institution
    Allows deletion only if the user is an admin of the institution.
    """
    queryset = Institution.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        """
        Allow only admins of the institution to delete it.
        """
        return Institution.objects.filter(
            institutionadministration__user=self.request.user,
            institutionadministration__is_institution_admin=True
        )

    def delete(self, request, *args, **kwargs):
        """
        Handle the delete operation with additional checks.
        """
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message="Institution deleted successfully."
                )
                }
            return encode_json_response_status(response)
           
        except Institution.DoesNotExist:
             response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message="Institution not found or you do not have permission to delete it."
                )
                }
        return encode_json_response_status(response)


class UpdateInstitutionAdminView(APIView):
    """
    REST endpoint: Update the 'is_institution_admin' field in InstitutionAdministration
    """
    queryset = InstitutionAdministration.objects.all()
    serializer_class = InstitutionAdminUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    def patch(self, request, id):
        """
        Ensure that only an institution admin can update this relationship.
        """
        relation = get_object_or_404(InstitutionAdministration, institution__institutionadministration__user=self.request.user, id=id)
        if relation.user.id == self.request.user.id:
            raise ValidationError('Can not change admin for current user.')
        relation.is_institution_admin = not relation.is_institution_admin
        relation.save(update_fields=['is_institution_admin'])
        return Response({'ok': True})

class InstitutionNonUsersListView(generics.ListAPIView):
    """
    REST endpoint: Get all users NOT associated with a specific institution.
    """
    serializer_class = LimitedUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return all users not associated with a specific institution.
        """
        institution_id = self.kwargs.get('institution_id')

        associated_user_ids = InstitutionAdministration.objects.filter(
            institution_id=institution_id
        ).values_list('user_id', flat=True)

        return get_user_model().objects.exclude(id__in=associated_user_ids)

@login_required
def institutions_action(request):
    """Institutions Panel view"""
    return render(request, "frontend/institutions.html")
