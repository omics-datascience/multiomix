# Generated by Django 3.0.3 on 2020-08-18 12:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_service', '0025_auto_20200808_1749'),
    ]

    operations = [
        migrations.RenameField(
            model_name='genecnacombination',
            old_name='properties',
            new_name='source_statistical_data',
        ),
        migrations.RenameField(
            model_name='genemethylationcombination',
            old_name='properties',
            new_name='source_statistical_data',
        ),
        migrations.RenameField(
            model_name='genemirnacombination',
            old_name='properties',
            new_name='source_statistical_data',
        ),
        migrations.AlterField(
            model_name='experiment',
            name='name',
            field=models.CharField(max_length=100),
        ),
    ]
