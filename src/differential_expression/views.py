import logging
from typing import Optional, Dict, Tuple, List

import numpy as np
import pandas as pd
from celery.contrib.abortable import AbortableAsyncResult
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from api_service.enums import SourceType, CommonSamplesStatusErrorCode
from api_service.utils import get_cgds_dataset
from common.enums import ResponseCode
from common.functions import get_enum_from_value, get_intersection, encode_json_response_status
from common.pagination import StandardResultsSetPagination
from common.response import ResponseStatus
from api_service.models import ExperimentClinicalSource, ExperimentSource
from datasets_synchronization.models import CGDSDataset
from datasets_synchronization.models import CGDSStudy
from differential_expression.models import (
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentState,
)
from differential_expression.serializers import (
    DifferentialExpressionExperimentDetailSerializer,
    DifferentialExpressionExperimentResultSerializer,
    DifferentialExpressionExperimentListSerializer,
    DifferentialExpressionVolcanoPlotSerializer,
)
from user_files.models import UserFile
from user_files.models_choices import FileType
from user_files.views import get_an_user_file
from .tasks import eval_differential_expression_experiment


def create_differential_expression_source(
        source_type: int,
        request: Request,
        file_type: FileType,
        prefix: str
) -> tuple[
    ExperimentSource | ExperimentClinicalSource | None, ExperimentClinicalSource | None
]:
    """
    Creates a Source object for differential expression experiments.
    """
    is_clinical = prefix == 'clinical'
    source = ExperimentClinicalSource() if is_clinical else ExperimentSource()
    clinical_source = None

    if source_type == SourceType.NEW_DATASET.value:
        # Adds a new User's file and uses it
        source_file = getattr(request, 'FILES', {}).get(f'{prefix}File')
        if source_file is None:
            return None, None

        user_file = UserFile(
            name=source_file.name,
            description=None,
            file_obj=source_file,
            file_type=file_type,
            user=request.user
        )
        user_file.save()
        user_file.compute_post_saved_field()
        source.user_file = user_file

    elif source_type == SourceType.CGDS.value:
        # Gets the CGDS Study
        post_data = getattr(request, 'data', {}) or getattr(request, 'POST', {})
        cgds_study_pk = post_data.get(f'{prefix}CGDSStudyPk')
        if not cgds_study_pk:
            return None, None

        cgds_study = CGDSStudy.objects.get(pk=int(cgds_study_pk))

        if is_clinical:
            # For clinical sources, we need both datasets
            if cgds_study.clinical_patient_dataset and cgds_study.clinical_sample_dataset:
                source.cgds_dataset = cgds_study.clinical_patient_dataset
                source.extra_cgds_dataset = cgds_study.clinical_sample_dataset
            else:
                return None, None
        else:
            cgds_dataset = get_cgds_dataset(cgds_study, file_type)
            if cgds_dataset:
                source.cgds_dataset = cgds_dataset
            else:
                return None, None

    else:
        # Uses an existing User's file
        post_data = getattr(request, 'data', {}) or getattr(request, 'POST', {})
        existing_file_pk = post_data.get(f'{prefix}ExistingFilePk')
        if not existing_file_pk:
            return None, None

        user_file = get_an_user_file(user=request.user, user_file_pk=int(existing_file_pk))
        source.user_file = user_file

    source.save()
    return source, clinical_source


class DifferentialExpressionDetail(generics.RetrieveAPIView):
    """
    Endpoint to retrieve a differential expression experiment.
    """

    def get_queryset(self) -> DifferentialExpressionExperiment:
        """
        Retrieve the differential expression experiment by its ID.
        """
        user = self.request.user
        experiment_id = self.kwargs.get('pk')
        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=experiment_id)
        # Check if the user has access to the experiment
        if not (experiment.is_public or
                experiment.user == user or
                experiment.shared_institutions.filter(institutionadministration__user=user).exists() or
                experiment.shared_users.filter(id=user.id).exists()):
            raise ValidationError('You do not have permission to access this experiment.')

        return experiment.results.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['gene']
    serializer_class = DifferentialExpressionExperimentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class DifferentialExpressionList(generics.ListAPIView):
    """
    Endpoint to list all differential expression experiments.
    Returns only the fields: id, Name, Description, Date, State, Sources and if it is public.
    """

    def get_queryset(self):
        """
        Endpoint to list all differential expression experiments.
        """
        user = self.request.user
        experiments = DifferentialExpressionExperiment.objects.filter(
            Q(is_public=True) |
            Q(user=user) |
            Q(shared_institutions__institutionadministration__user=user) |
            Q(shared_users=user)
        ).distinct()

        return experiments

    serializer_class = DifferentialExpressionExperimentListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']


