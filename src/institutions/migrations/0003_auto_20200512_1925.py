# Generated by Django 3.0.3 on 2020-05-12 19:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('institutions', '0002_auto_20200512_1842'),
    ]

    operations = [
        migrations.AlterField(
            model_name='institutionadministration',
            name='is_institution_admin',
            field=models.BooleanField(default=False),
        ),
    ]
