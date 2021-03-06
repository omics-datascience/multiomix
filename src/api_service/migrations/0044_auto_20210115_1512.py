# Generated by Django 3.1.2 on 2021-01-15 15:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('genes', '0001_initial'),
        ('api_service', '0043_auto_20201115_1450'),
    ]

    operations = [
        migrations.AlterField(
            model_name='genecnacombination',
            name='gene',
            field=models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.DO_NOTHING, to='genes.gene'),
        ),
        migrations.AlterField(
            model_name='genemethylationcombination',
            name='gene',
            field=models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.DO_NOTHING, to='genes.gene'),
        ),
        migrations.AlterField(
            model_name='genemirnacombination',
            name='gene',
            field=models.ForeignKey(db_constraint=False, on_delete=django.db.models.deletion.DO_NOTHING, to='genes.gene'),
        ),
    ]
