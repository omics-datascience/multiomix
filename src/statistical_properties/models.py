from typing import List, Union, Tuple, Optional
from django.db import models
from api_service.websocket_functions import send_update_stat_validations_command
from biomarkers.models import Biomarker, BiomarkerState
from datasets_synchronization.models import SurvivalColumnsTupleUserFile, SurvivalColumnsTupleCGDSDataset
from feature_selection.models import TrainedModel
from user_files.models_choices import FileType, MoleculeType


# Create your models here.
class CommonStatisticalTest(models.Model):
    """
    Represents an abstract common statistical test with its statistic value and p-value
    """
    statistic = models.FloatField()
    p_value = models.FloatField()

    class Meta:
        abstract = True


class NormalityTest(CommonStatisticalTest):
    """Represents a Shapiro-Wilk test for normality"""


class GoldfeldQuandtTest(CommonStatisticalTest):
    """Represents a Goldfeld-Quandt test for homoscedasticity"""


class LinearityTest(CommonStatisticalTest):
    """Represents a Harvey Collier test for linearity"""


class MonotonicTest(CommonStatisticalTest):
    """Represents a Spearman Rank-Order Correlation test for monotonicity"""


class BreuschPaganTest(models.Model):
    """
    Represents a Breusch-Pagan test for heteroscedasticity
    """
    lagrange_multiplier = models.FloatField()
    p_value = models.FloatField()
    f_value = models.FloatField()
    f_p_value = models.FloatField()


class SourceDataStatisticalProperties(models.Model):
    """
    Stores statistical info about Experiment's source data
    """
    gene_mean = models.FloatField()
    gem_mean = models.FloatField()
    gene_standard_deviation = models.FloatField()
    gem_standard_deviation = models.FloatField()
    gene_normality = models.OneToOneField(NormalityTest, on_delete=models.CASCADE, related_name='gene_normality')
    gem_normality = models.OneToOneField(NormalityTest, on_delete=models.CASCADE, related_name='gem_normality')
    heteroscedasticity_breusch_pagan = models.OneToOneField(BreuschPaganTest, on_delete=models.CASCADE)
    homoscedasticity_goldfeld_quandt = models.OneToOneField(GoldfeldQuandtTest, on_delete=models.CASCADE)
    linearity = models.OneToOneField(LinearityTest, on_delete=models.CASCADE, blank=True, null=True)
    monotonicity = models.OneToOneField(MonotonicTest, on_delete=models.CASCADE, blank=True, null=True)
    number_of_samples_evaluated = models.PositiveIntegerField()

    @property
    def gene_outliers(self) -> List:
        """
        Gets the outliers found in gene data
        @return: List of SourceDataOutliers instances
        """
        return self.outliers.filter(is_gene_data=True)

    @property
    def gem_outliers(self) -> List:
        """
        Gets the outliers found in GEM data
        @return: List of SourceDataOutliers instances
        """
        return self.outliers.filter(is_gene_data=False)


class SourceDataOutliers(models.Model):
    """
    Represents an outlier sample in an 'api_service.ExperimentSource''s data
    """
    sample_identifier = models.CharField(max_length=100, blank=False, null=False)
    expression = models.FloatField(blank=False, null=False)
    is_gene_data = models.BooleanField(blank=False, null=False)
    stats_property = models.ForeignKey(
        SourceDataStatisticalProperties,
        related_name='outliers',
        on_delete=models.CASCADE
    )


class StatisticalValidationSourceResult(models.Model):
    """
    Represents a connection between a source and a statistical validation result. Useful to show a result for
    every type of molecule in a Biomarker.
    """
    mean_squared_error = models.FloatField(null=True, blank=True)  # MSE of the prediction
    c_index = models.FloatField(null=True, blank=True)  # C-Index from regression models (SVM/RF)

    cox_c_index = models.FloatField(null=True, blank=True)  # C-Index from Cox Regression (clustering)
    cox_log_likelihood = models.FloatField(null=True, blank=True)  # Log likelihood from Cox Regression (clustering)
    r2_score = models.FloatField(null=True, blank=True)  # R2 from regression models (SVM/RF)

    # Source
    source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                               related_name='statistical_validations_result')


