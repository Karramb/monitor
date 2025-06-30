from rest_framework import generics
from core.models import SSHHost
from core.serializers import SSHHostSerializer

class SSHHostListAPIView(generics.ListAPIView):
    queryset = SSHHost.objects.all()
    serializer_class = SSHHostSerializer

class SSHHostDetailAPIView(generics.RetrieveAPIView):
    queryset = SSHHost.objects.all()
    serializer_class = SSHHostSerializer
