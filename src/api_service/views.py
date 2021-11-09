import json
import logging
from builtins import map
from typing import Optional, Dict, Tuple, List, Type, OrderedDict, Union, Literal, cast
import numpy as np
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse, HttpRequest, JsonResponse, Http404
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django_filters.rest_framework import DjangoFilterBackend
from lifelines import KaplanMeierFitter
from rest_framework import generics, permissions, filters
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from lifelines.statistics import logrank_test
from common.enums import ResponseCode
from common.functions import get_enum_from_value, get_integer_enum_from_value, encode_json_response_status, \
    request_bool_to_python_bool, get_intersection, create_survival_columns_from_json
from common.pagination import StandardResultsSetPagination
from common.response import ResponseStatus
from datasets_synchronization.models import CGDSStudy, CGDSDataset, SurvivalColumnsTupleCGDSDataset, \
    SurvivalColumnsTupleUserFile
from genes.models import Gene
from tags.models import Tag
from user_files.models import UserFile
from user_files.models_choices import FileType
from user_files.serializers import SurvivalColumnsTupleUserFileSimpleSerializer
from user_files.utils import get_invalid_format_response
from user_files.views import get_an_user_file
from .enums import SourceType, CorrelationGraphStatusErrorCode, CommonSamplesStatusErrorCode
from .models import Experiment, GeneMiRNACombination, GeneGEMCombination, ExperimentClinicalSource
from .models_choices import ExperimentType, ExperimentState, CorrelationMethod, PValuesAdjustmentMethod
from .enums import CorrelationType
from .mrna_service import global_mrna_service
from .ordering import CustomExperimentResultCombinationsOrdering, annotate_by_correlation
from .permissions import ExperimentIsNotRunning
from .pipelines import global_pipeline_manager
from .serializers import ExperimentSerializer, ExperimentSerializerDetail, \
    GeneMiRNACombinationSerializer, GeneCNACombinationSerializer, GeneMethylationCombinationSerializer, \
    ExperimentClinicalSourceSerializer
from .task_queue import global_task_queue
from .utils import get_experiment_source, file_type_to_experiment_type, get_cgds_dataset
import pandas as pd

KaplanMeierSample = Tuple[
    int,
    Literal[0, 1]  # 1 = interest, 0 = censored
]


@login_required
def mrna_gem_action(request: HttpRequest) -> HttpResponse:
    """
    Process the mRNA x miRNA/CNA/Methylation experiments
    """
    # Gets general parameters
    name = request.POST.get('name')
    description = request.POST.get('description')

    # Gets FileType to set the experiment type and FileType
    file_type = request.POST.get('fileType')
    file_type_enum = get_enum_from_value(int(file_type), FileType)
    experiment_type = file_type_to_experiment_type(file_type_enum)

    # CNA/Methylation analysis can select between correlate with all genes or equal only
    if experiment_type == ExperimentType.MIRNA:
        correlate_with_all_genes = True
    else:
        correlate_with_all_genes = request_bool_to_python_bool(request.POST.get('correlateWithAllGenes'))

    # Gets Tag (if exists)
    tag_id = request.POST.get('tagId')

    # Get experiment thresholds and params
    minimum_coefficient_threshold = float(request.POST.get('coefficientThreshold', 0.7))
    minimum_coefficient_threshold = max(minimum_coefficient_threshold, 0.5)  # Prevents expensive analysis
    minimum_std_gene = float(request.POST.get('standardDeviationGene', 0.0))
    minimum_std_gem = float(request.POST.get('standardDeviationGEM', 0.2))
    correlation_method = request.POST.get('correlationMethod')
    correlation_method = get_integer_enum_from_value(correlation_method, CorrelationMethod, CorrelationMethod.SPEARMAN)
    p_values_adjustment_method = request.POST.get('adjustmentMethod')
    p_values_adjustment_method = get_integer_enum_from_value(
        p_values_adjustment_method,
        PValuesAdjustmentMethod,
        PValuesAdjustmentMethod.BENJAMINI_HOCHBERG
    )

    # Get source types
    mrna_source_type = int(request.POST.get('mRNAType'))
    gem_source_type = int(request.POST.get('gemType'))

    # Instantiates the User's files
    with transaction.atomic():
        # mRNA
        mrna_source, mrna_clinical = get_experiment_source(mrna_source_type, request, FileType.MRNA, 'mRNA')
        if mrna_source is None:
            return JsonResponse(get_invalid_format_response(), safe=False)

        # GEM
        gem_source, gem_clinical = get_experiment_source(gem_source_type, request, file_type_enum, 'gem')
        if gem_source is None:
            return JsonResponse(get_invalid_format_response(), safe=False)

        # If selected, gets Tag
        if tag_id is not None:
            try:
                tag = Tag.objects.get(pk=int(tag_id), user=request.user)
            except Tag.DoesNotExist:
                tag = None
        else:
            tag = None

        # Creates an experiment and saves in DB
        experiment = Experiment(
            name=name,
            description=description,
            mRNA_source=mrna_source,
            gem_source=gem_source,
            clinical_source=mrna_clinical if mrna_clinical is not None else gem_clinical,
            correlation_method=correlation_method,
            p_values_adjustment_method=p_values_adjustment_method,
            minimum_std_gene=minimum_std_gene,
            minimum_std_gem=minimum_std_gem,
            minimum_coefficient_threshold=minimum_coefficient_threshold,
            state=ExperimentState.WAITING_FOR_QUEUE,
            user=request.user,
            type=experiment_type,
            tag=tag,
            correlate_with_all_genes=correlate_with_all_genes
        )
        experiment.save(force_insert=True)

    # Adds the experiment to the TaskQueue
    global_task_queue.add_experiment(experiment)

    response = {
        'status': ResponseStatus(ResponseCode.SUCCESS, message='Experiment added to the queue').to_json(),
    }

    return JsonResponse(response, safe=False)


