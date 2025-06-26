from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group

user = get_user_model()


@admin.register(user)
class GramUserAdmin(UserAdmin):
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
    )
    list_filter = (
        'username',
        'last_name',
    )
    search_fields = (
        'username',
        'email',
        'last_name',
    )

admin.site.unregister(Group)
