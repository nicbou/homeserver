# Generated by Django 3.0.1 on 2019-12-23 16:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('movies', '0007_auto_20171123_0929'),
    ]

    operations = [
        migrations.AlterField(
            model_name='movie',
            name='conversion_status',
            field=models.SmallIntegerField(choices=[(0, 'not-converted'), (1, 'converting'), (2, 'conversion-failed'), (3, 'converted')], default=0),
        ),
        migrations.AlterField(
            model_name='movie',
            name='media_type',
            field=models.SmallIntegerField(choices=[(1, 'tv'), (2, 'movie'), (2, 'conversion-failed'), (3, 'converted')], default=2),
        ),
    ]
