from django.urls import path
from core.consumers import MonitorConsumer

ws_urlpatterns = [
    path('ws/core/<int:host_id>/', MonitorConsumer.as_asgi()),
]
