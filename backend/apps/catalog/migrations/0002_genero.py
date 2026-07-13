# Generado manualmente para SCRUM-30: crea el modelo Genero y agrega
# un campo temporal genero_fk en Coreografia, sin tocar aún el campo
# de texto legado `genero`. La migración de datos (0003) rellena este
# campo antes de que 0004 elimine el CharField y renombre genero_fk.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0001_coreografia_y_video_inicial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Genero",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("nombre", models.CharField(max_length=100, unique=True)),
                ("descripcion", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Género",
                "verbose_name_plural": "Géneros",
                "db_table": "catalog_genero",
                "ordering": ["nombre"],
            },
        ),
        migrations.AddField(
            model_name="coreografia",
            name="genero_fk",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="coreografias_tmp",
                to="catalog.genero",
            ),
        ),
    ]
