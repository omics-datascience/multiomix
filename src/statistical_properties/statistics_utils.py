from typing import Tuple, Optional, List, Any
import numpy as np
from scipy.stats import shapiro
import statsmodels.stats.api as sms
import statsmodels.api as sm
from statsmodels.regression.linear_model import RegressionResults
from statsmodels.stats.diagnostic import linear_harvey_collier
from scipy.stats import spearmanr
from statistical_properties.models import NormalityTest, GoldfeldQuandtTest, LinearityTest, MonotonicTest, \
    BreuschPaganTest, SourceDataStatisticalProperties, SourceDataOutliers

COMMON_DECIMAL_PLACES = 3
P_VALUES_DECIMAL_PLACES = 4


def compute_mean(data: np.ndarray) -> float:
    """
    Computes the mean
    @param data: Data to analyze
    @return: Mean rounded to 3 decimals
    """
    return np.round(data.mean(), COMMON_DECIMAL_PLACES)


def compute_standard_deviation(data: np.ndarray) -> float:
    """
    Computes the standard deviation
    @param data: Data to analyze
    @return: Standard deviation rounded to 3 decimals
    """
    return np.round(data.std(ddof=1), COMMON_DECIMAL_PLACES)


def compute_normality_test(data: np.ndarray) -> NormalityTest:
    """
    Generates a NormalityTest object with a Shapiro-Wilk test for normality.
    @note The NormalityTest object is saved in DB before be returned
    @param data: Data to analyze
    @return: NormalityTest object already saved in DB
    """
    (statistic, p_value) = shapiro(data)
    return NormalityTest.objects.create(
        statistic=round(statistic, COMMON_DECIMAL_PLACES),
        p_value=round(p_value, P_VALUES_DECIMAL_PLACES)
    )


def mad_based_outliers(points: np.ndarray, thresh: Optional[float] = 3.5):
    """
    Computes the outliers using Median Absolute Deviation
    @param points: Points to consider
    @param thresh: Threshold to consider outlier
    @return: Outliers bool array where True is considered an outlier
    """
    if len(points.shape) == 1:
        points = points[:, None]
    median = np.median(points, axis=0)
    diff = np.sum((points - median) ** 2, axis=-1)
    diff = np.sqrt(diff)
    med_abs_deviation = np.median(diff)

    modified_z_score = 0.6745 * diff / med_abs_deviation
    return modified_z_score > thresh


def compute_heteroscedasticity_and_homoscedasticity_test(
    fitted_model: RegressionResults,
    residuals
) -> Tuple[BreuschPaganTest, GoldfeldQuandtTest]:
    """
    Function for testing heteroscedasticity and homoscedasticity of residuals in a linear regression model.
    It plots residuals and standardized residuals vs. fitted values and runs Breusch-Pagan and Goldfeld-Quandt tests.
    @note Both models object are saved in DB before be returned
    @param fitted_model: Fitted linear regression model to get some needed data
    @param residuals: Residuals to compute the homoscedasticity test
    @return: Breusch-Pagan and Goldfeld-Quandt models objects
    """
    # Computes Breusch-Pagan
    (lagrange_multiplier, p_value, f_value, f_p_value) = sms.het_breuschpagan(residuals, fitted_model.model.exog)
    breusch_pagan_test = BreuschPaganTest.objects.create(
        lagrange_multiplier=round(lagrange_multiplier, COMMON_DECIMAL_PLACES),
        p_value=round(p_value, P_VALUES_DECIMAL_PLACES),
        f_value=round(f_value, COMMON_DECIMAL_PLACES),
        f_p_value=round(f_p_value, P_VALUES_DECIMAL_PLACES)
    )

    # Computes Goldfeld-Quandt
    (statistic, p_value) = sms.het_goldfeldquandt(residuals, fitted_model.model.exog)[:-1]
    goldfeld_quandt_test = GoldfeldQuandtTest.objects.create(
        statistic=round(statistic, COMMON_DECIMAL_PLACES),
        p_value=round(p_value, P_VALUES_DECIMAL_PLACES)
    )

    return breusch_pagan_test, goldfeld_quandt_test


def compute_linear_regression(gene_data: np.ndarray, gem_data: np.ndarray) -> Tuple[RegressionResults, Any]:
    """
    Computes a linear regression using the Ordinary Least Squares
    @param gene_data: Gene expression data
    @param gem_data: GEM expression data
    @return: The fitted model and the residuals
    """
    # We need to add a column of ones to serve as intercept
    gene_data_with_constant = sm.add_constant(gene_data)
    fitted_model: RegressionResults = sm.OLS(gem_data, gene_data_with_constant).fit()
    residuals = fitted_model.resid
    return fitted_model, residuals