class StatisticalValidation(models.Model):
    """A Biomarker statistical validation"""
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='statistical_validations')
    state = models.IntegerField(choices=BiomarkerState.choices)  # Yes, has the same states as a Biomarker
    created = models.DateTimeField(auto_now_add=True)

    # General results using all the molecules
    mean_squared_error = models.FloatField(null=True, blank=True)  # MSE of the prediction
    c_index = models.FloatField(null=True, blank=True)  # C-Index from regression models (SVM/RF)

    cox_c_index = models.FloatField(null=True, blank=True)  # C-Index from Cox Regression (clustering)
    cox_log_likelihood = models.FloatField(null=True, blank=True)  # Log likelihood from Cox Regression (clustering)
    r2_score = models.FloatField(null=True, blank=True)  # R2 from regression models (SVM/RF)

    trained_model = models.ForeignKey(TrainedModel, on_delete=models.SET_NULL, related_name='statistical_validations',
                                      null=True, blank=True)

    # Clinical source
    clinical_source = models.ForeignKey('api_service.ExperimentClinicalSource', on_delete=models.CASCADE, null=True,
                                        blank=True, related_name='statistical_validations_as_clinical')
    # Clinical source's survival tuple
    survival_column_tuple_user_file = models.ForeignKey(SurvivalColumnsTupleUserFile, on_delete=models.SET_NULL,
                                                        related_name='statistical_validations', null=True, blank=True)
    survival_column_tuple_cgds = models.ForeignKey(SurvivalColumnsTupleCGDSDataset, on_delete=models.SET_NULL,
                                                   related_name='statistical_validations', null=True, blank=True)

    # Sources
    mrna_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE, null=True,
                                              blank=True, related_name='statistical_validations_as_mrna')
    mirna_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE, null=True,
                                              blank=True, related_name='statistical_validations_as_mirna')
    cna_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE, null=True,
                                             blank=True, related_name='statistical_validations_as_cna')
    methylation_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE,
                                                     null=True, blank=True,
                                                     related_name='statistical_validations_as_methylation')

    @property
    def survival_column_tuple(self) -> Union[SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleUserFile]:
        """Gets valid SurvivalColumnTuple"""
        if self.survival_column_tuple_user_file:
            return self.survival_column_tuple_user_file

        return self.survival_column_tuple_cgds


    def get_all_sources(self) -> List[Optional['api_service.ExperimentSource']]:
        """Returns a list with all the sources."""
        res = [self.clinical_source]
        if self.mrna_source_result and self.mrna_source_result.source:
            res.append(self.mrna_source_result.source)

        if self.mirna_source_result and self.mirna_source_result.source:
            res.append(self.mirna_source_result.source)

        if self.cna_source_result and self.cna_source_result.source:
            res.append(self.cna_source_result.source)

        if self.methylation_source_result and self.methylation_source_result.source:
            res.append(self.methylation_source_result.source)

        return res

    def get_sources_and_molecules(self) -> List[Tuple[Optional['api_service.ExperimentSource'], List[str], FileType]]:
        """Returns a list with all the sources (except clinical), the selected molecules and type."""
        biomarker = self.biomarker
        res = []
        if self.mrna_source_result and self.mrna_source_result.source:
            res.append((
                self.mrna_source_result.source,
                list(biomarker.mrnas.values_list('identifier', flat=True)),
                FileType.MRNA
            ))

        if self.mirna_source_result and self.mirna_source_result.source:
            res.append((
                self.mirna_source_result.source,
                list(biomarker.mirnas.values_list('identifier', flat=True)),
                FileType.MIRNA
            ))

        if self.cna_source_result and self.cna_source_result.source:
            res.append((
                self.cna_source_result.source,
                list(biomarker.cnas.values_list('identifier', flat=True)),
                FileType.CNA
            ))

        if self.methylation_source_result and self.methylation_source_result.source:
            res.append((
                self.methylation_source_result.source,
                list(biomarker.methylations.values_list('identifier', flat=True)),
                FileType.METHYLATION
            ))

        return res

    def delete(self, *args, **kwargs):
        """Deletes the instance and sends a websockets message to update state in the frontend"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the StatisticalValidation state in the frontend
        send_update_stat_validations_command(self.biomarker.user.id)

    def save(self, *args, **kwargs):
        """Every time the biomarker status changes, uses websocket to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websocket message to update the state in the frontend
        send_update_stat_validations_command(self.biomarker.user.id)


class MoleculeWithCoefficient(models.Model):
    """Represents a molecule of a Biomarker with the coefficient taken from the CoxnetSurvivalAnalysis."""
    identifier = models.CharField(max_length=50)
    coeff = models.FloatField()
    type = models.IntegerField(choices=MoleculeType.choices)
    statistical_validation = models.ForeignKey(StatisticalValidation, on_delete=models.CASCADE,
                                               related_name='molecules_with_coefficients')


class SampleAndCluster(models.Model):
    """Represents a sample with his assigned cluster inferred by a clustering algorithm."""
    sample = models.CharField(max_length=100)
    cluster = models.IntegerField()
    statistical_validation = models.ForeignKey(StatisticalValidation, on_delete=models.CASCADE,
                                               related_name='samples_and_clusters')
