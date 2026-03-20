from django.db import migrations, models

TISSUES = [
    ('Adrenal Gland', 'ADRENAL_GLAND'),
    ('Bladder', 'BLADDER'),
    ('Blood', 'BLOOD'),
    ('Brain', 'BRAIN'),
    ('Breast', 'BREAST'),
    ('Cervix Uteri', 'CERVIX_UTERI'),
    ('Colon', 'COLON'),
    ('Esophagus', 'ESOPHAGUS'),
    ('Kidney', 'KIDNEY'),
    ('Liver', 'LIVER'),
    ('Lung', 'LUNG'),
    ('Ovary', 'OVARY'),
    ('Pancreas', 'PANCREAS'),
    ('Prostate', 'PROSTATE'),
    ('Skin', 'SKIN'),
    ('Stomach', 'STOMACH'),
    ('Testis', 'TESTIS'),
    ('Thyroid', 'THYROID'),
    ('Uterus', 'UTERUS'),
]


def load_tissues(apps, schema_editor):
    Tissue = apps.get_model('tissues', 'Tissue')
    Tissue.objects.bulk_create([Tissue(name=name, code=code) for name, code in TISSUES])


def unload_tissues(apps, schema_editor):
    Tissue = apps.get_model('tissues', 'Tissue')
    Tissue.objects.filter(name__in=[name for name, _ in TISSUES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tissues', '0001_initial'),
    ]

    operations = [
        # Add code field as nullable first (so existing rows don't violate constraints)
        migrations.AddField(
            model_name='tissue',
            name='code',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        # Insert the 19 English tissues (table is empty at this point in migration history)
        migrations.RunPython(load_tissues, reverse_code=unload_tissues),
        # Make code non-nullable and unique
        migrations.AlterField(
            model_name='tissue',
            name='code',
            field=models.CharField(max_length=100, unique=True),
        ),
    ]
