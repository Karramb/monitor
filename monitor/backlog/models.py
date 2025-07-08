from django.contrib.auth import get_user_model
from django.db import models

from backlog.constants import CHOICES_TAG, CHOICES_STATUS, MAX_LEN_STR_DEF


User = get_user_model()


class Tag(models.Model):
    name = models.CharField(max_length=16)
    color = models.CharField(max_length=16, choices=CHOICES_TAG)

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
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=16, choices=CHOICES_STATUS)
    text = models.TextField()
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tasks',
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
        ordering = ('id',)
        verbose_name = 'бэклог'
        verbose_name_plural = 'Бэклог'

    def __str__(self):
        return self.theme[:MAX_LEN_STR_DEF]


class BacklogAttachment(models.Model):
    backlog = models.ForeignKey(
        Backlog, related_name='attachments', on_delete=models.CASCADE
    )
    file = models.FileField(upload_to='backlog_attachments/')

    class Meta:
        ordering = ('id',)
        verbose_name = 'вложения к задачам'
        verbose_name_plural = 'Вложения к задачам'

    def __str__(self):
        return self.file.name.split('/')[-1]  # Показываем только имя файла

    def filename(self):
        return self.file.name.split('/')[-1]


class Comment(models.Model):
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Автор'
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    backlog = models.ForeignKey(
        Backlog,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Задача'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'комментарий'
        verbose_name_plural = 'Комментарии'

    def __str__(self):
        return self.text[:MAX_LEN_STR_DEF]


class CommentAttachment(models.Model):
    comment = models.ForeignKey(
        Comment, related_name='attachments', on_delete=models.CASCADE
    )
    file = models.FileField(upload_to='comment_attachments/')

    class Meta:
        ordering = ('id',)
        verbose_name = 'вложения к комментариям'
        verbose_name_plural = 'Вложения к комментариям'

    def __str__(self):
        return self.file.name.split('/')[-1]  # Показываем только имя файла

    def filename(self):
        return self.file.name.split('/')[-1]
