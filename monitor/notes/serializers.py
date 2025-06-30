from rest_framework import serializers
from .models import Notes, Tags, Groups

class TagsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tags
        fields = ['id', 'name', 'color']

class GroupsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groups
        fields = ['id', 'name']

class NotesSerializer(serializers.ModelSerializer):
    tags = TagsSerializer(many=True)
    groups = GroupsSerializer()
    author = serializers.StringRelatedField(read_only=True)

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['author'] = user
        return super().create(validated_data)

    class Meta:
        model = Notes
        fields = ['id', 'theme', 'text', 'pub_date', 'author', 'tags', 'groups', 'attachment']
