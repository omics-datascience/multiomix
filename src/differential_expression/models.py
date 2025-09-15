from django.db import models
from django.contrib.auth import get_user_model
from institutions.models import Institution
from django.contrib.auth.models import User
from typing import List, Optional, Iterable
import pandas as pd
import numpy as np
import math

from common.constants import PATIENT_ID_COLUMN

class DifferentialExpressionSource(models.Model):
    """
    Represents a data source for differential expression experiments.
    A source could be a user file or a CGDS Dataset.
    """
    user_file = models.ForeignKey(
        'user_files.UserFile',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='differential_expression_sources'
    )
    cgds_dataset = models.ForeignKey(
        'datasets_synchronization.CGDSDataset',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='differential_expression_sources'
    )

    def get_valid_source(self):
        """
        Gets the valid source depending on which has been uploaded by the user
        @return: Valid source: a UserFile or a CGDSDataset
        """
        if self.user_file:
            return self.user_file
        elif self.cgds_dataset:
            return self.cgds_dataset
        else:
            raise ValueError("No valid source found - both user_file and cgds_dataset are None")

    def get_samples(self) -> List[str]:
        """
        Gets the samples of the source
        @return: List with the samples
        """
        return self.get_valid_source().get_column_names()

    def get_specific_row_and_columns(self, row: str, columns_idx: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Gets a specific row and columns values from the source
        @param row: Row's identifier to retrieve it
        @param columns_idx: Indices of columns to filter, if None retrieves all the columns
        @raise KeyError if the row data is empty
        @return: List of values
        """
        row_data = self.get_valid_source().get_specific_row(row)
        if row_data.size == 0:
            raise KeyError(f"Row '{row}' not found in source")

        if columns_idx is not None:
            row_data = row_data[columns_idx]
        return row_data

    def get_df(self, only_matching: bool = False) -> pd.DataFrame:
        """
        Generates a DataFrame from the source
        @param only_matching: If True only returns the molecules that are equal in both columns
        @return: A DataFrame with the data to work
        """
        return self.get_valid_source().get_df(only_matching)

    def get_df_in_chunks(self, only_matching: bool = False) -> Iterable[pd.DataFrame]:
        """
        Returns an Iterator of a DataFrame in divided in chunks from the source.
        @param only_matching: If True only returns the molecules that are equal in both columns
        @return: A DataFrame Iterator with the data to work.
        """
        return self.get_valid_source().get_df_in_chunks(only_matching)

    @property
    def number_of_rows(self) -> int:
        """Number of rows in the source"""
        return self.get_valid_source().number_of_rows

    @property
    def number_of_samples(self) -> int:
        """Number of samples in the source"""
        return self.get_valid_source().number_of_samples


class DifferentialExpressionClinicalSource(DifferentialExpressionSource):
    """
    For clinical source of differential expression experiments. 
    Needs an extra CGDSDataset field as cBioPortal has two clinical datasets:
    patients data and samples data
    """
    extra_cgds_dataset = models.ForeignKey(
        'datasets_synchronization.CGDSDataset',
        on_delete=models.CASCADE, 
        blank=True, 
        null=True,
        related_name='differential_expression_clinical_sources_extra'
    )

    def get_samples(self) -> List[str]:
        """
        Gets the samples of the clinical source
        @return: List with the samples
        """
        if self.user_file:
            # For user files, samples are in columns
            return self.user_file.get_column_names()

        # For CGDS datasets, returns a distinct concatenation of both source columns
        # IMPORTANT: samples are in rows and attributes are in columns.
        samples = self._get_cgds_datasets_joined_df().index
        return list(set(samples))

    def get_attributes(self) -> List[str]:
        """
        Gets the clinical attributes of the source without the special attributes like sample ids or patient ids
        @return: List with the attributes
        """
        if self.user_file:
            # For user files, attributes are in rows (transposed format)
            return self.user_file.get_row_names()

        # Returns a distinct concatenation of both source columns
        columns_distinct = set()
        if self.cgds_dataset:
            first_clinical_source_columns = self.cgds_dataset.get_column_names()
            columns_distinct.update(first_clinical_source_columns)
        
        if self.extra_cgds_dataset:
            second_clinical_source_columns = self.extra_cgds_dataset.get_column_names()
            columns_distinct.update(second_clinical_source_columns)
        
        # Remove special columns
        special_columns = ['SAMPLE_ID', 'PATIENT_ID']
        for column_to_remove in special_columns:
            columns_distinct.discard(column_to_remove)
        return list(columns_distinct)

    def get_specific_samples_and_attributes(
            self,
            samples: Optional[List[str]],
            clinical_attributes: List[str]
    ) -> np.ndarray:
        """
        Gets specific samples and clinical attributes values from the source as a numpy array.
        @param samples: List of samples to retrieve. If None, returns all the samples
        @param clinical_attributes: List of clinical attributes to retrieve.
        @return: Numpy array with values.
        """
        if self.user_file:
            # For user files, use the user file's method
            return self.user_file.get_specific_samples_and_attributes(samples, clinical_attributes)
        else:
            # For CGDS datasets, get the joined dataframe and filter
            df = self._get_cgds_datasets_joined_df()
            if samples is not None:
                df = df.loc[samples]
            result = df[clinical_attributes].to_numpy()
            return result if len(clinical_attributes) > 1 else result[:, 0]

    def _get_cgds_datasets_joined_df(self) -> pd.DataFrame:
        """
        Gets a joined DataFrame from both CGDS datasets (patient and sample data)
        @return: Joined DataFrame
        """
        # This would need to be implemented based on how CGDS datasets are structured
        # For now, return the main dataset
        if self.cgds_dataset:
            df1: pd.DataFrame = self.cgds_dataset.get_df(use_standard_column=False)
            df2: pd.DataFrame = self.extra_cgds_dataset.get_df(use_standard_column=False)

            # Sets the index to the patient ID column and joins both DataFrames
            df1 = df1.reset_index().set_index([PATIENT_ID_COLUMN])
            df2 = df2.reset_index().set_index([PATIENT_ID_COLUMN])

            return df1.join(df2)

    def get_df(self, only_matching: bool = False) -> pd.DataFrame:
        """
        Generates a DataFrame from the clinical source
        @return: A DataFrame with the clinical data
        """
        if self.user_file:
            return self.user_file.get_df()
        else:
            return self._get_cgds_datasets_joined_df()


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
    clinical_source = models.ForeignKey(
        'DifferentialExpressionClinicalSource', 
        on_delete=models.CASCADE, 
        null=False,
        blank=False, 
        related_name='differential_expression_experiments_as_clinical'
    )

    mrna_source = models.ForeignKey(
        'DifferentialExpressionSource', 
        on_delete=models.CASCADE, 
        null=False, 
        blank=False,
        related_name='differential_expression_experiments_as_mrna'
    )

    clinical_attribute = models.CharField(max_length=100, blank=False, null=False)

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
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, help_text='When the experiment was created')
    updated_at = models.DateTimeField(auto_now=True, help_text='When the experiment was last updated')
    
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

    def save_results(self, dataframe):
        """
        Save the differential expression DataFrame results.
        
        Args:
            dataframe: pandas DataFrame with differential expression results
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
            
        data = []
        for result in results:
            data.append({
                'gene': result.gene,
                'AveExpr': result.ave_expr,
                'P.Value': result.p_value,
                'adj.P.Val': result.adj_p_val,
                'logFC': result.log_fc,
                't': result.t_statistic,
                'B': result.b_statistic
            })
        
        df = pd.DataFrame(data)
        df.set_index('gene', inplace=True)
        return df
    
    def get_significant_genes(self, p_value_threshold=0.05, log_fc_threshold=1.0):
        """
        Get significantly differentially expressed genes.
        
        Args:
            p_value_threshold: Maximum adjusted p-value (default 0.05)
            log_fc_threshold: Minimum absolute log fold change (default 1.0)
            
        Returns:
            QuerySet: QuerySet of DifferentialExpressionExperimentResult objects meeting the criteria
        """
        from django.db.models import Q
        
        return self.results.filter(
            Q(adj_p_val__lte=p_value_threshold) &
            (Q(log_fc__gte=log_fc_threshold) | Q(log_fc__lte=-log_fc_threshold))
        )


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
    
    @property
    def is_significant(self, p_threshold=0.05, fc_threshold=1.0):
        """Check if this gene is significantly differentially expressed."""
        return (self.adj_p_val <= p_threshold and 
                abs(self.log_fc) >= fc_threshold)
