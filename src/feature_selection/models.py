from django.db import models


class FeatureSelectionAlgorithm(models.IntegerChoices):
    """Available Feature Selection algorithms."""
    BLIND_SEARCH = 1,
    COX_REGRESSION = 2,
    BBHA = 3,
    PSO = 4


class FitnessFunction(models.IntegerChoices):
    """Available fitness functions."""
    CLUSTERING = 1,
    SVM = 2,
    RF = 3


class ClusteringAlgorithm(models.IntegerChoices):
    """Clustering algorithm."""
    K_MEANS = 1,


class ClusteringMetric(models.IntegerChoices):
    """Clustering metric to optimize."""
    COX_REGRESSION = 1,
    LOG_RANK_TEST = 2


class SvmKernel(models.IntegerChoices):
    """SVM's kernel """
    LINEAR = 1,
    POLYNOMIAL = 2,
    RBF = 3,


class SvmTask(models.IntegerChoices):
    """Task to execute with survival SVM."""
    RANKING = 1,
    REGRESSION = 2
