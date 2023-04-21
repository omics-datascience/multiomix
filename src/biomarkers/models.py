from typing import Union
from django.contrib.auth import get_user_model
from django.db import models
from api_service.models import ExperimentClinicalSource, ExperimentSource
from datasets_synchronization.models import SurvivalColumnsTupleUserFile, SurvivalColumnsTupleCGDSDataset
from feature_selection.models import TrainedModel
from tags.models import Tag
from api_service.websocket_functions import send_update_biomarkers_command


class BiomarkerOrigin(models.IntegerChoices):
    """All the possible ways to create a Biomarker."""
    MANUAL = 1
    INTERSECTION = 2
    FEATURE_SELECTION = 3
    DIFFERENTIAL_EXPRESSION = 4


class BiomarkerState(models.IntegerChoices):
    """All the possible states of a Biomarker."""
    COMPLETED = 1
    FINISHED_WITH_ERROR = 2
    IN_PROCESS = 3
    WAITING_FOR_QUEUE = 4
    NO_SAMPLES_IN_COMMON = 5
    STOPPING = 6
    STOPPED = 7
    REACHED_ATTEMPTS_LIMIT = 8


class Biomarker(models.Model):
    """Represents a biomarker"""
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    tag = models.ForeignKey(Tag, on_delete=models.SET_NULL, default=None, blank=True, null=True)
    upload_date = models.DateTimeField(auto_now_add=True, blank=False, null=True)
    origin = models.IntegerField(choices=BiomarkerOrigin.choices)
    state = models.IntegerField(choices=BiomarkerState.choices)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    def __str__(self):
        return self.name

    @property
    def number_of_mrnas(self) -> int:
        """Gets the number of mRNAs in this Biomarker"""
        return self.mrnas.count()

    @property
    def number_of_mirnas(self) -> int:
        """Gets the number of miRNAs in this Biomarker"""
        return self.mirnas.count()

    @property
    def number_of_cnas(self) -> int:
        """Gets the number of CNAs in this Biomarker"""
        return self.cnas.count()

    @property
    def number_of_methylations(self) -> int:
        """Gets the number of Methylations in this Biomarker"""
        return self.methylations.count()

    @property
    def has_fs_experiment(self) -> bool:
        """Returns True if this Biomarker was created from a Feature Selection experiment"""
        return hasattr(self, 'fs_experiment')

    def delete(self, *args, **kwargs):
        """Deletes the instance and sends a websockets message to update state in the frontend"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the biomarker state in the frontend
        send_update_biomarkers_command(self.user.id)

    def save(self, *args, **kwargs):
        """Everytime the biomarker status changes, uses websocket to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websocket message to update the state in the frontend
        send_update_biomarkers_command(self.user.id)


class MoleculeIdentifier(models.Model):
    """Common fields for a Biomarker's molecule"""
    identifier = models.CharField(max_length=50)

    class Meta:
        abstract = True


class MRNAIdentifier(MoleculeIdentifier):
    """Genes in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='mrnas')

class MiRNAIdentifier(MoleculeIdentifier):
    """miRNAs in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='mirnas')

class CNAIdentifier(MoleculeIdentifier):
    """CNA in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='cnas')

class MethylationIdentifier(MoleculeIdentifier):
    """Methylation in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='methylations')


class StatisticalValidationType(models.IntegerChoices):
    """Types of statistical validations for a Biomarker."""
    CLUSTERING = 1
    USE_TRAINED_MODEL = 2
    DIFFERENTIAL_EXPRESSION = 3
    TRAIN_NEW_MODEL = 4


class StatisticalValidationSourceResult(models.Model):
    """
    Represents a connection between a source and a statistical validation result. Useful to show a result for
    every type of molecule in a Biomarker
    """
    c_index = models.FloatField(null=True, blank=True)  # C-Index from Cox Regression
    log_likelihood = models.FloatField(null=True, blank=True)  # Log likelihood from Cox Regression
    roc_auc = models.FloatField(null=True, blank=True)  # Log likelihood from Cox Regression
    source = models.ForeignKey(ExperimentSource, on_delete=models.CASCADE, null=True, blank=True,
                               related_name='statistical_validations_result')

class StatisticalValidation(models.Model):
    """A Biomarker statistical validation"""
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='statistical_validations')
    type = models.IntegerField(choices=StatisticalValidationType.choices)
    created = models.DateTimeField(auto_now_add=True)

    # General results using all the molecules
    c_index = models.FloatField()  # C-Index from Cox Regression
    log_likelihood = models.FloatField()  # Log likelihood from Cox Regression
    roc_auc = models.FloatField()  # Log likelihood from Cox Regression

    trained_model = models.ForeignKey(TrainedModel, on_delete=models.SET_NULL, related_name='statistical_validations',
                                      null=True, blank=True)

    # Clinical source
    clinical_source = models.ForeignKey(ExperimentClinicalSource, on_delete=models.CASCADE, null=True, blank=True,
                                        related_name='statistical_validations_as_clinical')
    # Clinical source's survival tuple
    survival_column_tuple_user_file = models.ForeignKey(SurvivalColumnsTupleUserFile, on_delete=models.SET_NULL,
                                                        related_name='statistical_validations', null=True, blank=True)
    survival_column_tuple_cgds = models.ForeignKey(SurvivalColumnsTupleCGDSDataset, on_delete=models.SET_NULL,
                                                   related_name='statistical_validations', null=True, blank=True)

    # Sources
    mrna_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE, null=True,
                                              blank=True, related_name='statistical_validations_as_mrna')
    mirna_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE, null=True,
                                              blank=True, related_name='statistical_validations_as_mirna')
    cna_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE, null=True,
                                             blank=True, related_name='statistical_validations_as_cna')
    methylation_source_result = models.OneToOneField(StatisticalValidationSourceResult, on_delete=models.CASCADE,
                                                     null=True, blank=True,
                                                     related_name='statistical_validations_as_methylation')

    @property
    def survival_column_tuple(self) -> Union[SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleUserFile]:
        """Gets valid SurvivalColumnTuple"""
        if self.survival_column_tuple_user_file:
            return self.survival_column_tuple_user_file

        return self.survival_column_tuple_cgds
