from django.contrib.auth import get_user_model
from django.db import models
from api_service.websocket_functions import send_update_institutions_command, send_update_user_for_institution_command


class Institution(models.Model):
    """Institutions to manage users and shared datasets"""
    name = models.CharField(max_length=30)
    location = models.CharField(max_length=60, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    telephone_number = models.CharField(max_length=30, blank=True, null=True)
    users = models.ManyToManyField(get_user_model(), through='InstitutionAdministration')

    class Meta:
        ordering = ['-id']
       
    def delete(self, *args, **kwargs) -> None:
        """Deletes the instance and sends a websockets message to update state in the frontend """
        related_users = list(self.users.all())
        super().delete(*args, **kwargs)
        # Sends a websockets message to all users for update the institutions state in the frontend
        for user in related_users:
            send_update_institutions_command(user.id)

    def save(self, *args, **kwargs) -> None:
        """Everytime the institution status changes, uses websocket to update state in the frontend"""   
        super().save(*args, **kwargs)
        # Sends a websockets message to all users for update the institutions state in the frontend
        for user in self.users.all():
            send_update_institutions_command(user.id)

    def __str__(self):
        return self.name


class InstitutionAdministration(models.Model):
    """An intermediate table to save some data about the Institution-User relationship"""
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE)
    is_institution_admin = models.BooleanField(default=False)

    class Meta:
        ordering = ['-id']
    
    def delete(self, *args, **kwargs) -> None:
        """Deletes the instance and sends a websockets message to update state in the frontend """
        related_users = list(self.institution.users.all())
        super().delete(*args, **kwargs)
        # Sends a websockets message to all users for update the institutions state in the frontend
        for user in related_users:
            send_update_institutions_command(user.id)
            send_update_user_for_institution_command(user.id)

    def save(self, *args, **kwargs) -> None:
        """Everytime the institution status changes, uses websocket to update state in the frontend"""   
        super().save(*args, **kwargs)
        related_users = list(self.institution.users.all())
        # Sends a websockets message to all users for update the institutions state in the frontend
        for user in related_users:
            send_update_institutions_command(user.id)
            send_update_user_for_institution_command(user.id)

    def __str__(self):
        as_admin_label = '(as admin)' if self.is_institution_admin else ''
        return f'{self.user} -> {self.institution} {as_admin_label}'
