from django.urls import path

def get_ws_urlpatterns():
    from core.consumers import MonitorConsumer
    return [
        path('ws/core/<int:host_id>/', MonitorConsumer.as_asgi()),
    ]