# Generated by Django 4.2.15 on 2024-09-20 18:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('datasets_synchronization', '0035_auto_20230922_2356'),
        ('user_files', '0015_alter_userfile_options'),
        ('api_service', '0056_alter_experiment_attempt'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='genecnacombination',
            options={'verbose_name': 'Gene CNA Combination'},
        ),
        migrations.AlterModelOptions(
            name='genemethylationcombination',
            options={'verbose_name': 'Gene Methylation Combination'},
        ),
        migrations.AlterModelOptions(
            name='genemirnacombination',
            options={'verbose_name': 'Gene MiRNA Combination'},
        ),
        migrations.AlterField(
            model_name='experimentsource',
            name='cgds_dataset',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='cgds_dataset', to='datasets_synchronization.cgdsdataset'),
        ),
        migrations.AlterField(
            model_name='experimentsource',
            name='user_file',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='user_file', to='user_files.userfile'),
        ),
    ]