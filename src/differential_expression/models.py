from django.db import models
from django.contrib.auth import get_user_model
from institutions.models import Institution
from django.contrib.auth.models import User


class DifferentialExpressionExperiment(models.Model):
    """
    Model to create and manage differential expression data.
    """

    name = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)

    # Sources
    clinical_source = models.ForeignKey('api_service.ExperimentClinicalSource', on_delete=models.CASCADE, null=False,
                                        blank=False, related_name='differential_expression_as_clinical')

    mrna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=False, blank=False,
                                    related_name='differential_expression_as_mrna')

    clinical_attribute = models.CharField(max_length=100, blank=False, null=False)

    threshold_percentile = models.FloatField(default=0.15, blank=False, null=False)

    threshold = models.FloatField(default=0.0001, blank=False, null=False)

    task_id = models.CharField(max_length=100, blank=True, null=True)

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    is_public = models.BooleanField(blank=False, null=False, default=False)
    shared_institutions = models.ManyToManyField(Institution, related_name='shared_differential_expression', blank=True)
    shared_users = models.ManyToManyField(User, blank=True,
                                          related_name='shared_users_differential_expression')

    def __str__(self):
        return f"Differential Expression Experiment: {self.name}"

    def save(self, *args, **kwargs):
        """
        Override the save method to ensure that the name is unique.
        """
        if not self.name:
            raise ValueError("Experiment name cannot be empty.")

        # # Ensure the name is unique
        # if DifferentialExpressionExperiment.objects.filter(name=self.name).exists():
        #     raise ValueError(f"An experiment with the name '{self.name}' already exists.")

        super().save(*args, **kwargs)
        