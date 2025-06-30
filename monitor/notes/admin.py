from django.contrib import admin

from notes.models import Groups, Notes, Tags


@admin.register(Groups)
class GroupsAdmin(admin.ModelAdmin):
    list_display = (
        'name',
    )
    search_fields = (
        'name',
    )
    list_filter = (
        'name',
    )


@admin.register(Notes)
class NotesAdmin(admin.ModelAdmin):
    fields = ('theme', 'text', 'author', 'groups', 'tags', 'attachment')
    filter_horizontal = ('tags',)
    list_display = (
        'theme',
        'pub_date',
        'author',
        'get_tags',
        'groups'
    )
    search_fields = (
        'theme',
        'pub_date',
        'author__username',
        'groups'
    )
    list_filter = (
        'theme',
        'pub_date',
        'author__username',
        'groups'
    )

    @admin.display(description='Тэги')
    def get_tags(self, obj):
        return ',\n'.join(str(p) for p in obj.tags.all())


@admin.register(Tags)
class TagsAdmin(admin.ModelAdmin):
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
