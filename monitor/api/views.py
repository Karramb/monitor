from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import generics, mixins, serializers, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from backlog.models import Backlog, Comment, Group, Tag
from backlog.serializers import BacklogSerializer, CommentSerializer, GroupSerializer, TagSerializer
from core.models import SSHHost
from core.serializers import SSHHostSerializer
from users.serializers import UserRegistrationSerializer, UserSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class BacklogViewSet(viewsets.ModelViewSet):
    queryset = Backlog.objects.all()
    serializer_class = BacklogSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def create(self, request, *args, **kwargs):
        print("User in create:", request.user)
        print("Is authenticated:", request.user.is_authenticated)
        print("Auth:", request.auth)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=400)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)


class CommentViewSet(mixins.CreateModelMixin,
                    mixins.ListModelMixin,
                    viewsets.GenericViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, JSONParser]

    def get_queryset(self):
        return Comment.objects.filter(backlog_id=self.kwargs['backlog_id'])

    def perform_create(self, serializer):
        print("Полученные данные:", serializer.validated_data)
        serializer.save(author=self.request.user, backlog_id=self.kwargs['backlog_id'])


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


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


class RegistrationAPIView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                {
                    "status": "success",
                    "message": "User registered successfully",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except serializers.ValidationError as e:
            return Response(
                {
                    "status": "error",
                    "errors": e.detail
                },
                status=status.HTTP_400_BAD_REQUEST
            )
