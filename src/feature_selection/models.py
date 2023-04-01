from typing import List, Optional
from django.contrib.auth import get_user_model
from django.db import models
from api_service.models import ExperimentSource, ExperimentClinicalSource
from biomarkers.models import Biomarker


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
    K_MEANS = 1


class ClusteringMetric(models.IntegerChoices):
    """Clustering metric to optimize."""
    COX_REGRESSION = 1,
    LOG_RANK_TEST = 2


class SVMKernel(models.IntegerChoices):
    """SVM's kernel """
    LINEAR = 1,
    POLYNOMIAL = 2,
    RBF = 3


class SVMTask(models.IntegerChoices):
    """Task to execute with survival SVM."""
    RANKING = 1,
    REGRESSION = 2


class ClusteringParameters(models.Model):
    """Clustering fitness function parameters."""
    algorithm = models.IntegerField(choices=ClusteringAlgorithm.choices)
    metric = models.IntegerField(choices=ClusteringMetric.choices)
    experiment = models.OneToOneField('FSExperiment', on_delete=models.CASCADE, null=True, blank=True,
                                      related_name='clustering_parameters')


class SVMParameters(models.Model):
    """SVM fitness function parameters."""
    kernel = models.IntegerField(choices=SVMKernel.choices)
    task = models.IntegerField(choices=SVMTask.choices)
    experiment = models.OneToOneField('FSExperiment', on_delete=models.CASCADE, null=True, blank=True,
                                      related_name='svm_parameters')


class FSExperiment(models.Model):
    """Represents a Feature Selection experiment."""
    origin_biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='fs_experiments_as_origin')
    algorithm = models.IntegerField(choices=FeatureSelectionAlgorithm.choices)
    fitness_function = models.IntegerField(choices=FitnessFunction.choices)
    execution_time = models.PositiveIntegerField(default=0)  # Execution time in seconds
    created_biomarker = models.OneToOneField(Biomarker, on_delete=models.SET_NULL, null=True, blank=True,
                                             related_name='fs_experiment')
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    # Sources
    clinical_source = models.ForeignKey(ExperimentClinicalSource, on_delete=models.CASCADE, null=True, blank=True,
                                        related_name='fs_experiments_as_clinical')
    mrna_source = models.ForeignKey(ExperimentSource, on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='fs_experiments_as_mrna')
    mirna_source = models.ForeignKey(ExperimentSource, on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='fs_experiments_as_mirna')
    cna_source = models.ForeignKey(ExperimentSource, on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='fs_experiments_as_cna')
    methylation_source = models.ForeignKey(ExperimentSource, on_delete=models.CASCADE, null=True, blank=True,
                                           related_name='fs_experiments_as_methylation')

    def get_all_sources(self) -> List[Optional[ExperimentSource]]:
        """Returns a list with all the sources."""
        return [
            self.clinical_source,
            self.mrna_source,
            self.mirna_source,
            self.cna_source,
            self.methylation_source,
        ]
