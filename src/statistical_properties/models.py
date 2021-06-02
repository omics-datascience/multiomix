from typing import List
from django.db import models


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
    Represents an outlier sample in an ExperimentSource's data
    """
    sample_identifier = models.CharField(max_length=100, blank=False, null=False)
    expression = models.FloatField(blank=False, null=False)
    is_gene_data = models.BooleanField(blank=False, null=False)
    stats_property = models.ForeignKey(
        SourceDataStatisticalProperties,
        related_name='outliers',
        on_delete=models.CASCADE
    )
