from django.contrib import admin
from django.utils.html import format_html

from backlog.models import Backlog, BacklogAttachment, Comment, Group, Tag


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = (
        'name',
    )
    search_fields = (
        'name',
    )
    list_filter = (
        'name',
    )

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'color'
    )
    search_fields = (
        'name',
    )
    list_filter = (
        'name',
    )


@admin.register(BacklogAttachment)
class BacklogAttachmentAdmin(admin.ModelAdmin):
    list_display = ('backlog', 'file', 'filename')
    list_filter = ('backlog',)
    search_fields = ('backlog__theme', 'file')


@admin.register(Backlog)
class BacklogAdmin(admin.ModelAdmin):
    list_display = ('theme', 'author', 'groups', 'created_at', 'attachments_list')
    readonly_fields = ('attachments_list',)
    filter_horizontal = ('tags',)  # Для удобного выбора тегов
    
    def attachments_list(self, obj):
        attachments = obj.attachments.all()
        if not attachments:
            return "Нет вложений"
        
        links = []
        for attachment in attachments:
            try:
                url = attachment.file.url
                name = attachment.filename()
                links.append(f'<a href="{url}" target="_blank">{name}</a>')
            except ValueError:
                # Если файл не существует
                links.append(f'[Файл отсутствует: {attachment.filename()}]')
        
        return format_html("<br>".join(links))
    
    attachments_list.short_description = "Вложения"

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = (
        'text',
        'author',
        'created_at',
        'backlog'
    )
    search_fields = (
        'text',
        'author',
        'backlog'
    )
    list_filter = (
        'text',
        'author',
        'created_at',
        'backlog'
    )
