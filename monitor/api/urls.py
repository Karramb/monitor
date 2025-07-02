from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView
from api.views import CsrfTokenView, GitlabWebhookView, SSHHostListAPIView, SSHHostDetailAPIView


app_name = 'api'

urlpatterns = [
    path('hosts/', SSHHostListAPIView.as_view(), name='host-list-api'),
    path('hosts/<int:pk>/', SSHHostDetailAPIView.as_view(), name='host-detail-api'),
    path('gitlab/hosts/commit/', GitlabWebhookView.as_view(), name='gitlab-commit'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/csrf/', CsrfTokenView.as_view(), name='csrf-token'),
]
