from django.contrib.auth import get_user_model
from django.db import models
from tags.models import Tag


class Biomarker(models.Model):
    """Represents a biomarker"""
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    tag = models.ForeignKey(Tag, on_delete=models.SET_NULL, default=None, blank=True, null=True)

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    def __str__(self):
        return self.name
