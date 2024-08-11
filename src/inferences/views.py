import csv
import logging
from collections import OrderedDict
from typing import List
import pandas as pd
from celery.contrib.abortable import AbortableAsyncResult
from django.db import transaction
from django.db.models import QuerySet, Exists, OuterRef, Q, F
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, generics, filters
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.enums import SourceType
from api_service.serializers import ExperimentClinicalSourceSerializer
from api_service.utils import get_experiment_source
from biomarkers.models import Biomarker, BiomarkerState
from common.enums import ResponseCode
from common.functions import create_survival_columns_from_json
from common.pagination import StandardResultsSetPagination
from common.response import ResponseStatus
from common.utils import get_source_pk
from feature_selection.models import TrainedModel, ClusterLabel, PredictionRangeLabel
from inferences.models import InferenceExperiment, SampleAndClusterPrediction, SampleAndTimePrediction
from inferences.serializers import InferenceExperimentSerializer, SampleAndClusterPredictionSerializer, \
    SampleAndTimePredictionSerializer, generate_prediction_condition
from user_files.models_choices import FileType
from .tasks import eval_inference_experiment


def get_inference_experiments_of_biomarker(request: HttpRequest) -> QuerySet[InferenceExperiment]:
    """Gets all the inference experiments for a specific Biomarker getting data from current request."""
    biomarker_pk = request.GET.get('biomarker_pk')
    user = request.user
    biomarker = get_object_or_404(Biomarker, pk=biomarker_pk, user=user)
    return biomarker.inference_experiments.all()


def get_inference_experiment(request: HttpRequest) -> InferenceExperiment:
    """Gets a specific InferenceExperiment instance for a specific Biomarker getting data from current request."""
    inference_experiment_pk = request.GET.get('inference_experiment_pk')
    experiment = get_object_or_404(InferenceExperiment, pk=inference_experiment_pk, biomarker__user=request.user)
    return experiment


class BiomarkerStatisticalInferenceExperiments(generics.ListAPIView):
    """Get all the inference experiments for a specific Biomarker."""

    def get_queryset(self):
        return get_inference_experiments_of_biomarker(self.request)

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InferenceExperimentSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    ordering_fields = ['name', 'description', 'state', 'created']
    search_fields = ['name', 'description']
    filterset_fields = ['state']


class BiomarkerStatisticalInferenceExperimentsDetails(generics.RetrieveAPIView):
    """Get specific InferenceExperiment instance for a specific Biomarker."""

    def get_queryset(self):
        return get_inference_experiments_of_biomarker(self.request)

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InferenceExperimentSerializer


