from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.views.generic.edit import CreateView
from django.urls import include, path, reverse_lazy
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from users.forms import ArkanCustomUserCreationForm

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls', namespace='core')),
    path('notes/', include('notes.urls', namespace='notes')),
    path('auth/', include('django.contrib.auth.urls')),
    path(
        'auth/registration/', 
        CreateView.as_view(
            template_name='registration/registration_form.html',
            form_class=ArkanCustomUserCreationForm,
            success_url=reverse_lazy('login'),
        ),
        name='registration',
    ),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
