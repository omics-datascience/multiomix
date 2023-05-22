from typing import Tuple, Literal, List, Dict, cast, Union
import numpy as np
import pandas as pd
from lifelines import KaplanMeierFitter, CoxPHFitter
from lifelines.statistics import logrank_test
from common.utils import get_subset_of_features
from feature_selection.fs_models import ClusteringModels

KaplanMeierSample = Tuple[
    int,
    Literal[0, 1]  # 1 = interest, 0 = censored
]

# Result of time and probability from the survival function
KaplanMeierSampleResult = List[Dict[str, Tuple[int, float]]]

# A label (to know the group) or a KaplanMeierSampleResult
LabelOrKaplanMeierResult = Union[str, KaplanMeierSampleResult]


def struct_array_to_kaplan_meier_samples(array: np.ndarray) -> List[KaplanMeierSample]:
    """
    Generates a list of KaplanMeierSamples (i.e. data ready to set as parameter of get_group_survival_function()).
    NOTE: the array must have the 'event' column as the first one, and the 'time' column as the second one.
    @param array: Array to parse.
    @return: List of KaplanMeierSample
    """
    def f(x) -> KaplanMeierSample:
        return cast(KaplanMeierSample, (x[1], 1 if x[0] else 0))

    return list(map(f, array))


def get_group_survival_function(data: List[KaplanMeierSample]) -> List[Dict]:
    """
    Gets list of times and events and gets the survival function using KaplanMeierFitter.
    @param data: List of times and events
    @return: List of dicts with two fields: "time" and "probability" which are consumed in this way in frontend
    """
    kmf = KaplanMeierFitter()
    kmf.fit(
        durations=list(map(lambda x: x[0], data)),
        event_observed=list(map(lambda x: x[1], data)),
        label='probability'
    )

    survival_function = kmf.survival_function_.reset_index()
    survival_function = survival_function.rename(columns={'timeline': 'time'})
    survival_function = survival_function.sort_values(by='time')

    return survival_function.to_dict(orient='records')


def generate_survival_groups_by_median_expression(
    clinical_time_values: np.ndarray,
    clinical_event_values: np.ndarray,
    expression_values: np.ndarray,
    fields_interest: List[str]
) -> Tuple[List[Dict], List[Dict], Dict[str, float]]:
    """
    Generates low and high groups from expression data, time and event.
    @param clinical_time_values: Time values.
    @param clinical_event_values: Event values.
    @param expression_values: Expression values.
    @param fields_interest: Field of interest, every value which is not in this list is considered censored.
    @return: Low group, high group and Log-Rank test.
    """
    median_value = np.median(expression_values)

    low_group: List[KaplanMeierSample] = []
    high_group: List[KaplanMeierSample] = []

    # Divides the data into two groups, those whose expression is below the mean,
    # and those whose expression is above the mean.
    for (time, event, expression) in zip(clinical_time_values, clinical_event_values, expression_values):
        event_valid_value = 1 if event in fields_interest else 0  # 1 = interest, 0 = censored
        new_value = cast(KaplanMeierSample, [time, event_valid_value])
        if expression < median_value:
            low_group.append(new_value)
        else:
            high_group.append(new_value)

    # Generates Log-Rank test from time values
    log_rank_res = logrank_test(
        durations_A=list(map(lambda x: x[0], low_group)),
        durations_B=list(map(lambda x: x[0], high_group)),
        event_observed_A=list(map(lambda x: x[1], low_group)),
        event_observed_B=list(map(lambda x: x[1], high_group)),
        alpha=0.95
    )

    # TODO: add CoxRegression here to obtain C-Index and Log-Likelihood

    # Get times and survival function
    low_group_survival_function = get_group_survival_function(low_group)
    high_group_survival_function = get_group_survival_function(high_group)

    return low_group_survival_function, high_group_survival_function, {
        'test_statistic': log_rank_res.test_statistic,
        'p_value': log_rank_res.p_value
    }


def compute_c_index_and_log_likelihood(df: pd.DataFrame) -> Tuple[float, float]:
    """
    Computes the C-Index and the partial Log-Likelihood from a DataFrame.
    @param df: Pandas DataFrame. IMPORTANT: has to have 3 colunms: 'E' (event), 'T' (time), and 'group' (group in which
    the sample is).
    @return: A tuple with the C-Index and the partial Log-Likelihood.
    """
    # Checks if the number of unique values in the 'group' column is greater than 1
    if len(df['group'].unique()) <= 1:
        return 0.0, 0.0

    cph: CoxPHFitter = CoxPHFitter().fit(df, duration_col='T', event_col='E')
    concordance_index = cph.score(df, scoring_method='concordance_index')
    log_likelihood = cph.score(df, scoring_method='log_likelihood')
    return concordance_index, log_likelihood


def generate_survival_groups_by_clustering(
    classifier: ClusteringModels,
    molecules_df: pd.DataFrame,
    clinical_df: pd.DataFrame,
    compute_samples_and_clusters: bool
) -> Tuple[List[Dict[str, LabelOrKaplanMeierResult]], float, float, np.ndarray]:
    """
    Generates the survival function to plot in a KaplanMeier curve for every group taken from a Clustering model.
    @param classifier: Clustering classifier to infer the group from expressions.
    @param molecules_df: Expression data.
    @param clinical_df: Clinical data.
    @param compute_samples_and_clusters: If True, it computes the samples and their clusters.
    @return: A tuple with all the groups with their survival function, the C-Index from (Cox Regression), the Log
    Likelihood from (Cox Regression), and a tuple with all the samples with their groups
    """
    # Formats clinical data to a Numpy structured array
    # TODO: refactor this! It's being used in a lot of places!
    clinical_data = np.core.records.fromarrays(clinical_df.to_numpy().transpose(), names='event, time',
                                               formats='bool, float')

    # Gets all the molecules in the needed order. It's necessary to call get_subset_of_features to fix the
    # structure of data
    molecules_df = get_subset_of_features(molecules_df,  molecules_df.index)

    # Gets the groups
    clustering_result = classifier.predict(molecules_df.values)

    # Retrieves the data for every group and stores the survival function
    data: List[Dict[str, LabelOrKaplanMeierResult]] = []
    for cluster_id in range(classifier.n_clusters):
        current_group = clinical_data[np.where(clustering_result == cluster_id)]
        current_group = struct_array_to_kaplan_meier_samples(current_group)

        group_data = {
            'label': str(cluster_id),
            'data': get_group_survival_function(current_group)
        }
        data.append(group_data)

    # Fits a Cox Regression model using the column group as the variable to consider to get the C-Index and the
    # partial Log-Likelihood for the group
    df = pd.DataFrame({
        'T': clinical_data['time'],
        'E': clinical_data['event'],
        'group': clustering_result
    })

    concordance_index, log_likelihood = compute_c_index_and_log_likelihood(df)

    # If needed adds samples
    if compute_samples_and_clusters:
        df['sample'] = molecules_df.index.tolist()
        samples_and_clusters = df[['sample', 'group']].values
    else:
        samples_and_clusters = []

    return data, concordance_index, log_likelihood, samples_and_clusters
