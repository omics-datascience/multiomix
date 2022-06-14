from django.contrib.auth import get_user_model
from django.db import models
from genes.models import Gene


class BiomarkerType(models.IntegerChoices):
    """Possible types of a Biomarker"""
    MRNA = 1
    MIRNA = 2
    CNA = 3
    METHYLATION = 4
    HETEROGENEOUS = 5


class Biomarker(models.Model):
    """Represents a biomarker"""
    name = models.CharField(max_length=100)
    type = models.IntegerField(choices=BiomarkerType.choices)
    genes = models.ManyToManyField(Gene, blank=True)
    genes = models.ManyToManyField(Gene, blank=True)
    mirnas = models.ManyToManyField(Gene, blank=True)
    cnas = models.ManyToManyField(Gene, blank=True)

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    def __str__(self):
        return self.name