class DifferentialExpressionRetrieve(generics.RetrieveAPIView):
    """
    Endpoint to retrieve a single differential expression experiment by ID.
    """
    serializer_class = DifferentialExpressionExperimentListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Returns experiments the user has access to.
        """
        user = self.request.user
        return DifferentialExpressionExperiment.objects.filter(
            Q(is_public=True) |
            Q(user=user) |
            Q(shared_institutions__institutionadministration__user=user) |
            Q(shared_users=user)
        ).distinct()

    def get_object(self):
        """
        Retrieves the experiment and checks permissions.
        """
        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=self.kwargs.get('pk'))
        user = self.request.user

        # Check if the user has access to the experiment
        if not (experiment.is_public or
                experiment.user == user or
                experiment.shared_institutions.filter(institutionadministration__user=user).exists() or
                experiment.shared_users.filter(id=user.id).exists()):
            raise ValidationError('You do not have permission to access this experiment.')

        return experiment
    filterset_fields = ['tool']


class DifferentialExpressionSubmit(APIView):
    """
    Endpoint to submit a differential expression experiment.
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request: Request):
        """
        Endpoint to submit a differential expression experiment.
        """
        with transaction.atomic():
            # Get basic experiment data
            post_data = getattr(request, 'data', {}) or getattr(request, 'POST', {})

            name = post_data.get('name', 'Differential Expression Experiment')
            description = post_data.get('description', '')

            # Clinical source
            clinical_source_type = post_data.get('clinicalType')

            if clinical_source_type:
                clinical_source_type = int(clinical_source_type)
                clinical_source, clinical_aux = create_differential_expression_source(
                    clinical_source_type, request, FileType.CLINICAL, 'clinical')
                # Select the valid one (if it's a CGDSStudy it needs clinical_aux as it has both needed CGDSDatasets)
                clinical_source = clinical_aux if clinical_aux is not None else clinical_source
            else:
                clinical_source = None

            if clinical_source is None:
                raise ValidationError('Invalid clinical source')

            # mRNA source
            mrna_source_type = post_data.get('mRNAType')
            if mrna_source_type:
                mrna_source_type = int(mrna_source_type)
                mrna_source, _mrna_clinical = create_differential_expression_source(
                    mrna_source_type, request, FileType.MRNA, 'mRNA')
            else:
                mrna_source = None

            if mrna_source is None:
                raise ValidationError('Invalid mRNA source')

            # Clinical attribute
            clinical_attribute = post_data.get('clinicalAttribute')
            if not clinical_attribute:
                raise ValidationError('Clinical attribute is required')

            # Threshold percentile
            try:
                threshold_percentile_str = post_data.get('thresholdPercentile', '0.15')
                threshold_percentile = float(threshold_percentile_str)
            except (ValueError, TypeError) as exc:
                raise ValidationError('Invalid threshold percentile value') from exc

            if threshold_percentile < 0 or threshold_percentile > 1:
                raise ValidationError('Threshold percentile must be between 0 and 1')

            # Threshold
            try:
                threshold_str = post_data.get('threshold', '0.0001')
                threshold = float(threshold_str)
            except (ValueError, TypeError) as exc:
                raise ValidationError('Invalid threshold value') from exc

            if threshold < 0 or threshold > 1:
                raise ValidationError('Threshold must be between 0 and 1')

            # Top parameter
            try:
                top_str = post_data.get('top', '100')
                top = int(top_str)
            except (ValueError, TypeError) as exc:
                raise ValidationError('Invalid top value') from exc

            if top < 1 or top > 1000:
                raise ValidationError('Top must be between 1 and 1000')

            # Create the differential expression experiment
            experiment = DifferentialExpressionExperiment.objects.create(
                name=name,
                description=description,
                clinical_source=clinical_source,
                mrna_source=mrna_source,
                clinical_attribute=clinical_attribute,
                threshold_percentile=threshold_percentile,
                threshold=threshold,
                top=top,
                user=request.user,
            )

            # Start the async task
            async_res = eval_differential_expression_experiment.apply_async(
                (experiment.pk,), queue='differential_expression')

            experiment.task_id = async_res.task_id
            experiment.save(update_fields=['task_id'])

            return Response({'ok': True})


