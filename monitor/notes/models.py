from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.deletion import CASCADE

from notes.constants import CHOICES, LENGTH_STR

User = get_user_model()


class Groups(models.Model):
    name = models.CharField(max_length=16)

    class Meta:
        verbose_name = 'группа'
        verbose_name_plural = 'Группы'

    def __str__(self):
        return self.name


class Tags(models.Model):
    name = models.CharField(max_length=16)
    color = models.CharField(max_length=16, choices=CHOICES)

    class Meta:
        verbose_name = 'тэг'
        verbose_name_plural = 'Тэги'

    def __str__(self):
        return self.name


class Notes(models.Model):
    theme = models.CharField(max_length=100)
    text = models.TextField()
    pub_date = models.DateTimeField("Дата публикации", auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    tags = models.ManyToManyField(Tags)
    groups = models.ForeignKey(Groups, on_delete=models.CASCADE)
    attachment = models.FileField(upload_to='notes_attachments/', blank=True, null=True)

    class Meta:
        verbose_name = 'заметка'
        verbose_name_plural = 'Заметки'

    def __str__(self):
        return self.theme[:LENGTH_STR]

