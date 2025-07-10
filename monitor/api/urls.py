from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.routers import DefaultRouter
from api.views import (
    BacklogViewSet,
    CommentViewSet,
    CsrfTokenView, 
    GitlabWebhookView, 
    RegistrationAPIView, 
    SSHHostListAPIView, 
    SSHHostDetailAPIView,
    GroupViewSet,
    TagViewSet,
    current_user
)

router = DefaultRouter()
router.register(r'backlog', BacklogViewSet, basename='backlog')
router.register(
    r'backlog/(?P<backlog_id>\d+)/comments',
    CommentViewSet,
    basename='comments'
)
router.register(r'groups', GroupViewSet, basename='groups')
router.register(r'tags', TagViewSet, basename='tags')

app_name = 'api'

urlpatterns = [
    path('hosts/', SSHHostListAPIView.as_view(), name='host-list-api'),
    path('hosts/<int:pk>/', SSHHostDetailAPIView.as_view(), name='host-detail-api'),
    path('gitlab/hosts/commit/', GitlabWebhookView.as_view(), name='gitlab-commit'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/csrf/', CsrfTokenView.as_view(), name='csrf-token'),
    path('auth/registration/', RegistrationAPIView.as_view(), name='api-registration'),
    path('users/me/', current_user),
    path('', include(router.urls)),
]
