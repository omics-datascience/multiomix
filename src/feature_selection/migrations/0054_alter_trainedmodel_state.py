# Generated by Django 4.2.11 on 2024-05-31 18:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feature_selection', '0053_alter_trainedmodel_state'),
    ]

    operations = [
        migrations.AlterField(
            model_name='trainedmodel',
            name='state',
            field=models.IntegerField(choices=[(1, 'Completed'), (2, 'Finished With Error'), (3, 'In Process'), (4, 'Waiting For Queue'), (5, 'No Samples In Common'), (6, 'Stopping'), (7, 'Stopped'), (8, 'Reached Attempts Limit'), (9, 'No Features Found'), (10, 'No Best Model Found'), (11, 'Number Of Samples Fewer Than Cv Folds'), (12, 'Model Dump Not Available'), (13, 'Timeout Exceeded'), (14, 'Empty Dataset')]),
        ),
    ]
