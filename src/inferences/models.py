from typing import List, Optional, Tuple
from django.db import models
from api_service.websocket_functions import send_update_prediction_experiment_command
from biomarkers.models import BiomarkerState, Biomarker
from feature_selection.models import TrainedModel
from user_files.models_choices import FileType


class InferenceExperiment(models.Model):
    """Represents a inference experiment from test sources using a TrainedModel"""
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='inference_experiments')
    trained_model = models.ForeignKey(TrainedModel, on_delete=models.CASCADE, related_name='inference_experiments')
    state = models.IntegerField(choices=BiomarkerState.choices)  # Yes, has the same states as a Biomarker. TODO: rename here and everywhere to GeneralExperimentState
    created = models.DateTimeField(auto_now_add=True)

    # Sources
    mrna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='inference_experiments_as_mrna')
    mirna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='inference_experiments_as_mirna')
    cna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='inference_experiments_as_cna')
    methylation_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True,
                                           blank=True, related_name='inference_experiments_as_methylation')

    def get_all_sources(self) -> List[Optional['api_service.ExperimentSource']]:
        """Returns a list with all the sources."""
        res = []
        if self.mrna_source:
            res.append(self.mrna_source)

        if self.mirna_source:
            res.append(self.mirna_source)

        if self.cna_source:
            res.append(self.cna_source)

        if self.methylation_source:
            res.append(self.methylation_source)

        return res

    def get_sources_and_molecules(self) -> List[Tuple[Optional['api_service.ExperimentSource'], List[str], FileType]]:
        """Returns a list with all the sources (except clinical), the selected molecules and type."""
        biomarker = self.biomarker
        res = []
        if self.mrna_source:
            res.append((
                self.mrna_source,
                list(biomarker.mrnas.values_list('identifier', flat=True)),
                FileType.MRNA
            ))

        if self.mirna_source:
            res.append((
                self.mirna_source,
                list(biomarker.mirnas.values_list('identifier', flat=True)),
                FileType.MIRNA
            ))

        if self.cna_source:
            res.append((
                self.cna_source,
                list(biomarker.cnas.values_list('identifier', flat=True)),
                FileType.CNA
            ))

        if self.methylation_source:
            res.append((
                self.methylation_source,
                list(biomarker.methylations.values_list('identifier', flat=True)),
                FileType.METHYLATION
            ))

        return res

    def __str__(self):
        return f'InferenceExperiment using TrainedModel "{self.trained_model.name}"'

    def save(self, *args, **kwargs):
        """Every time the experiment status changes, uses websockets to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_prediction_experiment_command(self.trained_model.biomarker.user.id)

    def delete(self, *args, **kwargs):
        """Deletes the instance and sends a websockets message to update state in the frontend"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_prediction_experiment_command(self.trained_model.biomarker.user.id)


class SampleAndClusterPrediction(models.Model):
    """Represents a sample with his assigned cluster inferred by a clustering algorithm."""
    sample = models.CharField(max_length=100)
    cluster = models.CharField(max_length=20)
    experiment = models.ForeignKey(InferenceExperiment, on_delete=models.CASCADE, related_name='samples_and_clusters')