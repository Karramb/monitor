from django.contrib.auth import get_user_model
from django.db import models

from backlog.constants import CHOICES, MAX_LEN_STR_DEF


User = get_user_model()


class Tag(models.Model):
    name = models.CharField(max_length=16)
    color = models.CharField(max_length=16, choices=CHOICES)

    class Meta:
        ordering = ('name',)
        verbose_name = 'тег'
        verbose_name_plural = 'Теги'

    def __str__(self):
        return self.name[:MAX_LEN_STR_DEF]


class Group(models.Model):
    name = models.CharField(max_length=16)

    class Meta:
        ordering = ('name',)
        verbose_name = 'группа'
        verbose_name_plural = 'Группы'

    def __str__(self):
        return self.name[:MAX_LEN_STR_DEF]


class Backlog(models.Model):
    theme = models.CharField(max_length=100)
    text = models.TextField()
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='backlog',
        verbose_name='Автор'
    )
    groups = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        verbose_name='Группа'
    )
    tags = models.ManyToManyField(
        Tag, verbose_name='Тег'
    )

    class Meta:
        ordering = ('theme',)
        verbose_name = 'бэклог'
        verbose_name_plural = 'Бэклог'

    def __str__(self):
        return self.theme[:MAX_LEN_STR_DEF]