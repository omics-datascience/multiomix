from django.db import transaction
from django.db.models import Q

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from api_service.enums import SourceType
from api_service.utils import get_cgds_dataset
from common.pagination import StandardResultsSetPagination
from datasets_synchronization.models import CGDSStudy
from differential_expression.models import (
    DifferentialExpressionClinicalSource,
    DifferentialExpressionExperiment,
    DifferentialExpressionSource,
)
from differential_expression.serializers import (
    DifferentialExpressionExperimentDetailSerializer,
    DifferentialExpressionExperimentResultSerializer,
    DifferentialExpressionExperimentSerializer,
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
) -> tuple[DifferentialExpressionSource | DifferentialExpressionClinicalSource | None, DifferentialExpressionClinicalSource | None]:
    """
    Creates a Source object for differential expression experiments.
    """
    is_clinical = prefix == 'clinical'
    source = DifferentialExpressionClinicalSource() if is_clinical else DifferentialExpressionSource()
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

        return experiment

    serializer_class = DifferentialExpressionExperimentDetailSerializer
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

    def post(self, request: Request):
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
    Endpoint to get all results for a differential expression experiment.
    """
    serializer_class = DifferentialExpressionExperimentResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
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
        
        return experiment.results.all()


class DifferentialExpressionSignificantGenes(generics.ListAPIView):
    """
    Endpoint to get significant genes for a differential expression experiment.
    """
    serializer_class = DifferentialExpressionExperimentResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['adj_p_val', 'log_fc', 'p_value', 'ave_expr']
    ordering = ['adj_p_val']  # Default ordering by adjusted p-value
    
    def get_queryset(self):
        experiment_id = self.kwargs.get('pk')
        experiment = get_object_or_404(DifferentialExpressionExperiment, pk=experiment_id)
        
        # Check permissions (same logic as DifferentialExpressionDetail)
        user = self.request.user
        if not (experiment.is_public or
                experiment.user == user or
                experiment.shared_institutions.filter(institutionadministration__user=user).exists() or
                experiment.shared_users.filter(id=user.id).exists()):
            raise ValidationError('You do not have permission to access this experiment.')
        
        # Get query parameters for filtering
        try:
            p_threshold = float(self.request.query_params.get('p_threshold', 0.05))
            fc_threshold = float(self.request.query_params.get('fc_threshold', 2.0))
        except ValueError as exc:
            raise ValidationError('Invalid threshold values. Must be numeric.') from exc
        
        # Validate thresholds
        if p_threshold < 0 or p_threshold > 1:
            raise ValidationError('p_threshold must be between 0 and 1')
        if fc_threshold < 0:
            raise ValidationError('fc_threshold must be positive')
        
        return experiment.get_significant_genes(p_threshold, fc_threshold)