class InferenceExperimentClinicalAttributes(APIView):
    """
    Gets all the clinical attributes from a clinical source of a specific StatisticalValidation instance.
    Sorted by name ASC.
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: HttpRequest):
        experiment = get_inference_experiment(request)
        if experiment.clinical_source:
            clinical_attrs = experiment.clinical_source.get_attributes()
        else:
            clinical_attrs = []
        return Response(sorted(clinical_attrs))


class PredictionExperimentSubmit(APIView):
    """Endpoint to submit a InferenceExperiment."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request: HttpRequest):
        with transaction.atomic():
            # Gets Biomarker and TrainedModel instance
            biomarker_pk = request.POST.get('biomarkerPk')
            trained_model_pk = request.POST.get('trainedModelPk')

            trained_model: TrainedModel = get_object_or_404(TrainedModel, pk=trained_model_pk,
                                                            biomarker__pk=biomarker_pk, biomarker__user=request.user)

            biomarker: Biomarker = trained_model.biomarker

            # mRNA source
            mrna_source_type = get_source_pk(request.POST, 'mRNAType')
            mrna_source, _mrna_clinical = get_experiment_source(mrna_source_type, request, FileType.MRNA, 'mRNA')
            if biomarker.number_of_mrnas > 0 and mrna_source is None:
                raise ValidationError('Invalid mRNA source')

            # miRNA source
            mirna_source_type = get_source_pk(request.POST, 'miRNAType')
            mirna_source, _mirna_clinical = get_experiment_source(mirna_source_type, request, FileType.MIRNA, 'miRNA')
            if biomarker.number_of_mirnas > 0 and mirna_source is None:
                raise ValidationError('Invalid miRNA source')

            # CNA source
            cna_source_type = get_source_pk(request.POST, 'cnaType')
            cna_source, _cna_clinical = get_experiment_source(cna_source_type, request, FileType.CNA, 'cna')
            if biomarker.number_of_cnas > 0 and cna_source is None:
                raise ValidationError('Invalid CNA source')

            # Methylation source
            methylation_source_type = get_source_pk(request.POST, 'methylationType')
            methylation_source, _methylation_clinical = get_experiment_source(methylation_source_type, request,
                                                                              FileType.METHYLATION, 'methylation')
            if biomarker.number_of_methylations > 0 and methylation_source is None:
                raise ValidationError('Invalid Methylation source')

            # Creates the InferenceExperiment instance
            description = request.POST.get('description', 'null')
            description = description if description != 'null' else None

            inference_experiment = InferenceExperiment.objects.create(
                name=request.POST.get('name'),
                description=description,
                biomarker=biomarker,
                state=BiomarkerState.WAITING_FOR_QUEUE,
                trained_model=trained_model,
                mrna_source=mrna_source,
                mirna_source=mirna_source,
                cna_source=cna_source,
                methylation_source=methylation_source,
            )

        # Adds the experiment to the TaskQueue and gets Task id
        async_res: AbortableAsyncResult = eval_inference_experiment.apply_async((inference_experiment.pk,),
                                                                                queue='inference')

        inference_experiment.task_id = async_res.task_id
        inference_experiment.save(update_fields=['task_id'])

        return Response({'ok': True})


class StopInferenceExperiment(APIView):
    """Stops a InferenceExperiment."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: Request):
        inference_experiment_id = request.GET.get('inferenceExperimentId')

        # Check if all the required parameters are in request
        if inference_experiment_id is None:
            response = {
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message='Invalid request params'
                )
            }
        else:
            try:
                # Gets Biomarker and FSExperiment
                experiment: InferenceExperiment = InferenceExperiment.objects.get(pk=inference_experiment_id,
                                                                                  biomarker__user=request.user)

                logging.warning(f'Aborting InferenceExperiment {inference_experiment_id}')

                # Sends the signal to abort it
                if experiment.task_id:
                    abortable_async_result = AbortableAsyncResult(experiment.task_id)
                    abortable_async_result.abort()

                # Updates experiment state
                experiment.state = BiomarkerState.STOPPED
                experiment.save(update_fields=['state'])

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
            except InferenceExperiment.DoesNotExist:
                # If the experiment does not exist, returns an error
                response = {
                    'status': ResponseStatus(
                        ResponseCode.ERROR,
                        message='The InferenceExperiment does not exists'
                    ).to_json()
                }

        # Formats to JSON the ResponseStatus object
        return Response(response)


class InferenceExperimentDestroy(generics.DestroyAPIView):
    """REST endpoint: delete for InferenceExperiment model."""

    def get_queryset(self):
        return InferenceExperiment.objects.filter(biomarker__user=self.request.user)

    serializer_class = InferenceExperiment
    permission_classes = [permissions.IsAuthenticated]


class SampleAndClusterPredictionSamples(generics.ListAPIView):
    """Gets all the pairs of samples and cluster for a specific inference experiment (that used a clustering model)."""

    @staticmethod
    def __filter_by_cluster(samples_and_clusters: QuerySet[SampleAndClusterPrediction], request: HttpRequest):
        """
        Filters the QuerySet by a cluster. If it's numeric, then it will filter by the cluster number, otherwise
        it will filter by the associated cluster label
        """
        cluster: str = request.GET.get('cluster')

        if cluster is None:
            return samples_and_clusters
        if cluster.isnumeric():
            return samples_and_clusters.filter(cluster=cluster)

        # Returns the samples and clusters for which exists at least one ClusterLabelsSet with the given cluster's label
        cluster_labels_set_pk = request.GET.get('cluster_labels_set_pk')
        return samples_and_clusters.filter(
            Exists(ClusterLabel.objects.filter(cluster_label_set__pk=cluster_labels_set_pk,
                                               cluster_id=OuterRef('cluster'),
                                               label=cluster))
        )

    def get_queryset(self):
        experiment = get_inference_experiment(self.request)
        samples_and_clusters = experiment.samples_and_clusters.all()
        return self.__filter_by_cluster(samples_and_clusters, self.request)

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SampleAndClusterPredictionSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['sample']
    ordering_fields = ['sample', 'cluster']


class SampleAndClusterPredictionSamplesDownload(APIView):
    """
    Gets all the pairs of samples and cluster for a specific inference experiment (that used a clustering model).
    But downloads them as a CSV file.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request):
        experiment = get_inference_experiment(self.request)
        samples_and_clusters_queryset = experiment.samples_and_clusters.all()

        # Adds (if needed) the selected cluster label
        samples_and_clusters: List[OrderedDict] = SampleAndClusterPredictionSerializer(many=True, context={
            'request': request
        }).to_representation(samples_and_clusters_queryset)

        # Gets a clean name of the experiment
        experiment_name = experiment.name.replace(' ', '_')

        # Generates a downloading response in the CSV format
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{experiment_name}-samples_and_clusters.csv"'
        writer = csv.writer(response)
        writer.writerow(['Sample', 'Cluster'])
        for sample_and_cluster in samples_and_clusters:
            writer.writerow([sample_and_cluster['sample'], sample_and_cluster['cluster']])

        return response


