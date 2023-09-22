import logging
from common.enums import ResponseCode
from .synchronization_service import generate_study_new_version
from .tasks import sync_study
from celery.contrib.abortable import AbortableAsyncResult
from django.db.models import OuterRef, F, Subquery
from django.contrib.auth.decorators import login_required
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from common.pagination import StandardResultsSetPagination
from common.response import ResponseStatus
from .enums import SyncCGDSStudyResponseCode, SyncStrategy
from .models import CGDSStudy, CGDSDatasetSynchronizationState, CGDSStudySynchronizationState
from rest_framework import generics, permissions, filters
from user_files.models_choices import FileType
from .serializers import CGDSStudySerializer
from django.shortcuts import render


@login_required
def cgds_panel_action(request):
    """Gets the datasets' panel template"""
    return render(request, "frontend/cgds.html")


class CGDSStudyList(generics.ListCreateAPIView):
    """REST endpoint: list and creation for CGDSStudy model"""
    def get_queryset(self):
        cgds_studies = CGDSStudy.objects
        file_type = self.request.GET.get('file_type')
        only_last_version = self.request.GET.get('only_last_version', 'false') == 'true'

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
                    clinical_patient_dataset__isnull=False,
                    clinical_patient_dataset__state=CGDSDatasetSynchronizationState.SUCCESS,
                    clinical_sample_dataset__isnull=False,
                    clinical_sample_dataset__state=CGDSDatasetSynchronizationState.SUCCESS
                )
        else:
            cgds_studies = cgds_studies.all()

        if only_last_version:
            # Filters by max version and sorts by name
            cgds_studies = cgds_studies.alias(
                max_version=Subquery(
                    CGDSStudy.objects.filter(url=OuterRef('url'))
                    .order_by('-version')
                    .values('version')[:1]
                )
            ).filter(version=F('max_version')).order_by('name')
        else:
            # Otherwise sorts by name and version
            cgds_studies = cgds_studies.order_by('name', '-version')

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


class SyncCGDSStudy(APIView):
    permission_classes = [permissions.IsAdminUser]  # Only admin users can synchronize CGDS studies

    @staticmethod
    def post(request: Request):
        """Synchronizes a CGDS Study to get its datasets"""
        cgds_study_id = request.data.get('CGDSStudyId')
        if not cgds_study_id:
            response = {
                'status': ResponseStatus(
                    SyncCGDSStudyResponseCode.NOT_ID_IN_REQUEST,
                    message='Missing id in request'
                ).to_json(),
            }

            return Response(response)

        # Retrieves object from DB
        try:
            cgds_study: CGDSStudy = CGDSStudy.objects.get(pk=cgds_study_id)

            default_sync_strategy = SyncStrategy.NEW_VERSION
            sync_strategy_value = request.data.get('strategy', default_sync_strategy)
            try:
                sync_strategy = SyncStrategy(sync_strategy_value)
            except ValueError:
                sync_strategy = default_sync_strategy

            # First of all checks if exists at least one CGDS dataset with a success state
            if sync_strategy == SyncStrategy.NEW_VERSION and cgds_study.has_at_least_one_dataset_synchronized():
                logging.info(f'CGDS Study {cgds_study.name} has at least one dataset synchronized. '
                             f'Generating a new version...')
                cgds_study = generate_study_new_version(cgds_study)

            # Updates the state
            cgds_study.state = CGDSStudySynchronizationState.WAITING_FOR_QUEUE
            cgds_study.save(update_fields=['state'])

            # Gets SynchronizationService and adds the study
            only_failed = sync_strategy == SyncStrategy.SYNC_ONLY_FAILED

            # Adds the experiment to the TaskQueue and gets Task id
            async_res: AbortableAsyncResult = sync_study.apply_async((cgds_study.pk, only_failed),
                                                                     queue='sync_datasets')

            cgds_study.task_id = async_res.task_id
            cgds_study.save(update_fields=['task_id'])

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

        return Response(response)


class StopCGDSSync(APIView):
    """Stops a CGDSStudy sync process."""
    permission_classes = [permissions.IsAdminUser]  # Only admin users can stop CGDS studies

    @staticmethod
    def get(request: Request):
        cgds_study_id = request.GET.get('studyId')

        # Check if all the required parameters are in request
        if cgds_study_id is None:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='Invalid request params'
                )
            }
        else:
            try:
                # Gets CGDSStudy
                cgds_study: CGDSStudy = CGDSStudy.objects.get(pk=cgds_study_id)

                logging.warning(f'Aborting CGDSStudy {cgds_study_id}')

                # Sends the signal to abort it
                if cgds_study.task_id:
                    abortable_async_result = AbortableAsyncResult(cgds_study.task_id)
                    abortable_async_result.abort()

                # Updates Biomarker state
                cgds_study.state = CGDSStudySynchronizationState.STOPPED
                cgds_study.save(update_fields=['state'])

                response = {
                    'status': ResponseStatus(ResponseCode.SUCCESS).to_json()
                }
            except ValueError as ex:
                # Cast errors...
                logging.exception(ex)
                response = {
                    'status': ResponseStatus(
                        ResponseCode.ERROR,
                        message='Invalid request params type'
                    ).to_json()
                }
            except CGDSStudy.DoesNotExist:
                # If the CGDSStudy does not exist, returns an error
                response = {
                    'status': ResponseStatus(
                        ResponseCode.ERROR,
                        message='The CGDSStudy does not exists'
                    ).to_json()
                }

        # Formats to JSON the ResponseStatus object
        return Response(response)
