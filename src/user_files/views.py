from typing import Optional
from chunked_upload.models import ChunkedUpload
from chunked_upload.views import ChunkedUploadCompleteView, ChunkedUploadView
from django.contrib.auth.base_user import AbstractBaseUser
from django.core.files.uploadedfile import UploadedFile
from django.db.models import Q, Count, QuerySet
from django.http import HttpRequest, HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, filters
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from common.pagination import StandardResultsSetPagination
from .serializers import UserFileSerializer, UserFileWithoutFileObjSerializer
from .models import UserFile


class UserFileChunkedUploadView(ChunkedUploadView):
    """API to upload a chunk of a user file"""
    model = ChunkedUpload
    field_name = 'file_obj'


class UserFileChunkedUploadCompleteView(ChunkedUploadCompleteView):
    """API to complete the upload"""
    model = ChunkedUpload
    do_md5_check = True
    raised_exception: Optional[ValidationError] = None  # To use in the get_response_data

    def on_completion(self, uploaded_file: UploadedFile, request):
        """Callback when the upload is complete"""
        data = request.POST.dict()
        data['file_obj'] = uploaded_file  # Assigns the uploaded file to the new object
        serializer = UserFileSerializer(data=data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)  # is_valid() must be called
            serializer.save()
        except ValidationError as ex:
            self.raised_exception = ex

    def get_response_data(self, chunked_upload: ChunkedUpload, request):
        """Final response, returns the created UserFile object"""
        if self.raised_exception is None:
            return { 'ok': True }

        error_msg = self.raised_exception.detail['file_obj']['status']['message']
        return {
            'ok': False,
            'file': None,
            'errorMsg': error_msg
        }


def get_an_user_file(user: AbstractBaseUser, user_file_pk: int) -> UserFile:
    """
    Returns the specific User's file object from DB
    @param user: User to retrieve his Dataset
    @param user_file_pk: ID of the UserFile to retrieve
    @raise 404 HTTP error if the object isn't in the DB
    @return: UserFile object
    """
    queryset = get_user_files(
        user,
        public_only=False,
        private_only=False,
        with_survival_only=False
    )
    return get_object_or_404(queryset, pk=user_file_pk)


def get_own_or_as_admin_user_files(user: AbstractBaseUser):
    """
    Returns only the User's Files which were uploaded by himself or belongs to an Institution which his is the admin of
    @param user: User to retrieve his Datasets
    @return: User's Files
    """
    return UserFile.objects.filter(Q(user=user) | (
        Q(institutions__institutionadministration__user=user)
        & Q(institutions__institutionadministration__is_institution_admin=True)
    )).distinct()


def get_user_files(user: AbstractBaseUser, public_only: bool, private_only: bool, with_survival_only: bool) -> QuerySet:
    """
    Returns the User's files objects from DB
    @param user: User to retrieve his Datasets
    @param public_only: If True retrieves only the public Datasets
    @param private_only: If True retrieves only the uploaded Datasets by the User, otherwise, returns all his datasets
    and the Datasets of the Institutions the user belongs to. If public_only is set to True, this parameter is ignored
    @param with_survival_only: If True retrieves only the clinical Datasets which have at least on survival column tuple
    @return: QuerySet of UserFile objects
    """
    if public_only:
        # Gets public Datasets
        filter_condition = Q(is_public=True)
    else:
        # Gets UserFiles which belongs to current user
        filter_condition = Q(user=user)
        if not private_only:
            # Gets public datasets too
            filter_condition |= Q(is_public=True)

            # In some cases, gets the Datasets of the Institutions the user belongs to
            filter_condition |= Q(institutions__institutionadministration__user=user)

    # Filters by survival data
    user_files_objects = UserFile.objects
    if with_survival_only:
        user_files_objects = user_files_objects.annotate(survival_columns_count=Count('survival_columns'))
        filter_condition &= Q(survival_columns_count__gt=0)

    return user_files_objects.filter(filter_condition).select_related('tag').distinct()

def get_user_file_headers(user, id_source: int,) -> QuerySet:
    """
    Returns the User's files objects from DB
    @param user: User to retrieve his Datasets
    @param public_only: If True retrieves only the public Datasets
    @param private_only: If True retrieves only the uploaded Datasets by the User, otherwise, returns all his datasets
    and the Datasets of the Institutions the user belongs to. If public_only is set to True, this parameter is ignored
    @param with_survival_only: If True retrieves only the clinical Datasets which have at least on survival column tuple
    @return: QuerySet of UserFile objects
    """
    user_file = self.get_an_user_file(user=user, user_file_pk=id_source)
    list_of_header = user_file.get_column_names()
    print(list_of_header)
    return []

class UserFileList(generics.ListAPIView):
    """REST endpoint: list for UserFile model. """
    def get_queryset(self):
        # Returns own Datasets if explicitly requested...
        visibility = self.request.GET.get('visibility')
        public_only = visibility == 'public'
        private_only = visibility == 'private'
        with_survival_only = self.request.GET.get('with_survival_only') == 'true'
        return get_user_files(self.request.user, public_only, private_only, with_survival_only)

    serializer_class = UserFileWithoutFileObjSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['tag', 'file_type', 'institutions']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'description', 'upload_date', 'tag', 'user', 'file_type']
    pagination_class = StandardResultsSetPagination


class UserFileDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    REST endpoint: get, modify or delete for UserFile model. A User can modify or delete ONLY the files which were
    uploaded by himself or belongs to an Institution which his is the admin of
    """

    def get_queryset(self):
        return get_own_or_as_admin_user_files(self.request.user)

    serializer_class = UserFileSerializer
    permission_classes = [permissions.IsAuthenticated]


class DownloadUserFile(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest, pk: Optional[int] = None):
        """Downloads the specified file considering security"""
        if not pk:
            raise Http404()

        # This function raises a 404 error in case of non-existing UserFile
        user_file = get_an_user_file(user=request.user, user_file_pk=pk)

        file_obj = user_file.file_obj.file
        response = HttpResponse(file_obj, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename={user_file.name}'

        return response
