# Generated by Django 3.2.20 on 2023-08-01 22:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feature_selection', '0047_alter_trainedmodel_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='fsexperiment',
            name='task_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
