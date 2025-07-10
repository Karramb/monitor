from django.contrib.auth import get_user_model
from rest_framework import serializers

from backlog.models import Backlog, BacklogAttachment, Comment, CommentAttachment, Group, Tag
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


class CommentAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentAttachment
        fields = ['id', 'file']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    attachments = CommentAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'text', 'author', 'created_at', 'attachments']
        read_only_fields = ['author', 'created_at']
    
    def validate(self, data):
        if not data.get('text'):
            raise serializers.ValidationError("Текст обязателен")
        return data


class BacklogAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BacklogAttachment
        fields = ['id', 'file']


class BacklogSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(
        slug_field='username',
        read_only=True
    )
    groups = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all())
    comments = CommentSerializer(many=True, read_only=True)
    attachments = BacklogAttachmentSerializer(many=True, read_only=True)


    class Meta:
        model = Backlog
        fields = ['id', 'author', 'groups', 'tags', 'theme', 'text', 'status', 'attachments', 'comments', 'created_at']
    
    def get_comments(self, obj):
        comments = obj.comments.all()
        return CommentSerializer(comments, many=True).data
