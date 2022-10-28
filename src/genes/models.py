from django.db import models

class Gene(models.Model):
    """Gene extra data to show in ResultTableView"""
    name = models.CharField(max_length=50, primary_key=True)
    type = models.CharField(max_length=25)
    description = models.TextField(blank=True, null=True)
    chromosome = models.CharField(max_length=30)
    start = models.PositiveIntegerField()
    end = models.PositiveIntegerField()

    def __str__(self):
        return self.name
