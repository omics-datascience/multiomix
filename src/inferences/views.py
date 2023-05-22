from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, generics, filters
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from api_service.utils import get_experiment_source
from biomarkers.models import Biomarker, BiomarkerState
from common.pagination import StandardResultsSetPagination
from common.utils import get_source_pk
from feature_selection.models import TrainedModel
from inferences.inference_service import global_inference_service
from inferences.models import InferenceExperiment
from inferences.serializers import InferenceExperimentSerializer, SampleAndClusterPredictionSerializer
from user_files.models_choices import FileType


class BiomarkerStatisticalInferenceExperiments(generics.ListAPIView):
    """Get all the inference experiments for a specific Biomarker."""

    def get_queryset(self):
        biomarker_pk = self.request.GET.get('biomarker_pk')
        user = self.request.user
        biomarker = get_object_or_404(Biomarker, pk=biomarker_pk, user=user)
        return biomarker.inference_experiments.all()

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InferenceExperimentSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    ordering_fields = ['name', 'description', 'state', 'created']
    search_fields = ['name', 'description']
    filterset_fields = ['state']


class PredictionExperimentSubmit(APIView):
    """Endpoint to submit a InferenceExperiment."""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request: Request):
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
                state=BiomarkerState.IN_PROCESS,
                trained_model=trained_model,
                mrna_source=mrna_source,
                mirna_source=mirna_source,
                cna_source=cna_source,
                methylation_source=methylation_source,
            )

            # Adds Feature Selection experiment to the ThreadPool
            global_inference_service.add_inference_experiment(inference_experiment)

        return Response({'ok': True})


class SampleAndClusterPredictionSamples(generics.ListAPIView):
    """Gets all the pairs of samples and cluster for a specific inference experiment."""

    def get_queryset(self):
        inference_experiment_pk = self.request.GET.get('inference_experiment_pk')
        experiment = get_object_or_404(InferenceExperiment, pk=inference_experiment_pk, biomarker__user=self.request.user)
        return experiment.samples_and_clusters.all()

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SampleAndClusterPredictionSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['cluster']
    search_fields = ['sample']
    ordering_fields = ['sample', 'cluster']
