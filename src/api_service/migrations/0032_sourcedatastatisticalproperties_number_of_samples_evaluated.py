# Generated by Django 3.0.3 on 2020-09-28 14:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_service', '0031_auto_20200925_2228'),
    ]

    operations = [
        migrations.AddField(
            model_name='sourcedatastatisticalproperties',
            name='number_of_samples_evaluated',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
    ]
