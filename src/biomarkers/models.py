from django.contrib.auth import get_user_model
from django.db import models
from tags.models import Tag
from api_service.websocket_functions import send_update_biomarkers_command

class Biomarker(models.Model):
    """Represents a biomarker"""
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    tag = models.ForeignKey(Tag, on_delete=models.SET_NULL, default=None, blank=True, null=True)
    upload_date = models.DateTimeField(auto_now_add=True, blank=False, null=True)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    def __str__(self):
        return self.name

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


class GeneIdentifier(MoleculeIdentifier):
    """Genes in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='genes')

class MiRNAIdentifier(MoleculeIdentifier):
    """miRNAs in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='mirnas')

class CNAIdentifier(MoleculeIdentifier):
    """CNA in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='cnas')

class MethylationIdentifier(MoleculeIdentifier):
    """Methylation in a Biomarker"""
    biomarker = models.ForeignKey(Biomarker, on_delete=models.CASCADE, related_name='methylations')
