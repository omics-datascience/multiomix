class ExperimentFailed(Exception):
    """Raised when the experiment has failed for some reason"""
    pass


class NoSamplesInCommon(Exception):
    """Raised when the experiment has no samples in common between its bots sources"""
    pass


class ExperimentStopped(Exception):
    """Raised when user stops the experiment"""
    pass


class NoBestModelFound(Exception):
    """Raised when GridSearch couldn't find the best score for a TrainedModel."""
    pass


class NumberOfSamplesFewerThanCVFolds(Exception):
    """
    Raised when the number of unique sample classes is fewer than the number of CrossValidation folds, this is raised in
    the StratifiedKFold used in GridSearch during some processes.
    """
    pass


class EmptyDataset(Exception):
    """Raised when there are no samples after filtering invalid values (NaN, Inf, etc.)."""
    pass


class NoValidMoleculesForModel(Exception):
    """Raised when number of molecules in the dataset for inference is different from the number of molecules
    used when training the model."""
    pass
