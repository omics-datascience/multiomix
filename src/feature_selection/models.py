import os
import pickle
from typing import List, Optional, Tuple
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from api_service.websocket_functions import send_update_trained_models_command
from user_files.models_choices import FileType


class FeatureSelectionAlgorithm(models.IntegerChoices):
    """Available Feature Selection algorithms."""
    BLIND_SEARCH = 1,
    COX_REGRESSION = 2,
    BBHA = 3,
    PSO = 4


class FitnessFunction(models.IntegerChoices):
    """Available models to execute as the fitness function."""
    CLUSTERING = 1,
    SVM = 2,
    RF = 3  # TODO: implement in backend


class ClusteringAlgorithm(models.IntegerChoices):
    """Clustering algorithm."""
    K_MEANS = 1
    SPECTRAL = 2  # TODO: implement in backend


class ClusteringMetric(models.IntegerChoices):
    """Clustering metric to optimize."""
    COX_REGRESSION = 1,
    LOG_RANK_TEST = 2


class ClusteringScoringMethod(models.IntegerChoices):
    """Clustering scoring method."""
    C_INDEX = 1,
    LOG_LIKELIHOOD = 2


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
    algorithm = models.IntegerField(choices=ClusteringAlgorithm.choices, default=ClusteringAlgorithm.K_MEANS)
    metric = models.IntegerField(choices=ClusteringMetric.choices, default=ClusteringMetric.COX_REGRESSION)
    scoring_method = models.IntegerField(choices=ClusteringScoringMethod.choices,
                                         default=ClusteringScoringMethod.C_INDEX)
    trained_model = models.OneToOneField('TrainedModel', on_delete=models.CASCADE, related_name='clustering_parameters')


class SVMParameters(models.Model):
    """SVM fitness function parameters."""
    kernel = models.IntegerField(choices=SVMKernel.choices)
    task = models.IntegerField(choices=SVMTask.choices)
    trained_model = models.OneToOneField('TrainedModel', on_delete=models.CASCADE, related_name='svm_parameters')


class FSExperiment(models.Model):
    """Represents a Feature Selection experiment."""
    origin_biomarker = models.ForeignKey('biomarkers.Biomarker', on_delete=models.CASCADE,
                                         related_name='fs_experiments_as_origin')
    algorithm = models.IntegerField(choices=FeatureSelectionAlgorithm.choices)
    execution_time = models.PositiveIntegerField(default=0)  # Execution time in seconds
    created_biomarker = models.OneToOneField('biomarkers.Biomarker', on_delete=models.SET_NULL, null=True, blank=True,
                                             related_name='fs_experiment')
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    # Sources
    clinical_source = models.ForeignKey('api_service.ExperimentClinicalSource', on_delete=models.CASCADE, null=True,
                                        blank=True, related_name='fs_experiments_as_clinical')
    mrna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='fs_experiments_as_mrna')
    mirna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='fs_experiments_as_mirna')
    cna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='fs_experiments_as_cna')
    methylation_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True,
                                           blank=True, related_name='fs_experiments_as_methylation')

    def get_all_sources(self) -> List[Optional['api_service.ExperimentSource']]:
        """Returns a list with all the sources."""
        return [
            self.clinical_source,
            self.mrna_source,
            self.mirna_source,
            self.cna_source,
            self.methylation_source,
        ]

    def get_sources_and_molecules(self) -> List[Tuple[Optional['api_service.ExperimentSource'], List[str], FileType]]:
        """Returns a list with all the sources (except clinical), the selected molecules and type."""
        biomarker = self.origin_biomarker
        return [
            (self.mrna_source, list(biomarker.mrnas.values_list('identifier', flat=True)), FileType.MRNA),
            (self.mirna_source, list(biomarker.mirnas.values_list('identifier', flat=True)), FileType.MIRNA),
            (self.cna_source, list(biomarker.cnas.values_list('identifier', flat=True)), FileType.CNA),
            (
                self.methylation_source,
                list(biomarker.methylations.values_list('identifier', flat=True)),
                FileType.METHYLATION
            )
        ]


def user_directory_path_for_trained_models(instance, filename: str):
    """File will be uploaded to MEDIA_ROOT/uploads/user_<id>/trained_models/<filename>"""
    return f'uploads/user_{instance.biomarker.user.id}/trained_models/{filename}'


class TrainedModel(models.Model):
    """Represents a Model to validate or make inference with a Biomarker."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    biomarker = models.ForeignKey('biomarkers.Biomarker', on_delete=models.CASCADE, related_name='trained_models')
    fs_experiment = models.OneToOneField(FSExperiment, on_delete=models.SET_NULL, related_name='best_model',
                                         null=True, blank=True)
    fitness_function = models.IntegerField(choices=FitnessFunction.choices)
    model_dump = models.FileField(upload_to=user_directory_path_for_trained_models)
    best_fitness_value =  models.FloatField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Trained model for Biomarker "{self.biomarker.name}"'

    def get_model_instance(self):
        """Deserializes the model dump and return the model instance"""
        model_path = os.path.join(settings.MEDIA_ROOT, self.model_dump.name)
        with open(model_path, "rb") as fp:
            model = pickle.load(fp)
        return model

    def save(self, *args, **kwargs):
        """Every time the experiment status changes, uses websockets to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_trained_models_command(self.user.id)

    def delete(self, *args, **kwargs):
        """Deletes the instance and sends a websockets message to update state in the frontend"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_trained_models_command(self.user.id)
