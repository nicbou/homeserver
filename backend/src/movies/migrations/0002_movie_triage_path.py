# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-10-24 15:11
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('movies', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='movie',
            name='triage_path',
            field=models.CharField(max_length=200, null=True),
        ),
    ]