class ExperimentList(generics.ListAPIView):
    """REST endpoint: list for Experiment model with pagination"""

    def get_queryset(self):
        return Experiment.objects.filter(user=self.request.user)

    serializer_class = ExperimentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['tag', 'correlation_method', 'type']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'description', 'submit_date', 'state', 'type', 'correlation_method',
                       'result_final_row_count', 'tag']


class ExperimentResultCombinationsDetails(generics.ListAPIView):
    """REST endpoint: list for GeneGEMCombinations model with pagination"""
    def get_queryset(self):
        experiment_id = self.request.GET.get('experiment_id')
        try:
            experiment: Experiment = Experiment.objects.get(pk=experiment_id, user=self.request.user)
            combinations_queryset = experiment.combinations

            # Applies the filters
            coefficient_threshold = self.request.GET.get('coefficientThreshold')
            if coefficient_threshold:
                coefficient_threshold = float(coefficient_threshold)
                combinations_queryset = annotate_by_correlation(
                    combinations_queryset
                ).filter(abs_correlation__gte=coefficient_threshold)

            correlation_type = self.request.GET.get('correlationType')
            if correlation_type:
                correlation_type = get_enum_from_value(int(correlation_type), CorrelationType)
                if correlation_type == CorrelationType.POSITIVE:
                    combinations_queryset = combinations_queryset.filter(correlation__gte=0)
                elif correlation_type == CorrelationType.NEGATIVE:
                    combinations_queryset = combinations_queryset.filter(correlation__lte=0)

        except Experiment.DoesNotExist:
            combinations_queryset = GeneMiRNACombination.objects.none()
        return combinations_queryset

    def get_serializer_class(self):
        """Gets the Serializer class depending of the Experiment's type"""
        queryset = self.get_queryset()
        if not queryset:
            return GeneMiRNACombinationSerializer
        experiment_type = queryset.first().experiment.type
        if experiment_type == ExperimentType.MIRNA:
            return GeneMiRNACombinationSerializer
        if experiment_type == ExperimentType.CNA:
            return GeneCNACombinationSerializer
        return GeneMethylationCombinationSerializer

    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [CustomExperimentResultCombinationsOrdering, filters.SearchFilter]
    search_fields = ['gene__name', 'gem']
    ordering_fields = ['gene', 'gem', 'correlation', 'p_value', 'adjusted_p_value', 'gene__chromosome',
                       'gene__start', 'gene__end', 'gene__type', 'gene__description']


class LastList(generics.ListAPIView):
    """REST endpoint: list for last user experiments model"""

    def get_queryset(self):
        limit = settings.NUMBER_OF_LAST_EXPERIMENTS
        return Experiment.objects.filter(user=self.request.user).order_by('-submit_date')[:limit]

    serializer_class = ExperimentSerializer
    permission_classes = [permissions.IsAuthenticated]


