# Generated by Django 3.0.3 on 2020-03-10 13:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets_synchronization', '0009_auto_20200309_1430'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cgdsstudy',
            name='state',
            field=models.IntegerField(choices=[(0, 'Unsynchronized'), (1, 'Waiting For Queue'), (2, 'In Process'), (3, 'Completed'), (4, 'Finished With Error'), (5, 'Url Error')], default=0),
        ),
    ]
