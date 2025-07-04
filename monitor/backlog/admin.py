from django.contrib import admin

from backlog.models import Backlog, Comment, Group, Tag


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

@admin.register(Backlog)
class BacklogAdmin(admin.ModelAdmin):
    list_display = (
        'theme',
        'author',
        'groups',
    )
    search_fields = (
        'theme',
        'author',
    )
    list_filter = (
        'theme',
        'author',
    )

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
