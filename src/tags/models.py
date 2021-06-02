from django.contrib.auth import get_user_model
from django.db import models


class TagType(models.IntegerChoices):
    """Tags are different for Files and Experiments"""
    FILE = 1
    EXPERIMENT = 2


class Tag(models.Model):
    """A file tag for a better User's file organization"""
    name = models.CharField(max_length=20)
    description = models.CharField(max_length=60, blank=True, null=True)
    parent_tag = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    type = models.IntegerField(choices=TagType.choices)

    def __str__(self):
        description = self.description if self.description is not None else '-'
        return f'{self.name}: {description}'