def compute_monotonicity(gene_data: np.ndarray, gem_data: np.ndarray) -> MonotonicTest:
    """
    Computes Spearman Rank-Order Correlation test for monotonicity
    @note The MonotonicTest object is saved in DB before be returned
    @param gene_data: Gene expression data
    @param gem_data: GEM expression data
    @return: MonotonicTest object already saved in DB
    """
    # We need to add a column of ones to serve as intercept
    statistic, p_value = spearmanr(gene_data, gem_data)
    return MonotonicTest.objects.create(
        statistic=round(statistic, COMMON_DECIMAL_PLACES),
        p_value=round(p_value, P_VALUES_DECIMAL_PLACES)
    )


def compute_linearity(fitted_model: RegressionResults) -> LinearityTest:
    """
    Computes the Harvey Collier test for linearity
    @param fitted_model: Linear regression fitted model
    @return: LinearityTest object already saved in DB
    """
    statistic, p_value = linear_harvey_collier(fitted_model)

    return LinearityTest.objects.create(
        statistic=round(statistic, COMMON_DECIMAL_PLACES),
        p_value=round(p_value, P_VALUES_DECIMAL_PLACES)
    )


def compute_and_save_outliers(
    data: np.ndarray,
    samples_identifiers: np.ndarray,
    is_gene_data: bool,
    source_stats_props: SourceDataStatisticalProperties
):
    """
    Compute the Median Absolute Deviation to detect outliers and saves them in the DB
    @param data: Data expression list
    @param samples_identifiers: Samples identifier list
    @param is_gene_data: To distinguish between gene or GEM data outliers
    @param source_stats_props: SourceDataStatisticalProperties instance to save foreign relationship
    @note All the outlier instances are saved in the DB
    """
    outliers_idx = mad_based_outliers(data)

    # Keeps outliers only
    data = data[outliers_idx]
    samples_identifiers = samples_identifiers[outliers_idx]

    objects_to_save: List[SourceDataOutliers] = []
    for outlier_name, outlier_expression in zip(samples_identifiers, data):
        objects_to_save.append(
            SourceDataOutliers(
                sample_identifier=outlier_name,
                expression=outlier_expression,
                is_gene_data=is_gene_data,
                stats_property=source_stats_props
            )
        )

    SourceDataOutliers.objects.bulk_create(objects_to_save)


def compute_source_statistical_properties(
    gene_data: np.ndarray,
    gem_data: np.ndarray,
    gene_samples: np.ndarray,
    gem_samples: np.ndarray
) -> SourceDataStatisticalProperties:
    """
    Computes all the statistical properties of a GenexGEM combination's source data
    @note The SourceDataStatisticalProperties object is saved in DB before be returned
    @param gene_data: Genes data to compute the corresponding statistical properties
    @param gem_data: GEMs data to compute the corresponding statistical properties
    @param gene_samples: Genes samples to compute outliers
    @param gem_samples: GEMs samples to compute outliers
    @return: SourceDataStatisticalProperties object
    """
    # Generates the statistical props
    source_stats_props = SourceDataStatisticalProperties()

    # Mean
    source_stats_props.gene_mean = compute_mean(gene_data)
    source_stats_props.gem_mean = compute_mean(gem_data)

    # Standard deviation
    source_stats_props.gene_standard_deviation = compute_standard_deviation(gene_data)
    source_stats_props.gem_standard_deviation = compute_standard_deviation(gem_data)

    # Normality test
    gene_normality_test = compute_normality_test(gene_data)
    gem_normality_test = compute_normality_test(gem_data)

    # Assign to the Statistical properties object
    source_stats_props.gene_normality = gene_normality_test
    source_stats_props.gem_normality = gem_normality_test

    fitted_model, residuals = compute_linear_regression(gene_data, gem_data)

    # Computes heteroscedasticity and homoscedasticity
    breusch_pagan_test, goldfeld_quandt_test = compute_heteroscedasticity_and_homoscedasticity_test(
        fitted_model,
        residuals
    )
    source_stats_props.heteroscedasticity_breusch_pagan = breusch_pagan_test
    source_stats_props.homoscedasticity_goldfeld_quandt = goldfeld_quandt_test

    # Computes linearity. TODO: add tests
    source_stats_props.linearity = compute_linearity(fitted_model)

    # Computes monotonicity. TODO: add tests
    source_stats_props.monotonicity = compute_monotonicity(gene_data, gem_data, )

    # Number of evaluated samples
    source_stats_props.number_of_samples_evaluated = gene_data.size  # Note that gene_data.size == gem_data.size

    # Saves in DB to compute the outliers
    source_stats_props.save()

    # Computes outliers. TODO: add tests
    compute_and_save_outliers(gene_data, gene_samples, True, source_stats_props)
    compute_and_save_outliers(gem_data, gem_samples, False, source_stats_props)

    return source_stats_props