class FullExperimentDetail(generics.RetrieveAPIView):
    """REST endpoint: get for Experiment model"""

    def get_queryset(self):
        return Experiment.objects.filter(user=self.request.user)

    serializer_class = ExperimentSerializer
    permission_classes = [permissions.IsAuthenticated]


class ExperimentDetail(generics.RetrieveUpdateDestroyAPIView):
    """REST endpoint: get, modify and delete for Experiment model"""

    def get_queryset(self):
        return Experiment.objects.filter(user=self.request.user)

    serializer_class = ExperimentSerializerDetail
    permission_classes = [permissions.IsAuthenticated, ExperimentIsNotRunning]


@login_required
def get_correlation_graph_action(request):
    """Generates the info to show a correlation map in frontend"""
    experiment_id = request.GET.get('experimentId')
    gene = request.GET.get('gene')
    gem = request.GET.get('gem')

    # Check if all the required parameters are in request
    if experiment_id is None or gene is None or gem is None:
        response = {
            'status': ResponseStatus(
                ResponseCode.ERROR,
                message='Invalid request params',
                internal_code=CorrelationGraphStatusErrorCode.INVALID_PARAMS
            ),
        }
    else:
        try:
            # Gets experiment
            experiment_id = int(experiment_id)
            experiment: Experiment = Experiment.objects.get(pk=experiment_id, user=request.user)

            # Clinical source stuff
            clinical_attribute = request.GET.get('selectedClinicalGroupBy')

            # Columns to group by in frontend
            clinical_columns: List[str] = []
            if experiment.clinical_source:
                clinical_columns = experiment.clinical_source.get_attributes()

            try:
                values = global_pipeline_manager.get_valid_data_from_sources(
                    experiment,
                    gene,
                    gem,
                    round_values=True,
                    clinical_attribute=clinical_attribute,
                    return_samples_identifiers=False,
                    fill_clinical_missing_samples=True
                )

                gene_values = values[0].tolist()
                gem_values = values[1].tolist()
                clinical_values = values[2].tolist() if clinical_attribute is not None else []

                # gem_values has the same length, so it's not necessary to check
                is_data_ok: bool = len(gene_values) > 0

                response = {
                    'status': ResponseStatus(ResponseCode.SUCCESS),
                    'data': {
                        'gene_values': gene_values,
                        'gem_values': gem_values,
                        'is_data_ok': is_data_ok,
                        'clinical_values': clinical_values,
                        'clinical_columns': clinical_columns,
                    }
                }
            except KeyError as ex:
                logging.exception(ex)
                response = {
                    'status': ResponseStatus(
                        ResponseCode.ERROR,
                        message=f'Gene, GEM or clinical attribute is invalid',
                        internal_code=CorrelationGraphStatusErrorCode.INVALID_GENE_OR_GEM_NAMES
                    ),
                }
        except ValueError as ex:
            # Cast errors...
            logging.exception(ex)
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='Invalid request params type',
                    internal_code=CorrelationGraphStatusErrorCode.INVALID_PARAMS
                ),
            }
        except Experiment.DoesNotExist:
            # If the experiment does not exist, returns an error
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='The experiment does not exists',
                    internal_code=CorrelationGraphStatusErrorCode.EXPERIMENT_DOES_NOT_EXISTS
                ),
            }

    # Formats to JSON the ResponseStatus object
    return encode_json_response_status(response)