class ClustersUniqueInferenceExperiment(APIView):
    """Gets all the pairs of samples and cluster for a specific inference experiment (that used a clustering model)."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request: Request, pk: int):
        experiment = get_object_or_404(InferenceExperiment, pk=pk, biomarker__user=request.user)
        samples_and_clusters = experiment.samples_and_clusters.values(text=F('cluster'), value=F('cluster')).distinct()
        return Response(samples_and_clusters)


class SampleAndTimePredictionSamples(generics.ListAPIView):
    """
    Gets all the pairs of samples and predicted time for a specific inference experiment (that used a regression model
    like SVM or RF).
    """

    @staticmethod
    def __filter_by_range(samples_and_times: QuerySet[SampleAndTimePrediction], request: HttpRequest):
        """Filters the QuerySet by a prediction range."""
        prediction_label: str = request.GET.get('prediction')

        if prediction_label is None:
            return samples_and_times

        # Returns the samples and predictions for which exists at least one PredictionRangeLabel with the given range's
        # label
        prediction_range_labels_set_pk = request.GET.get('prediction_range_labels_set_pk')

        return samples_and_times.filter(
            Exists(
                PredictionRangeLabel.objects.filter(
                    Q(prediction_range_labels_set__pk=prediction_range_labels_set_pk) &
                    Q(label=prediction_label) &
                    generate_prediction_condition(OuterRef('prediction'))
                )
            )
        )

    def get_queryset(self):
        inference_experiment_pk = self.request.GET.get('inference_experiment_pk')
        experiment = get_object_or_404(InferenceExperiment, pk=inference_experiment_pk,
                                       biomarker__user=self.request.user)
        samples_and_clusters = experiment.samples_and_time.all()
        return self.__filter_by_range(samples_and_clusters, self.request)

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SampleAndTimePredictionSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['sample']
    ordering_fields = ['sample', 'prediction']


class AddEditClinicalSourceInferenceExperiment(APIView):
    """Adds an InferenceExperiment's clinical source"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        # Gets experiment
        experiment_id = request.POST.get('experimentPk')
        experiment = get_object_or_404(InferenceExperiment, pk=experiment_id, biomarker__user=request.user)

        with transaction.atomic():
            # Creates and assign ExperimentClinicalSource instance to experiment
            clinical_source_type = int(request.POST.get('clinicalType'))
            clinical_source, clinical_aux = get_experiment_source(clinical_source_type, request, FileType.CLINICAL,
                                                                  'clinical')

            # Select the valid one (if it's a CGDSStudy it needs clinical_aux as it has both needed CGDSDatasets)
            clinical_source = clinical_aux if clinical_aux is not None else clinical_source

            # Creates Survival Tuples for clinical source (only if it's a new dataset)
            if clinical_source_type == SourceType.NEW_DATASET.value:
                survival_columns_str = request.POST.get('survival_columns', '[]')
                create_survival_columns_from_json(survival_columns_str, clinical_source.user_file)

            # Assigns to experiment and saves
            experiment.clinical_source = clinical_source
            experiment.save()

        # Serializes ExperimentClinicalSource instance and returns it
        data = ExperimentClinicalSourceSerializer().to_representation(clinical_source)
        return Response(data)