class DifferentialExpressionResults(generics.ListAPIView):
    """
    Endpoint to get results for a differential expression experiment.
    Supports filtering by p-value and fold-change thresholds via query parameters.
    """
    serializer_class = DifferentialExpressionExperimentResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['gene']
    ordering_fields = ['adj_p_val', 'log_fc', 'p_value', 'ave_expr']
    ordering = ['adj_p_val']  # Default ordering by adjusted p-value

    def get_queryset(self):
        experiment_id = self.kwargs.get('pk')
        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=experiment_id)

        # Check permissions
        user = self.request.user
        if not (experiment.is_public or
                experiment.user == user or
                experiment.shared_institutions.filter(institutionadministration__user=user).exists() or
                experiment.shared_users.filter(id=user.id).exists()):
            raise ValidationError('You do not have permission to access this experiment.')

        # Get query parameters for filtering (optional)
        p_threshold = self.request.query_params.get('p_threshold')
        fc_threshold = self.request.query_params.get('fc_threshold')

        # If filtering parameters are provided, apply filtering
        if p_threshold is not None or fc_threshold is not None:
            try:
                p_threshold = float(p_threshold) if p_threshold is not None else 0.05
                fc_threshold = float(fc_threshold) if fc_threshold is not None else 2.0
            except ValueError as exc:
                raise ValidationError('Invalid threshold values. Must be numeric.') from exc

            # Validate thresholds
            if p_threshold < 0 or p_threshold > 1:
                raise ValidationError('p_threshold must be between 0 and 1')
            if fc_threshold < 0:
                raise ValidationError('fc_threshold must be positive')

            return experiment.get_significant_genes(p_threshold, fc_threshold)

        # Return all results if no filtering parameters
        return experiment.results.all()


class DifferentialExpressionVolcanoData(generics.ListAPIView):
    """
    Endpoint to get all results for a volcano plot visualization.
    Returns all results without pagination in a format suitable for volcano plots.
    Format: [{id, label, log2FC, pValue}, ...]
    """
    serializer_class = DifferentialExpressionVolcanoPlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination for volcano plot

    def get_queryset(self):
        """Get all results for the specified experiment with permission checks."""
        pk = self.kwargs.get('pk')
        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=pk)

        # Check permissions
        user = self.request.user
        if not (experiment.is_public or
                experiment.user == user or
                experiment.shared_institutions.filter(institutionadministration__user=user).exists() or
                experiment.shared_users.filter(id=user.id).exists()):
            raise ValidationError('You do not have permission to access this experiment.')

        # Return all results (no pagination)
        return experiment.results.all()


