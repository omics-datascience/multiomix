from django.shortcuts import render
from django.db import transaction
from rest_framework.request import Request
from rest_framework.views import APIView
from common.utils import get_source_pk
from api_service.utils import get_experiment_source
from user_files.models_choices import FileType
from rest_framework.exceptions import ValidationError
from differential_expression.models import DifferentialExpressionExperiment
from rest_framework.response import Response
from rest_framework import generics, permissions, filters, status
from rest_framework.generics import get_object_or_404
from django.db.models import QuerySet, Q
from differential_expression.serializers import DifferentialExpressionExperimentSerializer
from django_filters.rest_framework import DjangoFilterBackend
from common.pagination import StandardResultsSetPagination
from celery.contrib.abortable import AbortableAsyncResult
from .tasks import eval_differential_expression_experiment


class DifferentialExpressionDetail(generics.RetrieveAPIView):
    """
    Endpoint to retrieve a differential expression experiment.
    """

    def get_object(self) -> DifferentialExpressionExperiment:
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

        print(experiment.clinical_source.get_attributes())

        return experiment

    serializer_class = DifferentialExpressionExperimentSerializer
    permission_classes = [permissions.IsAuthenticated]

class DifferentialExpressionList(generics.ListAPIView):
    """
    Endpoint to list all differential expression experiments.
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

    serializer_class = DifferentialExpressionExperimentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]


class DifferentialExpressionSubmit(APIView):
    """
    Endpoint to submit a differential expression experiment.
    """

    def post(self, request : Request):
        """
        Endpoint to submit a differential expression experiment.
        """
        with transaction.atomic():

            name = request.POST.get('name', 'Differential Expression Experiment')
            description = request.POST.get('description', '')

            # Clinical source
            clinical_source_type = get_source_pk(request.POST, 'clinicalType')
            clinical_source, clinical_aux = get_experiment_source(clinical_source_type, request, FileType.CLINICAL,
                                                                  'clinical')

            # Select the valid one (if it's a CGDSStudy it needs clinical_aux as it has both needed CGDSDatasets)
            clinical_source = clinical_aux if clinical_aux is not None else clinical_source

            if clinical_source is None:
                raise ValidationError('Invalid clinical source')

            # mRNA source
            mrna_source_type = get_source_pk(request.POST, 'mRNAType')
            mrna_source, _mrna_clinical = get_experiment_source(mrna_source_type, request, FileType.MRNA, 'mRNA')

            if mrna_source is None:
                raise ValidationError('Invalid mRNA source')

            # Clinical attribute
            clinical_attribute = request.POST.get('clinicalAttribute', None)
            if not clinical_attribute:
                raise ValidationError('Clinical attribute is required')

            # Threshold percentile
            try:
                threshold_percentile = float(request.POST.get('thresholdPercentile', 0.15))
            except ValueError:
                raise ValidationError('Invalid threshold percentile value')

            if threshold_percentile < 0 or threshold_percentile > 1:
                raise ValidationError('Threshold percentile must be between 0 and 1')

            # Threshold
            try:
                threshold = float(request.POST.get('threshold', 0.0001))
            except ValueError:
                raise ValidationError('Invalid threshold value')

            if threshold < 0 or threshold > 1:
                raise ValidationError('Threshold must be between 0 and 1')


            # Create the differential expression experiment
            experiment = DifferentialExpressionExperiment.objects.create(
                name=name,
                description=description,
                clinical_source=clinical_source,
                mrna_source=mrna_source,
                clinical_attribute=clinical_attribute,
                threshold_percentile=threshold_percentile,
                threshold=threshold,
                user = request.user,
            )

            # async_res: AbortableAsyncResult = eval_feature_selection_experiment.apply_async(
            # (fs_experiment.pk, fit_fun_enum, fitness_function_parameters, algorithm_parameters,
            #  cross_validation_parameters), queue='feature_selection')

            # fs_experiment.task_id = async_res.task_id
            # fs_experiment.save(update_fields=['task_id'])
            
            async_res : AbortableAsyncResult = eval_differential_expression_experiment.apply_async(
                (experiment.pk,), queue='differential_expression')
            
            experiment.task_id = async_res.task_id
            experiment.save(update_fields=['task_id'])

            return Response({'ok': True})
