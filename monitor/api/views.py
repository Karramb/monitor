import builtins
import json
import logging
import os
import psycopg2
import redis
import requests
import time
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from psycopg2.extras import RealDictCursor
from pymongo import MongoClient
from rest_framework import generics, mixins, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from backlog.models import Backlog, BacklogAttachment, Comment, CommentAttachment, Group, Tag
from backlog.serializers import BacklogSerializer, CommentSerializer, GroupSerializer, TagSerializer
from core.models import SSHHost
from core.serializers import SSHHostSerializer
from messages_code.models import MessagesCode
from messages_code.serializers import MessagesCodeSerializer, MessagesCodeListSerializer
from users.serializers import UserRegistrationSerializer, UserSerializer

logger = logging.getLogger(__name__)


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
            return Response({'status': 'received (invalid date format)',
                             'error': e})

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


class MessagesCodeViewSet(viewsets.ModelViewSet):
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        logger.debug(f"Getting serializer for action: {self.action}")
        if self.action in ['list']:
            return MessagesCodeListSerializer
        return MessagesCodeSerializer

    def get_queryset(self):
        logger.debug(f"Getting queryset for user: {self.request.user}")
        if self.request.user.is_authenticated:
            return MessagesCode.objects.filter(user=self.request.user)
        logger.warning("Anonymous user access attempt")
        return MessagesCode.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-variables')
    def update_variables(self, request, pk=None):
        code = self.get_object()
        variables = request.data.get('variables', {})

        if not isinstance(variables, dict):
            return Response({'error': 'Variables должны быть объектом'}, status=status.HTTP_400_BAD_REQUEST)

        code.variables = variables
        code.save(update_fields=['variables'])
        code.refresh_from_db()
        print(f"After save - variables: {code.variables}")

        return Response({'status': 'success', 'variables': code.variables})

    @action(detail=True, methods=['post'], url_path='execute')
    def execute(self, request, pk=None):
        code_obj = self.get_object()

        # Для input-кодов
        if code_obj.name.startswith('input'):
            if 'template_message' not in code_obj.variables:
                raise ValidationError({"variables": "Необходим ключ 'template_message' в variables"})

            execution_globals = {
                'template_message': code_obj.variables['template_message'].copy(),
                'code_name': code_obj.name,
                '__builtins__': {
                    'print': print, 'range': range, 'int': int, 'float': float, 'str': str,
                    'bool': bool, 'globals': globals, 'round': round, 'IOError': IOError, 'open': open,
                    '__import__': __import__,
                }
            }
        # Для output-кодов (10messages)
        elif code_obj.name.startswith('10messages'):
            try:
                variables = request.data.get('variables', {})

                host_id = request.data.get('host_id')
                if not host_id:
                    raise ValidationError({"host": "Не указан хост для подключения"})
                host_obj = SSHHost.objects.filter(id=host_id).first()
                if not host_obj:
                    raise ValidationError({"host": "Host с таким id не найден"})

                input_code = request.data.get('input_code_id')
                if not input_code:
                    raise ValidationError({"input": "Не указан input-файл для обработки"})
                input_file = f"{MessagesCode.objects.get(id=input_code).name}.json"

                execution_globals = {
                    'rabbit_host': host_obj.host,
                    'input_file': input_file,
                    'variables': variables,
                    'code_name': code_obj.name,
                    '__builtins__': {
                        'print': print, 'range': range, 'int': int, 'float': float, 'str': str,
                        'bool': bool, 'globals': globals, 'round': round, 'IOError': IOError, 'open': open,
                        '__import__': __import__,
                        'json': json, 'time': time, '__build_class__': builtins.__build_class__,
                        '__name__': '__main__', 'property': property, 'ValueError': ValueError,
                        'FileNotFoundError': FileNotFoundError,
                    }
                }
            except ValidationError as e:
                print("ValidationError:", e.detail)
                raise
            except Exception as e:
                print("Unexpected error:", str(e))
                raise ValidationError({"execution": str(e)})
        else:
            raise ValidationError({"code": "Неизвестный тип кода"})

        try:
            exec(code_obj.code, execution_globals)
            code_obj.output = "Код выполнен успешно"
            code_obj.error = None
        except Exception as e:
            code_obj.error = f"Ошибка выполнения: {str(e)}"
            code_obj.output = None
            code_obj.save()
            raise ValidationError({"execution": str(e)})

        code_obj.save()
        return Response({"status": "success", "output": code_obj.output})


