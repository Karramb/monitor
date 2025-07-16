from django.contrib.auth import get_user_model
from rest_framework import serializers

from messages_code.models import MessagesCode
from users.serializers import UserSerializer


class MessagesCodeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = MessagesCode
        fields = ['id', 'user', 'name', 'code', 'variables', 'created_at', 'updated_at', 'output', 'error']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_variables(self, value):
        """Проверяем, что variables - это словарь"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Variables must be a JSON object")
        return value


class MessagesCodeListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = MessagesCode
        fields = ['id', 'name', 'user', 'created_at', 'updated_at']

