# Generated by Django 3.2.20 on 2023-09-20 22:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('statistical_properties', '0014_alter_statisticalvalidation_state'),
    ]

    operations = [
        migrations.AddField(
            model_name='statisticalvalidation',
            name='task_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