class DifferentialExpressionStop(APIView):
    """
    Endpoint to stop a differential expression experiment.
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: Request):
        experiment_id = request.GET.get('experimentId')
        if not experiment_id:
            raise ValidationError('experimentId is required.')

        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=experiment_id)

        user = request.user
        if not (experiment.is_public or
                experiment.user == user or
                experiment.shared_institutions.filter(institutionadministration__user=user).exists() or
                experiment.shared_users.filter(id=user.id).exists()):
            raise ValidationError('You do not have permission to access this experiment.')

        # Task state and validation
        if not experiment.task_id:
            return Response({'ok': False, 'detail': 'The experiment does not have an associated task.'})

        # If it's no running, there's nothing to stop
        if experiment.state in [
            DifferentialExpressionExperimentState.COMPLETED,
            DifferentialExpressionExperimentState.STOPPED,
            DifferentialExpressionExperimentState.FINISHED_WITH_ERROR,
            DifferentialExpressionExperimentState.TIMEOUT_EXCEEDED,
            DifferentialExpressionExperimentState.REACHED_ATTEMPTS_LIMIT,
            DifferentialExpressionExperimentState.EMPTY_DATASET,
            DifferentialExpressionExperimentState.NO_SAMPLES_IN_COMMON,
            DifferentialExpressionExperimentState.NO_FEATURES_FOUND,
        ]:
            return Response({'ok': False, 'detail': f'The experiment is not running. Status: {experiment.state}'})

        # Try to abort the AbortableTask
        try:
            async_res = AbortableAsyncResult(experiment.task_id)
            aborted = async_res.abort()  # Signals the task to abort (self.is_aborted() == True)
        except Exception as e:
            return Response({'ok': False, 'detail': f'The task could not be stopped: {e}'})

        # Mark the experiment as STOPPING; the task will mark it as STOPPED in the finally block
        experiment.state = DifferentialExpressionExperimentState.STOPPING
        experiment.save(update_fields=['state'])

        return Response({'ok': bool(aborted)})


class GetCommonSamplesDifferentialExperiment(APIView):
    """Gets the number of in common samples between two datasets"""

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: Request):
        mrna_source_id = request.GET.get('mRNASourceId')
        mrna_source_type = request.GET.get('mRNASourceType')
        clinical_source_id = request.GET.get('clinicalSourceId')
        clinical_source_type = request.GET.get('clinicalSourceType')
        if None in [mrna_source_id, mrna_source_type, clinical_source_id,
                    clinical_source_type]:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='Invalid request params',
                    internal_code=CommonSamplesStatusErrorCode.INVALID_PARAMS
                ),
            }
        else:
            # Cast parameters
            mrna_source_id = int(mrna_source_id)
            mrna_source_type = get_enum_from_value(
                int(mrna_source_type), SourceType)

            clinical_source_id = int(clinical_source_id)
            clinical_source_type = get_enum_from_value(int(clinical_source_type), SourceType)

            # Gets df
            samples_list_mrna, response = get_samples_list(
                mrna_source_id,
                mrna_source_type,
                FileType.MRNA,
                request.user
            )

            # Response will be != None if an error occurred
            if response is None:
                samples_list_clinical, response = get_samples_list(
                    clinical_source_id,
                    clinical_source_type,
                    FileType.CLINICAL,
                    request.user
                )
                intersection = get_intersection(samples_list_mrna, samples_list_clinical)
                # Gets intersection

                if response is None:
                    response = {
                        'status': ResponseStatus(ResponseCode.SUCCESS),
                        'data': {
                            'number_samples_mrna': len(samples_list_mrna) if samples_list_mrna is not None else 0,
                            'number_samples_clinical': len(
                                samples_list_clinical) if samples_list_clinical is not None else 0,
                            'number_samples_in_common': intersection.size
                        }
                    }

        # Formats to JSON the ResponseStatus object
        return encode_json_response_status(response)


class GetCommonSamplesDifferentialOneFrontExperiment(APIView):
    permission_classes = [permissions.IsAuthenticated]
    """Gets the number of in common samples between two datasets, one in the backend and other in the frontend"""

    @staticmethod
    def post(request: Request):
        post_data = getattr(request, 'data', {}) or getattr(request, 'POST', {})
        headers_in_front: Optional[List[str]] = post_data.get('headersColumnsNames')
        other_source_id = post_data.get('otherSourceId')
        other_source_type = post_data.get('otherSourceType')
        other_source_file_type = post_data.get('otherSourceFileType')

        if headers_in_front is None or other_source_id is None or other_source_type is None or other_source_file_type is None:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='Invalid request params',
                    internal_code=CommonSamplesStatusErrorCode.INVALID_PARAMS
                ),
            }
        else:
            # Cast parameters
            other_source_id = int(other_source_id)
            other_source_type = get_enum_from_value(
                int(other_source_type), SourceType)

            # Gets df
            samples_list_1, response = get_samples_list(
                other_source_id,
                other_source_type,
                other_source_file_type,
                request.user
            )

            # Response will be != None if an error occurred
            if response is None:
                intersection: np.ndarray = get_intersection(
                    samples_list_1, headers_in_front)
                response = {
                    'status': ResponseStatus(ResponseCode.SUCCESS),
                    'data': {
                        'number_samples_backend': len(samples_list_1) if samples_list_1 else 0,
                        'number_samples_in_common': intersection.size
                    }
                }

        # Formats to JSON the ResponseStatus object
        return encode_json_response_status(response)


class ToggleDiffExperimentPublicView(APIView):
    """
    API endpoint to toggle the 'is_public' field of an experiment.
    Only the owner of the experiment can perform this action.
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        """
        Toggle the 'is_public' field of the experiment.
        """
        data = request.data
        experiment_id = data.get('experimentId')
        experiment = get_object_or_404(DifferentialExpressionExperiment, id=experiment_id)
        if experiment.user.id != request.user.id:
            return Response(
                {"error": "You do not have permission to modify this experiment."},
                status=status.HTTP_403_FORBIDDEN
            )

        experiment.is_public = not experiment.is_public
        experiment.save(update_fields=['is_public'])

        return Response(
            {"id": experiment.id, "is_public": experiment.is_public}
        )


