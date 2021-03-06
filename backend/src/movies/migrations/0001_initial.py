# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-10-23 21:42
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Movie',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('original_extension', models.CharField(max_length=12, null=True)),
                ('conversion_status', models.SmallIntegerField(choices=[(0, b'not-converted'), (1, b'converting'), (2, b'conversion-failed'), (3, b'converted')], default=0)),
                ('title', models.CharField(max_length=75)),
                ('description', models.TextField(blank=True)),
                ('rating', models.DecimalField(decimal_places=2, max_digits=3, null=True)),
                ('release_year', models.CharField(blank=True, max_length=4)),
                ('tmdb_id', models.CharField(max_length=12, null=True)),
                ('season', models.SmallIntegerField(blank=True, null=True)),
                ('episode', models.SmallIntegerField(blank=True, null=True)),
                ('date_added', models.DateField(auto_now_add=True)),
                ('last_watched', models.DateField(blank=True, default=None, null=True)),
                ('stopped_at', models.PositiveIntegerField(default=0)),
            ],
        ),
    ]
