from django.contrib.auth import get_user_model
from rest_framework import serializers

from backlog.models import Backlog, Comment, Group, Tag
from users.serializers import UserSerializer


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
        fields = ['id', 'author', 'groups', 'tags', 'theme', 'text', 'status']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer()
    
    class Meta:
        model = Comment
        fields = ['id', 'text', 'author', 'created_at']
