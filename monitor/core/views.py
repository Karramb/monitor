from django.views.generic import (
    DetailView, ListView
)
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated


from core.models import SSHHost
from core.serializers import SSHHostSerializer


class SSHHostViewSet(viewsets.ModelViewSet):
    queryset = SSHHost.objects.all()
    serializer_class = SSHHostSerializer


class HostListViews(ListView):
    model = SSHHost
    ordering = ['name']
    context_object_name = 'hosts'
    template_name = 'core/host_list.html'


class HostDetailView(DetailView):
    model = SSHHost
    context_object_name = 'host'
    template_name = 'core/host_detail.html'
