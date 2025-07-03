from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.views.generic import TemplateView
from django.urls import include, path, re_path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls', namespace='api')),
    
    # Статика должна обрабатываться ДО catch-all маршрута
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) \
  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all маршрут должен быть ПОСЛЕДНИМ
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]