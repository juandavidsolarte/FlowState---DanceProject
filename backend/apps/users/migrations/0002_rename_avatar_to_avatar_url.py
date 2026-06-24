from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="user",
            old_name="avatar",
            new_name="avatar_url",
        ),
        migrations.AlterField(
            model_name="user",
            name="avatar_url",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
