# Migración de datos para SCRUM-30: convierte los valores de texto
# libre que tenía Coreografia.genero (ej. "salsa") en registros del
# nuevo modelo Genero, y enlaza cada coreografía vía genero_fk.
# Sin esta migración, el paso 0004 (eliminar el CharField) rompería
# datos existentes al no poder convertir texto a un id de FK.

from django.db import migrations


def migrar_generos(apps, schema_editor):
    Coreografia = apps.get_model("catalog", "Coreografia")
    Genero = apps.get_model("catalog", "Genero")

    # Cache local para no crear un Genero duplicado por cada coreografía
    # que comparta el mismo valor de texto.
    cache_generos = {}

    for coreografia in Coreografia.objects.all():
        valor = (coreografia.genero or "").strip()
        if not valor:
            continue

        clave = valor.lower()
        genero_id = cache_generos.get(clave)
        if genero_id is None:
            genero, _ = Genero.objects.get_or_create(nombre=valor)
            genero_id = genero.id
            cache_generos[clave] = genero_id

        coreografia.genero_fk_id = genero_id
        coreografia.save(update_fields=["genero_fk"])


def revertir_migracion(apps, schema_editor):
    # No es necesario revertir datos: al hacer rollback del esquema,
    # el campo genero_fk y los registros de Genero se eliminan solos.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0002_genero"),
    ]

    operations = [
        migrations.RunPython(migrar_generos, revertir_migracion),
    ]