def get_samples_list(
        id_source: int,
        type_source: Optional[SourceType],
        file_type: Optional[FileType],
        user
) -> Tuple[Optional[List[str]], Optional[Dict]]:
    """
    Gets a DataFrame from the file retrieve from DB or MongoDB with an id and SourceType
    @param id_source: Id of the UserFile/CGDSDataset to retrieve
    @param type_source: Source type to check if it's a UserFile or a CGDSDataset
    @param file_type: FileType (mRNA, miRNA, etc) to get the corresponding CGDSDataset
    @param user: Current logged user to retrieve only his datasets
    @return: A DataFrame (if corresponds) and a Response dict (the dataset doesn't exist)
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
def get_number_samples_in_common_action(request):
    """Gets the number of in common samples between two datasets"""
    mrna_source_id = request.GET.get('mRNASourceId')
    mrna_source_type = request.GET.get('mRNASourceType')
    gem_source_id = request.GET.get('gemSourceId')
    gem_source_type = request.GET.get('gemSourceType')
    gem_file_type = request.GET.get('gemFileType')

    if None in [mrna_source_id, gem_source_id, mrna_source_type, gem_source_type, gem_file_type]:
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
        mrna_source_type = get_enum_from_value(int(mrna_source_type), SourceType)

        gem_source_id = int(gem_source_id)
        gem_source_type = get_enum_from_value(int(gem_source_type), SourceType)

        # Gets df
        samples_list_mrna, response = get_samples_list(
            mrna_source_id,
            mrna_source_type,
            FileType.MRNA,
            request.user
        )

        # Response will be != None if an error occurred
        gem_file_type_enum = get_enum_from_value(int(gem_file_type), FileType)
        if response is None:
            samples_list_gem, response = get_samples_list(
                gem_source_id,
                gem_source_type,
                gem_file_type_enum,
                request.user
            )

            # Gets intersection
            intersection = get_intersection(samples_list_mrna, samples_list_gem)

            if response is None:
                response = {
                    'status': ResponseStatus(ResponseCode.SUCCESS),
                    'data': {
                        'number_samples_mrna': len(samples_list_mrna) if samples_list_mrna is not None else 0,
                        'number_samples_gem': len(samples_list_gem) if samples_list_gem is not None else 0,
                        'number_samples_in_common': intersection.size
                    }
                }

    # Formats to JSON the ResponseStatus object
    return encode_json_response_status(response)


@login_required
def get_number_samples_in_common_action_one_front(request):
    """Gets the number of in common samples between two datasets"""
    json_request_data = json.loads(request.body)
    headers_in_front: Optional[List[str]] = json_request_data.get('headersColumnsNames')
    other_source_id = json_request_data.get('otherSourceId')
    other_source_type = json_request_data.get('otherSourceType')

    if headers_in_front is None or other_source_id is None or other_source_type is None:
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
        other_source_type = get_enum_from_value(int(other_source_type), SourceType)

        # Gets df
        samples_list_1, response = get_samples_list(
            other_source_id,
            other_source_type,
            FileType.MRNA,
            request.user
        )

        # Response will be != None if an error occurred
        if response is None:
            intersection: np.ndarray = get_intersection(samples_list_1, headers_in_front)
            response = {
                'status': ResponseStatus(ResponseCode.SUCCESS),
                'data': {
                    'number_samples_backend': len(samples_list_1) if samples_list_1 else 0,
                    'number_samples_in_common': intersection.size
                }
            }

    # Formats to JSON the ResponseStatus object
    return encode_json_response_status(response)


def generate_modulector_response(data: Optional[Dict]) -> Union[JsonResponse, Http404]:
    """
    Checks if the data is None, if not return a JsonResponse with its content, otherwise raises a 404 error
    @param data: JSON data to return
    @raise Http404 if data is None
    @return: A JsonResponse if data is valid
    """
    if data is not None:
        return JsonResponse(data, safe=False)
    raise Http404('Element not found')


@login_required
def get_mirna_data_action(request):
    """Gets miRNA data from Modulector"""
    data = global_mrna_service.get_modulector_service_content('mirna', request.GET, is_paginated=False)
    return generate_modulector_response(data)


@login_required
def get_mirna_interaction_action(request):
    """Searches in papers an specific miRNA interaction"""
    if 'gene' in request.GET:
        target_url = 'mirna-target-interactions'
        is_paginated = False
    else:
        target_url = 'mirna-interactions'
        is_paginated = True
    data = global_mrna_service.get_modulector_service_content(target_url, request.GET, is_paginated)
    # Special case: prefer None instead of 404 error to show "No data found message"
    return JsonResponse(data, safe=False)


@login_required
def get_mirna_diseases_action(request):
    """Searches in papers miRNA associations with diseases"""
    data = global_mrna_service.get_modulector_service_content('diseases', request.GET, is_paginated=True)
    return generate_modulector_response(data)


@login_required
def get_mirna_drugs_action(request):
    """Searches in papers miRNA associations with drugs"""
    data = global_mrna_service.get_modulector_service_content('drugs', request.GET, is_paginated=True)
    return generate_modulector_response(data)


@login_required
def get_dataset_columns_name_action(request):
    """Gets the column names of a specific Dataset"""
    source_id = request.GET.get('sourceId')
    source_type = request.GET.get('sourceType')
    column_names = []

    if source_id is not None and source_type is not None:
        # Cast parameters
        source_id = int(source_id)
        source_type = get_enum_from_value(int(source_type), SourceType)

        # Gets df
        column_names_list, response = get_samples_list(
            source_id,
            source_type,
            FileType.CLINICAL,  # This service will always be called for survival analysis
            request.user
        )

        # Response will be != None if an error occurred
        if response is None:
            column_names = column_names_list

    # Formats to JSON the ResponseStatus object
    return JsonResponse(column_names, safe=False)


def generate_result_file_response(
    combinations: List[Dict],
    experiment_name: str
) -> HttpResponse:
    """
    Generates a HttpResponse to force an experiment result file download
    @param combinations: List of experiment's combinations in dictionary format
    @param experiment_name: Experiment's name to set as file name
    @return: HttpResponse instance
    """
    df = pd.DataFrame(combinations)
    file_to_send = ContentFile(df.to_csv(sep='\t', decimal='.', index=False))
    response = HttpResponse(file_to_send, 'text/csv')
    response['Content-Length'] = file_to_send.size
    response['Content-Disposition'] = f'attachment; filename="{experiment_name}.tsv"'
    return response


@login_required
def download_full_result(request, pk: int):
    """Downloads all the combinations resulting from an analysis"""
    experiment = get_object_or_404(Experiment, pk=pk, user=request.user)

    def format_combination_object(combination: Type[GeneGEMCombination]) -> Dict:
        """
        Generates a dict from a GeneGEMCombination
        @param combination: GeneGEMCombination instance
        @return: Dict with the fields
        """
        data = {'gem': combination.gem, 'gene': combination.gene_name}
        try:
            gene_data = combination.gene
            data['chromosome'] = gene_data.chromosome
            data['start'] = gene_data.start
            data['end'] = gene_data.end
            data['type'] = gene_data.type
            data['description'] = gene_data.description
        except Gene.DoesNotExist:
            data['chromosome'] = None
            data['start'] = None
            data['end'] = None
            data['type'] = None
            data['description'] = None

        data['correlation'] = combination.correlation
        data['p_value'] = combination.p_value
        data['adjusted_p_value'] = combination.adjusted_p_value
        return data

    combinations = list(map(format_combination_object, experiment.combinations))
    return generate_result_file_response(combinations, experiment.name)


@login_required
def download_result_with_filters(request):
    """Downloads the combinations resulting from an analysis with filters applied"""
    experiment_id = request.GET.get('experiment_id')
    experiment = get_object_or_404(Experiment, pk=experiment_id, user=request.user)
    comb_dict: List[OrderedDict] = ExperimentResultCombinationsDetails.as_view()(request=request).data['results']
    if not comb_dict:
        raise Http404("No combinations found")

    combinations = list(map(dict, comb_dict))

    def format_combinations_from_dict(combination: Dict) -> Dict:
        """
        Generates a dict from a GeneGEMCombination dict with ExperimentResultCombinationsDetails returned values
        @param combination: GeneGEMCombination values dict
        @return: Dict with the fields to be downloaded
        """
        data = {'gem': combination['gem'], 'gene': combination['gene']}
        if 'gene_extra_data' in combination and combination['gene_extra_data'] is not None:
            gene_data = dict(combination['gene_extra_data'])
            data['chromosome'] = gene_data['chromosome']
            data['start'] = gene_data['start']
            data['end'] = gene_data['end']
            data['type'] = gene_data['type']
            data['description'] = gene_data['description']
        else:
            data['chromosome'] = None
            data['start'] = None
            data['end'] = None
            data['type'] = None
            data['description'] = None
        data['correlation'] = combination['correlation']
        data['p_value'] = combination['p_value']
        data['adjusted_p_value'] = combination['adjusted_p_value']
        return data

    combinations = list(map(format_combinations_from_dict, combinations))
    return generate_result_file_response(combinations, experiment.name)


def add_clinical_source(request):
    """Adds an Experiment's clinical source"""

    # Gets experiment
    experiment_id = request.POST.get('experimentPk')
    experiment = get_object_or_404(Experiment, pk=experiment_id, user=request.user)

    with transaction.atomic():
        # Creates and assign ExperimentClinicalSource instance to experiment
        clinical_source_type = int(request.POST.get('clinicalType'))
        if clinical_source_type == SourceType.CGDS:
            return HttpResponse('Unauthorized', status=401)
        clinical_source, _ = get_experiment_source(clinical_source_type, request, FileType.CLINICAL, 'clinical')

        # Creates Survival Tuples for clinical source
        survival_columns_str = request.POST.get('survival_columns', '[]')
        create_survival_columns_from_json(survival_columns_str, clinical_source.user_file)

        # Assigns to experiment and saves
        experiment.clinical_source = clinical_source
        experiment.save()

    # Serializes ExperimentClinicalSource instance and returns it
    clinical_source = ExperimentClinicalSourceSerializer(clinical_source).data
    return JsonResponse(clinical_source, safe=False)


