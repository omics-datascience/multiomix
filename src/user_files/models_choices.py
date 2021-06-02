# NOTE: The models choices are in this file to prevent circular import issues
from django.db import models


class FileType(models.IntegerChoices):
    """Possible states for experiment evaluation"""
    MRNA = 1
    MIRNA = 2
    CNA = 3
    METHYLATION = 4
    CLINICAL = 5


class FileDecimalSeparator(models.TextChoices):
    """Possible decimal separators for the file"""
    DOT = '.'  # The default
    COMMA = ','
