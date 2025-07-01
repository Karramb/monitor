from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import SSHHost
from core.serializers import SSHHostSerializer

class SSHHostListAPIView(generics.ListAPIView):
    queryset = SSHHost.objects.all()
    serializer_class = SSHHostSerializer
    permission_classes = [AllowAny]


class SSHHostDetailAPIView(generics.RetrieveAPIView):
    queryset = SSHHost.objects.all()
    serializer_class = SSHHostSerializer


class GitlabWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        print(request.data)
        return Response({'status': 'received'})


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfTokenView(APIView):
    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]  # Чтобы DRF не пытался рендерить HTML

    def get(self, request, *args, **kwargs):
        return Response({'detail': 'CSRF cookie set'})
