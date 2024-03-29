# Generated by Django 3.2.13 on 2023-05-23 18:56

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inferences', '0003_alter_sampleandclusterprediction_cluster'),
    ]

    operations = [
        migrations.CreateModel(
            name='SampleAndTimePrediction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sample', models.CharField(max_length=100)),
                ('prediction', models.FloatField()),
                ('experiment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='samples_and_time', to='inferences.inferenceexperiment')),
            ],
        ),
    ]
