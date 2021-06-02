from django.contrib.auth import get_user_model
from django.db import models


class Institution(models.Model):
    """Institutions to manage users and shared datasets"""
    name = models.CharField(max_length=30)
    location = models.CharField(max_length=60, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    telephone_number = models.CharField(max_length=30, blank=True, null=True)
    users = models.ManyToManyField(get_user_model(), through='InstitutionAdministration')

    def __str__(self):
        return self.name


class InstitutionAdministration(models.Model):
    """An intermediate table to save some data about the Institution-User relationship"""
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE)
    is_institution_admin = models.BooleanField(default=False)

    def __str__(self):
        as_admin_label = '(as admin)' if self.is_institution_admin else ''
        return f'{self.user} -> {self.institution} {as_admin_label}'
