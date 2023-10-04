import numpy as np
import pandas as pd
from common.datasets_utils import get_common_samples, generate_molecules_file, clean_dataset, \
    check_molecules_and_samples_number_or_exception
from common.exceptions import ExperimentStopped
from common.functions import check_if_stopped
from common.typing import AbortEvent
from common.utils import get_subset_of_features
from feature_selection.fs_algorithms import SurvModel
from feature_selection.models import TrainedModel
from inferences.models import InferenceExperiment, SampleAndClusterPrediction, SampleAndTimePrediction


def __compute_inference_experiment(experiment: InferenceExperiment, molecules_temp_file_path: str,
                                   is_aborted: AbortEvent):
    """
    Computes the Feature Selection experiment using the params defined by the user.
    @param experiment: InferenceExperiment instance.
    @param molecules_temp_file_path: Path of the DataFrame with the molecule expressions.
    @param is_aborted: Method to call to check if the experiment has been stopped.
    """
    check_if_stopped(is_aborted, ExperimentStopped)
    trained_model: TrainedModel = experiment.trained_model
    classifier: SurvModel = trained_model.get_model_instance()
    is_clustering = hasattr(trained_model, 'clustering_parameters')

    # TODO: refactor this retrieval of data as it's repeated in the fs_service
    # Gets molecules and clinical DataFrames
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_df = pd.read_csv(molecules_temp_file_path, sep='\t', decimal='.', index_col=0)

    # Computes general metrics
    # Gets all the molecules in the needed order. It's necessary to call get_subset_of_features to fix the
    # structure of data
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_df = get_subset_of_features(molecules_df, molecules_df.index)

    # Clean invalid values
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_df = clean_dataset(molecules_df, axis='index')

    # Checks if the number of molecules is valid
    check_molecules_and_samples_number_or_exception(classifier, molecules_df)

    # Gets a list of samples
    check_if_stopped(is_aborted, ExperimentStopped)
    samples = np.array(molecules_df.index.tolist())

    if is_clustering:
        # Gets the groups
        check_if_stopped(is_aborted, ExperimentStopped)
        clustering_result = classifier.predict(molecules_df.values)

        # Retrieves the data for every group and stores the survival function
        for cluster_id in range(classifier.n_clusters):
            # Gets the samples in the current cluster
            check_if_stopped(is_aborted, ExperimentStopped)
            current_samples = samples[np.where(clustering_result == cluster_id)]

            # Stores the prediction and the samples
            check_if_stopped(is_aborted, ExperimentStopped)
            SampleAndClusterPrediction.objects.bulk_create([
                SampleAndClusterPrediction(
                    sample=sample_id,
                    cluster=cluster_id,
                    experiment=experiment
                )
                for sample_id in current_samples
            ])
    else:
        # If it's not a clustering model, it's an SVM or RF
        check_if_stopped(is_aborted, ExperimentStopped)
        regression_result = np.round(classifier.predict(molecules_df.values), 4)

        # Stores the prediction and the samples
        check_if_stopped(is_aborted, ExperimentStopped)
        SampleAndTimePrediction.objects.bulk_create([
            SampleAndTimePrediction(
                sample=sample_id,
                prediction=predicted_time,
                experiment=experiment
            )
            for sample_id, predicted_time in zip(samples, regression_result)
        ])

    experiment.save()


def prepare_and_compute_inference_experiment(experiment: InferenceExperiment, is_aborted: AbortEvent) -> str:
    """
    Gets samples in common, generates needed DataFrames and finally computes the Feature Selection experiment.
    @param experiment: InferenceExperiment instance.
    @param is_aborted: Method to call to check if the experiment has been stopped.
    @return Trained model instance if everything was ok. None if no best features were found.
    """
    # Get samples in common
    check_if_stopped(is_aborted, ExperimentStopped)
    samples_in_common = get_common_samples(experiment)

    # Generates needed DataFrames
    check_if_stopped(is_aborted, ExperimentStopped)
    molecules_temp_file_path = generate_molecules_file(experiment, samples_in_common)

    check_if_stopped(is_aborted, ExperimentStopped)
    __compute_inference_experiment(experiment, molecules_temp_file_path, is_aborted)

    return molecules_temp_file_path
