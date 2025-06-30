from django.urls import path
from core.views import HostListViews, HostDetailView
from api.views import SSHHostListAPIView, SSHHostDetailAPIView


app_name = 'api'

urlpatterns = [
    path('hosts/', SSHHostListAPIView.as_view(), name='host-list-api'),
    path('hosts/<int:pk>/', SSHHostDetailAPIView.as_view(), name='host-detail-api'),
]
