from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class MessagesCode(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    code = models.TextField(verbose_name="Код")
    variables = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Переменные для подстановки"
    )
    output = models.TextField(blank=True, null=True, verbose_name="Вывод программы")
    error = models.TextField(blank=True, null=True, verbose_name="Ошибки выполнения")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        ordering = ('id',)
        verbose_name = 'код сообщений'
        verbose_name_plural = 'Код сообщений'

    def __str__(self):
        return f"Code by {self.user.username} ({self.created_at})"
