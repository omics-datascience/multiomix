# Generated by Django 3.2.13 on 2023-06-17 18:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets_synchronization', '0030_cgdsstudy_version'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cgdsdataset',
            name='mongo_collection_name',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
