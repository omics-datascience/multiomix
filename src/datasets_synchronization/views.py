from django.http import HttpResponseForbidden, JsonResponse
from django.contrib.auth.decorators import login_required
from common.pagination import StandardResultsSetPagination
from common.response import ResponseStatus
from .enums import SyncCGDSStudyResponseCode
from .models import CGDSStudy, CGDSStudySynchronizationState, CGDSDatasetSynchronizationState
from rest_framework import generics, permissions, filters
from user_files.models_choices import FileType
from .serializers import CGDSStudySerializer
from django.shortcuts import render
from .synchronization_service import global_synchronization_service
import json


@login_required
def cgds_panel_action(request):
    """Gets the datasets panel template. Only for superusers"""
    # If the current user is not a super user, returns Forbidden Response
    # if not request.user.is_superuser:
    #    return HttpResponseForbidden()
    return render(request, "frontend/cgds.html")


class CGDSStudyList(generics.ListCreateAPIView):
    """REST endpoint: list and creation for CGDSStudy model"""
    def get_queryset(self):
        cgds_studies = CGDSStudy.objects
        file_type = self.request.GET.get('file_type')
        if file_type is not None:
            file_type = int(file_type)
            if file_type == FileType.MRNA.value:
                cgds_studies = cgds_studies.filter(
                    mrna_dataset__isnull=False,
                    mrna_dataset__state=CGDSDatasetSynchronizationState.SUCCESS
                )
            elif file_type == FileType.MIRNA.value:
                cgds_studies = cgds_studies.filter(
                    mirna_dataset__isnull=False,
                    mirna_dataset__state=CGDSDatasetSynchronizationState.SUCCESS
                )
            elif file_type == FileType.CNA.value:
                cgds_studies = cgds_studies.filter(
                    cna_dataset__isnull=False,
                    cna_dataset__state=CGDSDatasetSynchronizationState.SUCCESS
                )
            elif file_type == FileType.METHYLATION.value:
                cgds_studies = cgds_studies.filter(
                    methylation_dataset__isnull=False,
                    methylation_dataset__state=CGDSDatasetSynchronizationState.SUCCESS)
            elif file_type == FileType.CLINICAL.value:
                cgds_studies = cgds_studies.filter(
                    clinical_dataset__isnull=False,
                    clinical_dataset__state=CGDSDatasetSynchronizationState.SUCCESS
                )
        else:
            cgds_studies = cgds_studies.all()
        return cgds_studies

    serializer_class = CGDSStudySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['name', 'description']
    ordering_fields = '__all__'


class CGDSStudyDetail(generics.RetrieveUpdateDestroyAPIView):
    """REST endpoint: get, modify or delete for CGDSStudy model"""
    queryset = CGDSStudy.objects.all()
    serializer_class = CGDSStudySerializer
    permission_classes = [permissions.IsAuthenticated]


def synchronize_cgds_study_action(request):
    """Synchronizes a CGDS Study to get its datasets"""
    json_request_data = json.loads(request.body)
    cgds_study_id = json_request_data.get('CGDSStudyId')
    if not cgds_study_id:
        response = {
            'status': ResponseStatus(
                SyncCGDSStudyResponseCode.NOT_ID_IN_REQUEST,
                message='Missing id in request'
            ).to_json(),
        }

        return JsonResponse(response, safe=False)

    # Retrieves object from DB
    try:
        cgds_study_id = int(cgds_study_id)
        cgds_study: CGDSStudy = CGDSStudy.objects.get(pk=cgds_study_id)

        # Updates the state
        cgds_study.state = CGDSStudySynchronizationState.WAITING_FOR_QUEUE
        cgds_study.save()

        # Gets SynchronizationService and adds the study
        global_synchronization_service.add_cgds_study(cgds_study)

        # Makes a successful response
        response = {
            'status': ResponseStatus(
                SyncCGDSStudyResponseCode.SUCCESS,
                message='The CGDS Study was added to the synchronization queue'
            ).to_json(),
        }
    except CGDSStudy.DoesNotExist:
        # If the study does not exist, show an error in the frontend
        response = {
            'status': ResponseStatus(
                SyncCGDSStudyResponseCode.CGDS_STUDY_DOES_NOT_EXIST,
                message='The CGDS Study selected does not exist'
            ).to_json(),
        }

    return JsonResponse(response, safe=False)
