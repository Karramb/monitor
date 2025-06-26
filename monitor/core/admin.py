from django.contrib import admin

from core.models import SSHHost


@admin.register(SSHHost)
class SSHHostAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'host',
        'port',
    )
    search_fields = (
        'name',
        'host'
    )
    list_filter = (
        'name',
        'host'
    )
