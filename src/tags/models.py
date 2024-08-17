from django.contrib.auth import get_user_model
from django.db import models
from api_service.websocket_functions import send_update_user_file_command


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

    def delete(self, *args, **kwargs):
        """Updates UserFiles' status in frontend to prevent inconsistencies with related tags"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the user file state in the frontend
        send_update_user_file_command(self.user.id)

    def save(self, *args, **kwargs):
        """Updates UserFiles' status in frontend to prevent inconsistencies with related tags"""
        super().save(*args, **kwargs)

        # Sends a websocket message to update the state in the frontend
        send_update_user_file_command(self.user.id)