class ExperimentClinicalSourceDetail(generics.RetrieveAPIView):
    """REST endpoint: retrieve for Experiment's clinical source"""

    def get_queryset(self):
        # User can only retrieve its UserFile (or public ones), not CGDSDatasets nor other users' datasets instances
        is_public = Q(user_file__is_public=True)
        return ExperimentClinicalSource.objects.filter(
            (is_public | (~is_public & Q(user_file__user=self.request.user))) & Q(cgds_dataset__isnull=True)
        )

    serializer_class = ExperimentClinicalSourceSerializer
    permission_classes = [permissions.IsAuthenticated]


@require_http_methods(["PATCH"])
def unlink_clinical_source_user_file(request, pk: int):
    """Unlink an Experiment's clinical source"""
    # Gets experiment
    experiment = get_object_or_404(Experiment, pk=pk, user=request.user)
    if experiment.clinical_source.user_file is None:
        # If this block is reached it means that is trying to unlink a CGDS experiment which should
        # not be possible
        return HttpResponse('Unauthorized', status=401)
    experiment.clinical_source = None
    experiment.save()
    response = {'status': ResponseStatus(ResponseCode.SUCCESS)}
    return encode_json_response_status(response)


def get_group_survival_function(data: List[KaplanMeierSample]) -> List[Dict]:
    """
    Gets list of times and events and gets the survival function
    TODO: put in a class in another file
    @param data: List of times and events
    @return: List of dicts with two fields: "time" and "probability" which are consumed in this way in frontend
    """
    kmf = KaplanMeierFitter()
    kmf.fit(
        durations=list(map(lambda x: x[0], data)),
        event_observed=list(map(lambda x: x[1], data)),
        label='probability'
    )

    survival_function = kmf.survival_function_.reset_index()
    survival_function = survival_function.rename(columns={'timeline': 'time'})
    survival_function = survival_function.sort_values(by='time')

    return survival_function.to_dict(orient='records')


