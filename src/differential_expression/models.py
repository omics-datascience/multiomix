from django.db import models
from django.contrib.auth import get_user_model
from institutions.models import Institution
from django.contrib.auth.models import User
from tissues.models import Tissue
import pandas as pd
import math
from django.db.models import Q, QuerySet

from api_service.websocket_functions import send_update_differential_expression_experiments_command
from api_service.models import ExperimentSource, ExperimentClinicalSource


class DifferentialExpressionExperimentState(models.IntegerChoices):
    """All the possible states of a Differential Expression Experiment."""
    COMPLETED = 1
    FINISHED_WITH_ERROR = 2
    IN_PROCESS = 3
    WAITING_FOR_QUEUE = 4
    NO_SAMPLES_IN_COMMON = 5
    STOPPING = 6
    STOPPED = 7
    REACHED_ATTEMPTS_LIMIT = 8
    NO_FEATURES_FOUND = 9
    EMPTY_DATASET = 10
    TIMEOUT_EXCEEDED = 11


class DifferentialExpressionTool(models.TextChoices):
    """Tool choices for differential expression analysis."""
    DESEQ = 'DESEQ'
    LIMMA = 'LIMMA'


class DifferentialExpressionExperiment(models.Model):
    """
    Model to create and manage differential expression data.
    """
    results: QuerySet['DifferentialExpressionExperimentResult']

    name = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)

    # Clinical and mRNA sources
    # These are used to link the experiment to the clinical and mRNA data sources
    clinical_source = models.ForeignKey(
        'api_service.ExperimentClinicalSource',
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name='differential_expression_experiments_as_clinical'
    )

    mrna_source = models.ForeignKey(
        'api_service.ExperimentSource',
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name='differential_expression_experiments_as_mrna'
    )

    clinical_attribute = models.CharField(max_length=100, blank=False, null=False)

    tool = models.CharField(
        max_length=10,
        choices=DifferentialExpressionTool.choices,
        default=DifferentialExpressionTool.DESEQ,
        blank=False,
        null=False,
        help_text='Tool to use for differential expression analysis'
    )

    threshold_percentile = models.FloatField(default=0.15, blank=False, null=False)

    threshold = models.FloatField(default=0.0001, blank=False, null=False)

    top = models.IntegerField(
        default=100,
        blank=False,
        null=False,
        help_text='Number of significant results to keep (max 1000)'
    )

    # Celery task related fields
    # This is used to track the execution of the task and its state
    execution_time = models.FloatField(default=0.0, blank=True, null=True, help_text='Execution time in seconds')
    task_id = models.CharField(max_length=100, blank=True, null=True, help_text='Celery Task ID')
    attempt = models.PositiveSmallIntegerField(default=0, help_text='Number of attempts to prevent a buggy experiment '
                                                                    'running forever')
    state = models.IntegerField(
        choices=DifferentialExpressionExperimentState.choices,
        default=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE,
        help_text='Current state of the differential expression experiment'
    )

    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True,
                                      help_text='When the experiment was created')
    updated_at = models.DateTimeField(auto_now=True, help_text='When the experiment was last updated')

    # User and sharing information
    # This is used to track the user who created the experiment and to share it with other users or institutions
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    is_public = models.BooleanField(blank=False, null=False, default=False)
    shared_institutions = models.ManyToManyField(Institution, related_name='shared_differential_expression', blank=True)
    shared_users = models.ManyToManyField(User, blank=True,
                                          related_name='shared_users_differential_expression')
    tissues = models.ForeignKey(Tissue, on_delete=models.SET_NULL, default=None, blank=True, null=True)

    def __str__(self):
        return f"Differential Expression Experiment: {self.name}"

    def save(self, *args, **kwargs):
        """
        Every time the experiment status changes, uses websockets to update state in the frontend.
        """
        if not self.name:
            raise ValueError("Experiment name cannot be empty.")

        super().save(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_differential_expression_experiments_command(self.user.id)

    def save_results(self, dataframe):
        """
        Save the differential expression DataFrame results.
        @param dataframe: pandas DataFrame with differential expression results.
        """
        # Clear existing results
        self.results.all().delete()

        # Create new result records
        results_to_create = []
        for gene_name, row in dataframe.iterrows():
            # Handle NaN values by replacing them with appropriate defaults
            def safe_float(value, default=0.0):
                """Convert value to float, handling NaN and inf values."""
                try:
                    if pd.isna(value) or math.isinf(float(value)):
                        return default
                    return float(value)
                except (ValueError, TypeError):
                    return default

            result = DifferentialExpressionExperimentResult(
                experiment=self,
                gene=str(gene_name),  # The gene identifier from the DataFrame index
                ave_expr=safe_float(row.get('AveExpr', 0.0), 0.0),
                p_value=safe_float(row.get('P.Value', 1.0), 1.0),
                adj_p_val=safe_float(row.get('adj.P.Val', 1.0), 1.0),
                log_fc=safe_float(row.get('logFC', 0.0), 0.0),
                t_statistic=safe_float(row.get('t', 0.0), 0.0),
                b_statistic=safe_float(row.get('B', 0.0), 0.0)
            )
            results_to_create.append(result)

        # Bulk create for efficiency
        DifferentialExpressionExperimentResult.objects.bulk_create(results_to_create)

    def get_results_dataframe(self):
        """
        Retrieve results as a pandas DataFrame.
        """
        results = self.results.all()
        if not results.exists():
            return None

        data = [{
            'gene': result.gene,
            'AveExpr': result.ave_expr,
            'P.Value': result.p_value,
            'adj.P.Val': result.adj_p_val,
            'logFC': result.log_fc,
            't': result.t_statistic,
            'B': result.b_statistic
        } for result in results]

        df = pd.DataFrame(data)
        df.set_index('gene', inplace=True)
        return df

    def get_significant_genes(self, p_value_threshold=0.05, log_fc_threshold=1.0):
        """
        Get significantly differentially expressed genes.
        @param p_value_threshold: Maximum adjusted p-value (default 0.05).
        @param log_fc_threshold: Minimum absolute log fold change (default 1.0).
        @return QuerySet of DifferentialExpressionExperimentResult objects meeting the criteria.
        """

        return self.results.filter(
            Q(adj_p_val__lte=p_value_threshold) &
            (Q(log_fc__gte=log_fc_threshold) | Q(log_fc__lte=-log_fc_threshold))
        )

    def delete(self, *args, **kwargs):
        """
        Deletes the instance and sends a websockets message to update state in the frontend
        """
        user_id = self.user.id  # Store user_id before deletion
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_differential_expression_experiments_command(user_id)


class DifferentialExpressionExperimentResult(models.Model):
    """
    Model to store individual differential expression results for each gene.
    """

    experiment = models.ForeignKey(
        'DifferentialExpressionExperiment',
        on_delete=models.CASCADE,
        related_name='results'
    )
    gene = models.CharField(max_length=100, help_text='Gene identifier')
    ave_expr = models.FloatField(help_text='Average expression level')
    p_value = models.FloatField(help_text='P-value from statistical test')
    adj_p_val = models.FloatField(help_text='Adjusted P-value (FDR corrected)')
    log_fc = models.FloatField(help_text='Log fold change')
    t_statistic = models.FloatField(help_text='t-statistic from the test')
    b_statistic = models.FloatField(help_text='B-statistic (log-odds of differential expression)')

    class Meta:
        unique_together = ('experiment', 'gene')
        indexes = [
            models.Index(fields=['experiment', 'adj_p_val']),
            models.Index(fields=['experiment', 'log_fc']),
            models.Index(fields=['gene']),
        ]

    def __str__(self):
        return f"{self.gene} - {self.experiment.name}"


