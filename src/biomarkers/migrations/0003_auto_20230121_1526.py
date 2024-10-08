# Generated by Django 3.2.13 on 2023-01-21 15:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('biomarkers', '0002_auto_20221017_1903'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='biomarker',
            name='genes',
        ),
        migrations.CreateModel(
            name='MiRNAIdentifier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(max_length=50)),
                ('biomarker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mirnas', to='biomarkers.biomarker')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='MethylationIdentifier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(max_length=50)),
                ('biomarker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='methylations', to='biomarkers.biomarker')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='GeneIdentifier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(max_length=50)),
                ('biomarker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='genes', to='biomarkers.biomarker')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CNAIdentifier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(max_length=50)),
                ('biomarker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cnas', to='biomarkers.biomarker')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