def generate_survival_groups(
    clinical_time_values: np.ndarray,
    clinical_event_values: np.ndarray,
    expression_values: np.ndarray,
    fields_interest: List[str]
) -> Tuple[List[Dict], List[Dict], Dict[str, float]]:
    """
    Generate low and high groups from expression data, time and event
    @param clinical_time_values: Time values
    @param clinical_event_values: Event values
    @param expression_values: Expression values
    @param fields_interest: Field of interest, every value which is not in this list is considered censores
    @return: Low group, high group and logrank test
    """
    median_value = np.median(expression_values)

    low_group: List[KaplanMeierSample] = []
    high_group: List[KaplanMeierSample] = []

    for (time, event, expression) in zip(clinical_time_values, clinical_event_values, expression_values):
        event_valid_value = 1 if event in fields_interest else 0  # 1 = interest, 0 = censored
        new_value = cast(KaplanMeierSample, [time, event_valid_value])
        if expression < median_value:
            low_group.append(new_value)
        else:
            high_group.append(new_value)

    # Generates logrank test from time values
    logrank_res = logrank_test(
        durations_A=list(map(lambda x: x[0], low_group)),
        durations_B=list(map(lambda x: x[0], high_group)),
        event_observed_A=list(map(lambda x: x[1], low_group)),
        event_observed_B=list(map(lambda x: x[1], high_group)),
        alpha=0.95
    )

    # Get times and survival function
    low_group_survival_function = get_group_survival_function(low_group)
    high_group_survival_function = get_group_survival_function(high_group)

    return low_group_survival_function, high_group_survival_function, {
        'test_statistic': logrank_res.test_statistic,
        'p_value': logrank_res.p_value
    }