class DifferentialExpressionUpdate(APIView):
    """
    Endpoint to update name and description of a differential expression experiment.
    Only the owner can update the experiment.
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def patch(request: Request, pk: int):
        """
        Update name and/or description of a differential expression experiment.
        """
        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=pk)

        # Only the owner can update the experiment
        if experiment.user.id != request.user.id:
            return Response(
                {'ok': False, 'detail': 'You do not have permission to update this experiment.'},
                status=403
            )

        # Get the data from request
        data = request.data
        name = data.get('name')
        description = data.get('description')

        # Validate that at least one field is provided
        if name is None and description is None:
            return Response(
                {'ok': False, 'detail': 'At least one field (name or description) must be provided.'},
                status=400
            )

        # Validate that name is not empty if provided
        if name is not None and not name:
            return Response(
                {'ok': False, 'detail': 'Experiment name cannot be empty.'},
                status=400
            )

        # Update fields if provided
        fields_to_update = []
        if name is not None:
            experiment.name = name
            fields_to_update.append('name')
        if description is not None:
            experiment.description = description
            fields_to_update.append('description')

        # Save the experiment
        experiment.save(update_fields=fields_to_update)

        return Response({
            'ok': True,
            'data': {
                'id': experiment.id,
                'name': experiment.name,
                'description': experiment.description
            }
        })


class DifferentialExpressionDelete(APIView):
    """
    Endpoint to delete a differential expression experiment.
    Only the owner can delete the experiment.
    The experiment must not be running (must be completed, stopped, or in an error state).
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def delete(request: Request, pk: int):
        """
        Delete a differential expression experiment.
        """
        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=pk)

        # Only the owner can delete the experiment
        if experiment.user.id != request.user.id:
            return Response(
                {'ok': False, 'detail': 'You do not have permission to delete this experiment.'},
                status=403
            )

        # Check if the experiment is currently running
        running_states = [
            DifferentialExpressionExperimentState.IN_PROCESS,
            DifferentialExpressionExperimentState.WAITING_FOR_QUEUE,
            DifferentialExpressionExperimentState.STOPPING,
        ]

        if experiment.state in running_states:
            return Response(
                {
                    'ok': False,
                    'detail': f'Cannot delete experiment while it is running. Current state: {experiment.get_state_display()}. Please stop the experiment first.'
                },
                status=400
            )

        # If the experiment has a task_id and is somehow still active, abort it
        if experiment.task_id:
            try:
                async_res = AbortableAsyncResult(experiment.task_id)
                if async_res.state in ['PENDING', 'STARTED', 'RETRY']:
                    async_res.abort()
            except Exception as ex:
                # If we can't abort, continue with deletion anyway since state shows it's not running
                logging.exception(ex)

        # Delete the experiment (cascade will delete related objects)
        experiment.delete()

        return Response({'ok': True})


