# NOTE: The models choices are in this file to prevent circular import issues
# That problem happened when trying to import ExperimentType in mongo_service as
# both includes the other's functionality
from django.db import models


class ExperimentType(models.IntegerChoices):
    """Possible types of an experiment to differentiate the pipeline"""
    MIRNA = 1
    CNA = 2
    METHYLATION = 3


class ExperimentState(models.IntegerChoices):
    """Possible states for experiment evaluation"""
    WAITING_FOR_QUEUE = 1
    IN_PROCESS = 2
    COMPLETED = 3
    FINISHED_WITH_ERROR = 4
    NO_SAMPLES_IN_COMMON = 5
    STOPPING = 6
    STOPPED = 7
    REACHED_ATTEMPTS_LIMIT = 8


class CorrelationMethod(models.IntegerChoices):
    """Possible Correlation methods"""
    SPEARMAN = 1,
    KENDALL = 2,
    PEARSON = 3


class PValuesAdjustmentMethod(models.IntegerChoices):
    """Possible P-values adjustment methods"""
    BENJAMINI_HOCHBERG = 1,
    BENJAMINI_YEKUTIELI = 2,
    BONFERRONI = 3
