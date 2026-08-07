from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("movies", "0024_subs_rename"),
    ]

    operations = [
        migrations.CreateModel(
            name="IgnoredTriageFile",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("path", models.CharField(max_length=300, unique=True)),
            ],
        ),
    ]