class CheckIdent(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        ident = request.data.get('ident')
        if not ident:
            return Response({'error': 'Ident is required'}, status=400)
        protocol = request.data.get('protocol')
        time_range = request.data.get('time_range', '1h')
        custom_start = request.data.get('custom_start')
        custom_end = request.data.get('custom_end')

        try:
            # Определяем временной диапазон
            if time_range == 'custom' and custom_start and custom_end:
                start_time = datetime.fromisoformat(custom_start.replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(custom_end.replace('Z', '+00:00'))
            else:
                hours = self.parse_time_range(time_range)
                end_time = datetime.now()
                start_time = end_time - timedelta(hours=hours)

            logs = self.query_loki_logs(ident, protocol, start_time, end_time)
            mongo_data = self.query_mongodb(ident, start_time, end_time)
            postgres_data = self.query_postgresql(ident)
            redis_data = self.query_redis(ident)

            return Response({
                'success': True,
                'ident': ident,
                'protocol': protocol,
                'time_range': time_range,
                'logs': logs['protocol'],
                'consumer_data': logs['consumer'],
                'mongo_data': mongo_data,
                'postgres_data': postgres_data,
                'redis_data': redis_data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Ошибка: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def parse_time_range(self, time_range):
        """Преобразует строку времени в часы"""
        time_map = {
            '5m': 5/60,
            '15m': 15/60,
            '30m': 30/60,
            '1h': 1,
            '6h': 6,
            '12h': 12,
            '1d': 24,
            '2d': 48,
            '1w': 168
        }
        return time_map.get(time_range, 1)

    def query_loki_logs(self, ident, protocol, start_time, end_time):
        """Поиск в Loki - возвращает логи протокола и консьюмера отдельно"""

        def fetch_logs(app_name):
            query = f'{{app="{app_name}"}} |= "{ident}"'

            params = {
                'query': query,
                'limit': 1,
                'start': int(start_time.timestamp() * 1_000_000_000),
                'end': int(end_time.timestamp() * 1_000_000_000),
                'direction': 'backward'
            }

            response = requests.get(
                f'{os.getenv("LOKI_URL")}/loki/api/v1/query_range',
                params=params,
                timeout=30
            )

            response.raise_for_status()
            data = response.json()

            logs = []
            for result in data.get('data', {}).get('result', []):
                stream_labels = result.get('stream', {})
                for value in result.get('values', []):
                    timestamp_ns = int(value[0])
                    timestamp = datetime.fromtimestamp(timestamp_ns / 1_000_000_000)

                    logs.append({
                        'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3],
                        'timestamp_iso': timestamp.isoformat(),
                        'message': value[1],
                        'pod': stream_labels.get('pod', ''),
                        'app': stream_labels.get('app', ''),
                        'namespace': stream_labels.get('namespace', '')
                    })

            return logs

        # Получаем логи из двух источников
        protocol_logs = fetch_logs(protocol)
        consumer_logs = fetch_logs('consumer')

        return {
            'protocol': protocol_logs,
            'consumer': consumer_logs
        }

    def query_mongodb(self, ident, start_time, end_time):
        """Поиск в MongoDB"""
        try:
            client = MongoClient(os.getenv('MONGO_URI'))
            db = client['db']
            collection = db['messages']

            start_timestamp = int(start_time.timestamp())
            end_timestamp = int(end_time.timestamp())

            print(f"Ищем ident: {ident}")
            print(f"Период: {start_timestamp} - {end_timestamp}")

            query = {
                'ident': ident,
                'timestamp': {
                    '$gte': start_timestamp,
                    '$lte': end_timestamp
                }
            }

            results = list(collection.find(query).sort('timestamp', -1).limit(1))

            # Преобразуем для JSON
            processed_results = []
            for doc in results:
                # Создаем копию для отображения
                display_doc = doc.copy()

                # Преобразуем _id, т.к. у Монго свой тип ObjectId для этого поля
                if '_id' in display_doc:
                    display_doc['_id'] = str(display_doc['_id'])

                # Добавляем читаемую дату как отдельное поле только для display
                readable_date = None
                if 'timestamp' in doc and isinstance(doc['timestamp'], (int, float)):
                    timestamp_dt = datetime.fromtimestamp(doc['timestamp'])
                    readable_date = timestamp_dt.strftime('%Y-%m-%d %H:%M:%S')

                # Преобразуем остальные datetime объекты, чтобы не было проблем с сериализзацией
                for key, value in list(display_doc.items()):
                    if isinstance(value, datetime):
                        display_doc[key] = value.isoformat()

                processed_results.append({
                    'data': display_doc,
                    'timestamp_readable': readable_date
                })

            client.close()
            return processed_results

        except Exception as e:
            print(f"Ошибка MongoDB: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def query_postgresql(self, ident):
        """Поиск в PostgreSQL"""
        try:
            conn = psycopg2.connect(os.getenv('POSTGRES_URI'))
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT * FROM units 
                WHERE unique_id = %s 
                AND deleted = false
                ORDER BY updated_at DESC
                LIMIT 1
            """

            cursor.execute(query, (ident,))
            result = cursor.fetchone()

            if not result:
                cursor.close()
                conn.close()
                return []

            row_dict = dict(result)

            # ЭТО НУЖНО - иначе Django не сможет вернуть Response
            for key, value in row_dict.items():
                if isinstance(value, datetime):
                    row_dict[key] = value.isoformat()

            cursor.close()
            conn.close()

            return [{
                'data': row_dict,
                'unit_name': row_dict.get('name', 'Не указано')
            }]

        except Exception as e:
            print(f"Ошибка PostgreSQL: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def query_redis(self, ident):
        """Поиск в Redis"""
        try:
            # Подключение к Redis
            redis_url = os.getenv('REDIS_URL', 'redis://172.20.0.124:6379/0')
            r = redis.from_url(redis_url, decode_responses=True)

            # Проверяем оба варианта ключей (приоритет у last_message)
            keys_to_check = [
                f'last_message_{ident}',
                ident
            ]

            data_dict = None
            found_key = None

            for key in keys_to_check:
                data = r.get(key)
                if data:
                    found_key = key
                    data_dict = json.loads(data)
                    break

            if not data_dict:
                print(f"Redis: данные для {ident} не найдены")
                return []

            print(f"Redis: найдены данные по ключу {found_key}")

            # Конвертируем timestamp в читаемый формат
            readable_date = None
            if 'timestamp' in data_dict and isinstance(data_dict['timestamp'], (int, float)):
                timestamp_dt = datetime.fromtimestamp(data_dict['timestamp'])
                readable_date = timestamp_dt.strftime('%Y-%m-%d %H:%M:%S')

            return [{
                'data': data_dict,
                'timestamp_readable': readable_date or 'Нет данных о времени',
                'redis_key': found_key
            }]

        except redis.ConnectionError as e:
            print(f"Ошибка подключения к Redis: {e}")
            return []
        except Exception as e:
            print(f"Ошибка Redis: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
