from django.urls import path
from core.views import HostListViews, HostDetailView

app_name = 'core'

urlpatterns = [
    path('', HostListViews.as_view(), name='host-list'),
    path('hosts/<int:pk>/', HostDetailView.as_view(), name='host-detail'),
]
