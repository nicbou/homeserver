from django.db import models


class AccessPermissions(models.Model):
    class Meta:
        managed = False
        permissions = (
            ("torrents", "Download and manage torrents"),
            ("movies_manage", "Manage the movie library"),
        )
