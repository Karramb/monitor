from rest_framework import serializers

from core.models import SSHHost

class SSHHostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SSHHost
        fields = ['id', 'name', 'host', 'last_update', 'last_commit', 'commit']
