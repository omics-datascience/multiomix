# Generated by Django 3.0.3 on 2020-08-19 19:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets_synchronization', '0013_auto_20200520_1610'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cgdsdataset',
            name='file_path',
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name='cgdsdataset',
            name='observation',
            field=models.CharField(blank=True, max_length=300, null=True),
        ),
    ]
