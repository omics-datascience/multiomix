from django.db import models
from django.contrib.auth import get_user_model
from institutions.models import Institution
from django.contrib.auth.models import User


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

class DifferentialExpressionExperiment(models.Model):
    """
    Model to create and manage differential expression data.
    """

    name = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)

    # Clinical and mRNA sources
    # These are used to link the experiment to the clinical and mRNA data sources
    clinical_source = models.ForeignKey('api_service.ExperimentClinicalSource', on_delete=models.CASCADE, null=False,
                                        blank=False, related_name='differential_expression_as_clinical')

    mrna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=False, blank=False,
                                    related_name='differential_expression_as_mrna')

    clinical_attribute = models.CharField(max_length=100, blank=False, null=False)

    threshold_percentile = models.FloatField(default=0.15, blank=False, null=False)

    threshold = models.FloatField(default=0.0001, blank=False, null=False)

    # Celery task related fields
    # This is used to track the execution of the task and its state
    execution_time = models.FloatField(default=0.0, blank=True, null=True, help_text='Execution time in seconds')
    task_id = models.CharField(max_length=100, blank=True, null=True, help_text='Celery Task ID')
    attempt = models.PositiveSmallIntegerField(default=0, help_text='Number of attempts to prevent a buggy experiment '
                                                                    'running forever')
    state : int = models.IntegerField(
        choices=DifferentialExpressionExperimentState.choices,
        default=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE,
        help_text='Current state of the differential expression experiment'
    )
    
    # User and sharing information
    # This is used to track the user who created the experiment and to share it with other users or institutions
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    is_public = models.BooleanField(blank=False, null=False, default=False)
    shared_institutions = models.ManyToManyField(Institution, related_name='shared_differential_expression', blank=True)
    shared_users = models.ManyToManyField(User, blank=True,
                                          related_name='shared_users_differential_expression')

    def __str__(self):
        return f"Differential Expression Experiment: {self.name}"

    def save(self, *args, **kwargs):
        """
        Override the save method to ensure that the name is unique.
        """
        if not self.name:
            raise ValueError("Experiment name cannot be empty.")

        # # Ensure the name is unique
        # if DifferentialExpressionExperiment.objects.filter(name=self.name).exists():
        #     raise ValueError(f"An experiment with the name '{self.name}' already exists.")

        super().save(*args, **kwargs)


    # Results storage
    # Store the complete differential expression results as JSON
    # This is more efficient than individual records for large datasets
    results_json = models.JSONField(blank=True, null=True, help_text='Complete differential expression results as JSON')
    
    def save_results(self, dataframe):
        """
        Save the differential expression DataFrame results as JSON.
        
        Args:
            dataframe: pandas DataFrame with differential expression results
        """
        # Convert DataFrame to JSON format (records orientation)
        self.results_json = dataframe.to_dict('records')
        self.save(update_fields=['results_json'])
    
    def get_results_dataframe(self):
        """
        Retrieve results as a pandas DataFrame.
        
        Returns:
            pandas.DataFrame: DataFrame with differential expression results
        """
        if not self.results_json:
            return None
            
        import pandas as pd
        return pd.DataFrame(self.results_json)
    
    def get_significant_genes(self, p_value_threshold=0.05, log_fc_threshold=1.0):
        """
        Get significantly differentially expressed genes.
        
        Args:
            p_value_threshold: Maximum adjusted p-value (default 0.05)
            log_fc_threshold: Minimum absolute log fold change (default 1.0)
            
        Returns:
            list: List of gene records meeting the criteria
        """
        if not self.results_json:
            return []
            
        significant_genes = []
        for gene in self.results_json:
            adj_p_val = gene.get('adj.P.Val', gene.get('adjusted_p_value', 1.0))
            log_fc = abs(gene.get('logFC', gene.get('log_fold_change', 0.0)))
            
            if adj_p_val <= p_value_threshold and log_fc >= log_fc_threshold:
                significant_genes.append(gene)
                
        return significant_genes
        