# Generated by Django 3.2.20 on 2023-09-20 23:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feature_selection', '0048_fsexperiment_task_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='fsexperiment',
            name='attempt',
            field=models.PositiveSmallIntegerField(default=0),
        ),
    ]