class SurvivalDataDetails(APIView):
    """REST endpoint: Gene and GEM survival data"""
    @staticmethod
    def post(request: Request):
        # Gets the specific experiment to extract gene, GEM and clinical information
        experiment = get_object_or_404(Experiment, pk=request.data.get('experimentId'))

        survival_column_id = request.data.get('survivalColumnId')

        # The survival columns are always send to generate select in frontend
        survival_columns_queryset = experiment.clinical_source.get_survival_columns()
        survival_columns = SurvivalColumnsTupleUserFileSimpleSerializer(
            survival_columns_queryset, many=True, read_only=True
        ).data

        response = {
            'survival_columns': survival_columns,
            'gene_data': None,
            'gem_data': None,
            'event_values_distinct': []
        }

        if survival_column_id is not None:
            try:
                survival_column: Optional[Union[
                    SurvivalColumnsTupleCGDSDataset,
                    SurvivalColumnsTupleUserFile
                ]] = survival_columns_queryset.get(pk=survival_column_id)
            except (SurvivalColumnsTupleCGDSDataset.DoesNotExist, SurvivalColumnsTupleUserFile.DoesNotExist):
                survival_column = None

            gene = request.data.get('gene')
            gem = request.data.get('gem')

            if survival_column is None or gene is None or gem is None:
                return HttpResponse('Bad request, gene or gem invalid', status=400)

            time_attribute = survival_column.time_column
            event_attribute = survival_column.event_column

            # Gets Gene and GEM expression with time values
            gene_values, gem_values, clinical_time_values, _gene_samples, _gem_samples, \
            clinical_samples = global_pipeline_manager.get_valid_data_from_sources(
                experiment,
                gene,
                gem,
                round_values=False,
                return_samples_identifiers=True,
                clinical_attribute=time_attribute,
                fill_clinical_missing_samples=False
            )

            # Gets event values
            clinical_event_values: np.ndarray = experiment.clinical_source.get_specific_samples_and_attribute(
                clinical_samples,
                event_attribute
            )

            # Cast all to str type (object type in Numpy) to prevent some issues setting values like 'NA'
            clinical_event_values = clinical_event_values.astype(np.object)
            clinical_event_values = global_pipeline_manager.fill_null_values_with_custom_value(clinical_event_values)

            # Filters NaNs values in time and event lists
            time_nan_idx = clinical_time_values == settings.NON_DATA_VALUE
            event_nan_idx = clinical_event_values == settings.NON_DATA_VALUE
            non_nan_idx = ~(time_nan_idx | event_nan_idx)

            gene_values = gene_values[non_nan_idx]
            gem_values = gem_values[non_nan_idx]
            clinical_time_values = clinical_time_values[non_nan_idx]
            clinical_event_values = clinical_event_values[non_nan_idx]

            # Generates low and high groups
            fields_of_interest = request.data.get('fieldsInterest')
            if fields_of_interest:
                low_group_genes, high_group_genes, logrank_genes = generate_survival_groups(
                    clinical_time_values,
                    clinical_event_values,
                    gene_values,
                    fields_of_interest
                )
                low_group_gem, high_group_gem, logrank_gem = generate_survival_groups(
                    clinical_time_values,
                    clinical_event_values,
                    gem_values,
                    fields_of_interest
                )

                # Rounds data
                response['gene_data'] = {
                    'low_group': low_group_genes,
                    'high_group': high_group_genes,
                    'log_rank': logrank_genes
                }
                response['gem_data'] = {
                    'low_group': low_group_gem,
                    'high_group': high_group_gem,
                    'log_rank': logrank_gem
                }
            response['event_values_distinct'] = list(set(
                clinical_event_values[~pd.isnull(clinical_event_values)].tolist()
            ))

        return Response(response)

    permission_classes = [permissions.IsAuthenticated]


@login_required
def stop_experiment_action(request):
    """Stops an experiment"""
    experiment_id = request.GET.get('experimentId')

    # Check if all the required parameters are in request
    if experiment_id is None:
        response = {
            'status': ResponseStatus(
                ResponseCode.ERROR,
                message='Invalid request params'
            )
        }
    else:
        try:
            # Gets experiment
            experiment_id = int(experiment_id)
            experiment: Experiment = Experiment.objects.get(pk=experiment_id, user=request.user)

            global_task_queue.stop_experiment(experiment)

            response = {
                'status': ResponseStatus(ResponseCode.SUCCESS)
            }
        except ValueError as ex:
            # Cast errors...
            logging.exception(ex)
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='Invalid request params type'
                )
            }
        except Experiment.DoesNotExist:
            # If the experiment does not exist, returns an error
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='The experiment does not exists'
                )
            }

    # Formats to JSON the ResponseStatus object
    return encode_json_response_status(response)
