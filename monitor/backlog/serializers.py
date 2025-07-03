from django.contrib.auth import get_user_model
from rest_framework import serializers

from backlog.models import Backlog, Group, Tag


User = get_user_model()


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']


class BacklogSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all())
    groups = GroupSerializer()
    tags = TagSerializer(many=True)

    class Meta:
        model = Backlog
        fields = ['author', 'groups', 'tags', 'theme', 'text']
