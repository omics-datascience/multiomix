# Generated by Django 4.2.15 on 2024-09-25 18:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('institutions', '0004_auto_20220923_2322'),
        ('api_service', '0058_experiment_is_public'),
    ]

    operations = [
        migrations.AddField(
            model_name='experiment',
            name='shared_institutions',
            field=models.ManyToManyField(blank=True, related_name='shared_correlation_analysis', to='institutions.institution'),
        ),
    ]