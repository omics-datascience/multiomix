# Generated by Django 3.2.13 on 2023-04-25 14:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('biomarkers', '0009_auto_20230421_1806'),
    ]

    operations = [
        migrations.AddField(
            model_name='statisticalvalidation',
            name='mean_squared_error',
            field=models.FloatField(default=-1.0),
            preserve_default=False,
        ),
    ]
