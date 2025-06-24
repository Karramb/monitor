from django.db import models

from core.constants import LENGTH_STR


class SSHHost(models.Model):
    name = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    port = models.IntegerField(default=22)
    button_change_base = models.BooleanField()
    button_dump_pg = models.BooleanField()
    docker_base = models.CharField(max_length=100)
    docker_prod = models.CharField(max_length=100)

    class Meta:
        verbose_name = 'сервер'
        verbose_name_plural = 'Серверы'

    def __str__(self):
        return self.name[:LENGTH_STR]
