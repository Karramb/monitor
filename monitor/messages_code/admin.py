from django.contrib import admin

from messages_code.models import MessagesCode


@admin.register(MessagesCode)
class MessagesCodeAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'user',
        'output',
        'error',
        'created_at',
        'updated_at'
    )
    search_fields = (
        'name',
        'user'
    )
    list_filter = (
        'name',
        'user'
    )
