from typing import Optional
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import QuerySet
from queryset_sequence import QuerySetSequence

from institutions.models import Institution
from tags.models import Tag
from api_service.websocket_functions import send_update_biomarkers_command
from user_files.models_choices import MoleculeType


class BiomarkerOrigin(models.IntegerChoices):
    """All the possible ways to create a Biomarker."""
    MANUAL = 1
    INTERSECTION = 2
    FEATURE_SELECTION = 3
    DIFFERENTIAL_EXPRESSION = 4


class BiomarkerState(models.IntegerChoices):
    """All the possible states of a Biomarker/FSExperiment/etc."""
    COMPLETED = 1
    FINISHED_WITH_ERROR = 2
    IN_PROCESS = 3
    WAITING_FOR_QUEUE = 4
    NO_SAMPLES_IN_COMMON = 5
    STOPPING = 6
    STOPPED = 7
    REACHED_ATTEMPTS_LIMIT = 8
    NO_FEATURES_FOUND = 9
    EMPTY_DATASET = 10
    NO_VALID_MOLECULES = 11
    NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS = 12
    TIMEOUT_EXCEEDED = 13


class TrainedModelState(models.IntegerChoices):
    """All the possible states of a TrainedModel."""
    COMPLETED = 1
    FINISHED_WITH_ERROR = 2
    IN_PROCESS = 3
    WAITING_FOR_QUEUE = 4
    NO_SAMPLES_IN_COMMON = 5
    STOPPING = 6
    STOPPED = 7
    REACHED_ATTEMPTS_LIMIT = 8
    NO_FEATURES_FOUND = 9
    NO_BEST_MODEL_FOUND = 10
    NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS = 11
    # This could happen for a serialization error in the Spark job
    MODEL_DUMP_NOT_AVAILABLE = 12
    TIMEOUT_EXCEEDED = 13
    EMPTY_DATASET = 14


class Biomarker(models.Model):
    """Represents a biomarker"""
    statistical_validations: QuerySet['statistical_properties.StatisticalValidation']
    inference_experiments: QuerySet['inferences.InferenceExperiment']
    methylations: QuerySet['MethylationIdentifier']
    trained_models: QuerySet['trained_models.TrainedModel']
    cnas: QuerySet['CNAIdentifier']
    mirnas: QuerySet['MiRNAIdentifier']
    mrnas: QuerySet['MRNAIdentifier']
    is_public = models.BooleanField(blank=False, null=False, default=False)
    name: str = models.CharField(max_length=300)
    description: Optional[str] = models.TextField(null=True, blank=True)
    tag: Optional[Tag] = models.ForeignKey(Tag, on_delete=models.SET_NULL, default=None, blank=True, null=True)
    upload_date: Optional[models.DateTimeField] = models.DateTimeField(auto_now_add=True, blank=False, null=True)
    origin: int = models.IntegerField(choices=BiomarkerOrigin.choices)
    state: int = models.IntegerField(choices=BiomarkerState.choices)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    shared_institutions = models.ManyToManyField(Institution, related_name='biomarkers', blank=True)

    def __str__(self) -> str:
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

    def all_molecules(self, molecule_type: Optional[MoleculeType]) -> QuerySetSequence:
        """Returns a QuerySetSequence with all the molecules in this Biomarker."""
        if molecule_type is None:
            return QuerySetSequence(
                self.mrnas.all(), self.mirnas.all(), self.cnas.all(), self.methylations.all()
            )

        # Filter by molecule type
        molecule_type = int(molecule_type)
        if molecule_type == MoleculeType.MRNA:
            return self.mrnas.all()

        if molecule_type == MoleculeType.MIRNA:
            return self.mirnas.all()

        if molecule_type == MoleculeType.CNA:
            return self.cnas.all()

        return self.methylations.all()

    @property
    def has_fs_experiment(self) -> bool:
        """Returns True if this Biomarker was created from a Feature Selection experiment"""
        return hasattr(self, 'fs_experiment')

    @property
    def was_already_used(self) -> bool:
        """
        Returns True if this Biomarker was used for an Inference experiment, Statistical Validation or Trained Model.
        This avoids the user to edit a Biomarker that was already used and generate inconsistencies.
        """
        return self.trained_models.exists() or self.inference_experiments.exists() or \
            self.statistical_validations.exists()

    def delete(self, *args, **kwargs) -> None:
        """Deletes the instance and sends a websockets message to update state in the frontend"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the biomarker state in the frontend
        send_update_biomarkers_command(self.user.id)

    def save(self, *args, **kwargs) -> None:
        """Everytime the biomarker status changes, uses websocket to update state in the frontend"""
        super().save(*args, **kwargs)
        biomarker: QuerySet['Biomarker']
        # Sends a websocket message to update the state in the frontend
        send_update_biomarkers_command(self.user.id)


class MoleculeIdentifier(models.Model):
    """Common fields for a Biomarker's molecule"""
    identifier: str = models.CharField(max_length=50)

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