class InferenceExperimentChartDataByAttribute(APIView):
    """Gets samples and times grouped by a clinical attribute."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: HttpRequest):
        experiment = get_inference_experiment(request)
        clinical_attribute: str = request.GET.get('clinical_attribute', '')

        if len(clinical_attribute.strip()) == 0:
            raise ValidationError('Invalid clinical attribute')

        # Gets clinical with only the needed columns (survival event/time and grouping attribute)
        try:
            clinical_df = experiment.clinical_source.get_specific_samples_and_attributes_df(
                samples=None,
                clinical_attributes=[clinical_attribute]
            )
        except KeyError:
            raise ValidationError('Invalid clinical attribute')

        # Drops rows with missing values
        clinical_df = clinical_df.dropna()

        # Joins with samples and times
        samples_and_times = experiment.samples_and_time.all()
        samples_and_times_df = pd.DataFrame(samples_and_times.values('sample', 'prediction'))
        samples_and_times_df = samples_and_times_df.rename(columns={'sample': 'sample_id', 'prediction': 'time'})
        samples_and_times_df = samples_and_times_df.set_index('sample_id')
        clinical_df = clinical_df.join(samples_and_times_df, how='inner')

        # Groups by the clinical attribute generating a list of dicts with the group and the 'time' column. The 'time'
        # column must be a list with the minimum value, the Q1 value, the median, the Q3 value, and the maximum value
        # TODO: change the structure as this one was used by ApexCharts which was discarded.
        response = []
        for group, group_df in clinical_df.groupby(clinical_attribute):
            # group_df = group_df['time']
            # group_dict = {'group': group}
            # print(group_df)  # TODO: remove
            # print(group_dict)  # TODO: remove
            # group_dict.update(group_df.describe().to_dict())
            response.append({
                'x': group,
                'y': group_df['time'].values
                # 'y': [group_dict['min'], group_dict['25%'], group_dict['50%'], group_dict['75%'], group_dict['max']],
                # 'mean': round(group_dict['mean'], 4)
            })

        return Response(response)


class UnlinkClinicalSourceInferenceExperiment(APIView):
    """Unlink an InferenceExperiment's clinical source"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def patch(request, pk: int):
        # Gets experiment
        experiment = get_object_or_404(InferenceExperiment, pk=pk, biomarker__user=request.user)
        if experiment.clinical_source.user_file is None:
            # If this block is reached it means that is trying to unlink a CGDS experiment which should
            # not be possible
            return HttpResponse('Unauthorized', status=401)
        experiment.clinical_source = None
        experiment.save()

        return Response({'status': ResponseStatus(ResponseCode.SUCCESS).to_json()})
