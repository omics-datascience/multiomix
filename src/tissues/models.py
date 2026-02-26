from django.core.exceptions import PermissionDenied
from django.db import models


class Tissue(models.Model):
    """Reference model for tissue types. Tissues are read-only and cannot be deleted."""
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name

    def delete(self, *args, **kwargs):
        raise PermissionDenied("Tissues cannot be deleted")
