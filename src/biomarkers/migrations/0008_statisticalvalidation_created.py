# Generated by Django 3.2.13 on 2023-04-21 18:05

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('biomarkers', '0007_statisticalvalidation_statisticalvalidationsourceresult'),
    ]

    operations = [
        migrations.AddField(
            model_name='statisticalvalidation',
            name='created',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
