# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-11-23 09:29
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('movies', '0006_auto_20171114_2015'),
    ]

    operations = [
        migrations.CreateModel(
            name='MovieWatchStatus',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stopped_at', models.PositiveIntegerField(default=0)),
                ('last_watched', models.DateField(blank=True, default=None, null=True)),
            ],
        ),
        migrations.RemoveField(
            model_name='movie',
            name='last_watched',
        ),
        migrations.RemoveField(
            model_name='movie',
            name='stopped_at',
        ),
        migrations.AddField(
            model_name='moviewatchstatus',
            name='movie',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='movies.Movie'),
        ),
        migrations.AddField(
            model_name='moviewatchstatus',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='moviewatchstatus',
            unique_together=set([('movie', 'user')]),
        ),
    ]