def get_samples_list(
        id_source: int,
        type_source: Optional[SourceType],
        file_type: Optional[FileType],
        user
) -> Tuple[Optional[List[str]], Optional[Dict]]:
    """
    Gets a DataFrame from the file retrieve from DB or MongoDB with an id and SourceType.
    @param id_source: ID of the UserFile/CGDSDataset to retrieve.
    @param type_source: Source type to check if it's a UserFile or a CGDSDataset.
    @param file_type: FileType (mRNA, miRNA, etc.) to get the corresponding CGDSDataset.
    @param user: Current logged user to retrieve only his datasets.
    @return: A DataFrame (if corresponds) and a Response dict (the dataset doesn't exist).
    """
    list_of_samples = None
    response = None
    if type_source is None:
        response = {
            'status': ResponseStatus(
                ResponseCode.ERROR,
                message=f'The source type {type_source} does not exist',
                internal_code=CommonSamplesStatusErrorCode.SOURCE_TYPE_DOES_NOT_EXISTS
            ),
        }
    elif type_source == SourceType.UPLOADED_DATASETS:
        try:
            user_file = get_an_user_file(user=user, user_file_pk=id_source)
            if file_type == FileType.CLINICAL:
                list_of_samples = user_file.get_first_column_of_all_rows()
            else:
                list_of_samples = user_file.get_column_names()
        except UserFile.DoesNotExist:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message=f'The UserFile with id = {id_source} does not exist',
                    internal_code=CommonSamplesStatusErrorCode.DATASET_DOES_NOT_EXISTS
                ),
            }
    elif type_source == SourceType.CGDS:
        try:
            # Gets the CGDS Study
            cgds_study = CGDSStudy.objects.get(pk=id_source)

            # Gets the corresponding Study's Dataset
            cgds_dataset = get_cgds_dataset(cgds_study, file_type)

            list_of_samples = cgds_dataset.get_column_names()

        except CGDSDataset.DoesNotExist:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message=f'The CGDS dataset with id = {id_source} does not exist',
                    internal_code=CommonSamplesStatusErrorCode.DATASET_DOES_NOT_EXISTS
                ),
            }

    return list_of_samples, response


@login_required
def download_differential_expression_results(request, pk: int):
    """
    Downloads all the differential expression results for a specific experiment.
    Returns a TSV file with all results (no pagination).
    Supports optional filtering via query parameter:
    - p_value: adjusted p-value threshold (returns genes with adj_p_val <= p_value)
    """
    experiment = get_object_or_404(DifferentialExpressionExperiment, pk=pk)

    # Check permissions
    user = request.user
    if not (experiment.is_public or
            experiment.user == user or
            experiment.shared_institutions.filter(institutionadministration__user=user).exists() or
            experiment.shared_users.filter(id=user.id).exists()):
        return HttpResponse('Unauthorized', status=401)

    # Get filter parameter from query string
    p_value = request.GET.get('p_value')

    # Apply filter if provided
    if p_value is not None:
        try:
            p_value = float(p_value)
        except ValueError:
            return HttpResponse('Invalid p_value. Must be numeric.', status=400)

        # Validate p_value
        if p_value < 0 or p_value > 1:
            return HttpResponse('p_value must be between 0 and 1', status=400)

        # Filter results: adj_p_val <= p_value (significant genes)
        results = experiment.results.filter(adj_p_val__lte=p_value).order_by('adj_p_val')
        filename_suffix = f'_filtered_p{p_value}'
    else:
        # Get all results (no filtering)
        results = experiment.results.all().order_by('adj_p_val')
        filename_suffix = '_all'

    if not results.exists():
        return HttpResponse('No results found for this experiment', status=404)

    # Convert results to list of dictionaries
    results_data = []
    for result in results:
        results_data.append({
            'gene': result.gene,
            'log_fc': result.log_fc,
            'ave_expr': result.ave_expr,
            't_statistic': result.t_statistic,
            'p_value': result.p_value,
            'adj_p_val': result.adj_p_val,
            'b_statistic': result.b_statistic
        })

    # Create DataFrame and convert to TSV
    df = pd.DataFrame(results_data)
    file_to_send = ContentFile(df.to_csv(sep='\t', decimal='.', index=False))

    # Generate HTTP response for file download
    response = HttpResponse(file_to_send, 'text/csv')
    response['Content-Length'] = file_to_send.size
    response['Content-Disposition'] = f'attachment; filename="{experiment.name}_results{filename_suffix}.tsv"'

    return response
