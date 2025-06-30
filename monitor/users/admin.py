from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from django.utils.safestring import mark_safe

user = get_user_model()


@admin.register(user)
class GramUserAdmin(UserAdmin):
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'mini_image'
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

    @admin.display(description='Аватар')
    def mini_image(self, obj):
        return mark_safe(f'<img src={obj.image.url} width="80" height="60">')

admin.site.unregister(Group)
