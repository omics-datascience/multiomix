from typing import List, Optional
from queryset_sequence import QuerySetSequence
from django.contrib.auth import get_user_model
from django.db import models
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
    REACHED_ATTEMPTS_LIMIT = 8,
    NO_FEATURES_FOUND = 9


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

    def all_molecules(self, molecule_type: Optional[MoleculeType]) -> QuerySetSequence:
        """TODO: complete docs"""
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
