# Generated by Django 3.0.3 on 2020-03-31 15:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_service', '0005_auto_20200330_1431'),
    ]

    operations = [
        migrations.AddField(
            model_name='mrnamirnaexperiment',
            name='minimum_std',
            field=models.FloatField(default=0.2),
        ),
    ]
