from django.db import models

from core.constants import LENGTH_STR


class SSHHost(models.Model):
    name = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    port = models.IntegerField(default=22)
    button_change_base = models.BooleanField(default=False)
    button_dump_pg = models.BooleanField(default=False)
    docker_base = models.CharField(max_length=100)
    docker_prod = models.CharField(max_length=100)
    button_fast_pull = models.BooleanField(default=False)
    button_pull_reload = models.BooleanField(default=False)
    last_update = models.DateTimeField(null=True, blank=True)
    last_commit = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'сервер'
        verbose_name_plural = 'Серверы'

    def __str__(self):
        return self.name[:LENGTH_STR]
