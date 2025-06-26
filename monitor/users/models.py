from django.contrib.auth.models import AbstractUser
from django.db import models

from users.constants import MAX_LENGTH_FOR_EMAIL, MAX_LENGTH_FOR_FIELDS
from users.validators import validate_username


class ArkanUser(AbstractUser):
    username = models.CharField(
        max_length=MAX_LENGTH_FOR_FIELDS,
        unique=True,
        validators=(validate_username,),
        verbose_name='Никнейм'
    )
    email = models.EmailField(
        max_length=MAX_LENGTH_FOR_EMAIL,
        unique=True,
        verbose_name='email'
    )
    first_name = models.CharField(
        max_length=MAX_LENGTH_FOR_FIELDS,
        verbose_name='Имя'
    )
    last_name = models.CharField(
        max_length=MAX_LENGTH_FOR_FIELDS,
        verbose_name='Фамилия'
    )
    avatar = models.ImageField(
        blank=True,
        null=True,
        verbose_name='Фото профиля',
        upload_to='media/users_avatars/'
    )

    class Meta:
        ordering = ('username',)
        verbose_name = 'пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.username
