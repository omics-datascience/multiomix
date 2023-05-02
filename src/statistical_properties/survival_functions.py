from typing import Tuple, Literal, List, Dict, cast
import numpy as np
from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test

KaplanMeierSample = Tuple[
    int,
    Literal[0, 1]  # 1 = interest, 0 = censored
]


def get_group_survival_function(data: List[KaplanMeierSample]) -> List[Dict]:
    """
    Gets list of times and events and gets the survival function
    TODO: put in a class in another file
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
    Generate low and high groups from expression data, time and event
    @param clinical_time_values: Time values
    @param clinical_event_values: Event values
    @param expression_values: Expression values
    @param fields_interest: Field of interest, every value which is not in this list is considered censores
    @return: Low group, high group and logrank test
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

    # Generates logrank test from time values
    logrank_res = logrank_test(
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
        'test_statistic': logrank_res.test_statistic,
        'p_value': logrank_res.p_value
    }
