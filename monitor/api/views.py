from datetime import datetime
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import generics, mixins, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from backlog.models import Backlog, BacklogAttachment, Comment, CommentAttachment, Group, Tag
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
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=400)

        backlog = serializer.save(author=request.user)

        for file in request.FILES.getlist('attachments'):
            BacklogAttachment.objects.create(backlog=backlog, file=file)

        full_serializer = self.get_serializer(backlog)
        headers = self.get_success_headers(full_serializer.data)
        return Response(full_serializer.data, status=201, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        backlog = serializer.save()
        
        if 'attachments' in request.FILES:
            for file in request.FILES.getlist('attachments'):
                BacklogAttachment.objects.create(backlog=backlog, file=file)
        
        full_serializer = self.get_serializer(backlog)
        return Response(full_serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['delete'], url_path='attachments/(?P<attachment_id>[^/.]+)')
    def delete_attachment(self, request, pk=None, attachment_id=None):
        backlog = self.get_object()
        
        if backlog.author != request.user:
            return Response(
                {'error': 'У вас нет прав на удаление файлов из этой задачи'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        attachment = get_object_or_404(BacklogAttachment, id=attachment_id, backlog=backlog)
        
        # Удаляем файл с диска (если нужно)
        if attachment.file:
            try:
                attachment.file.delete(save=False)
            except Exception as e:
                print(f"Ошибка удаления файла: {e}")
        
        # Удаляем запись из базы данных
        attachment.delete()
        
        return Response({'message': 'Файл успешно удален'}, status=status.HTTP_200_OK)


class CommentViewSet(mixins.CreateModelMixin,
                    mixins.ListModelMixin,
                    viewsets.GenericViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, JSONParser]

    def get_queryset(self):
        return Comment.objects.filter(backlog_id=self.kwargs['backlog_id'])

    def perform_create(self, serializer):
        backlog_id = self.kwargs.get('backlog_id')
        backlog = get_object_or_404(Backlog, id=backlog_id)
        serializer.save(author=self.request.user, backlog=backlog)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)  # вызывает serializer.save с author и backlog

        comment = serializer.instance  # объект созданного комментария

        for file in request.FILES.getlist('attachments'):
            CommentAttachment.objects.create(comment=comment, file=file)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)


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
    authentication_classes = []
    permission_classes = [IsAuthenticatedOrReadOnly]


class SSHHostDetailAPIView(generics.RetrieveAPIView):
    queryset = SSHHost.objects.all()
    serializer_class = SSHHostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class GitlabWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        object_attributes = request.data.get('object_attributes', {})
        commit_sha = object_attributes.get('sha', '')[:8]
        commit_time = object_attributes.get('finished_at', '')
        if commit_sha is None or commit_time is None:
            return Response({'status': 'received (None)'})

        try:
            commit_time = datetime.strptime(commit_time, '%Y-%m-%d %H:%M:%S %Z')
        except (ValueError, TypeError) as e:
            return Response({'status': 'received (invalid date format)'})

        SSHHost.objects.all().update(
            last_commit=commit_time,
            commit=commit_sha
        )
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
