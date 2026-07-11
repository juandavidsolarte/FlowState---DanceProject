# Finaliza la migración de Genero para SCRUM-30: elimina el CharField
# legado `genero` (ya migrado a la tabla Genero en 0003) y renombra
# el campo temporal genero_fk a genero, dejando el modelo Coreografia
# igual a lo definido en models.py.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0003_migrar_datos_genero"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="coreografia",
            name="genero",
        ),
        migrations.RenameField(
            model_name="coreografia",
            old_name="genero_fk",
            new_name="genero",
        ),
        migrations.AlterField(
            model_name="coreografia",
            name="genero",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="coreografias",
                to="catalog.genero",
            ),
        ),
    ]
