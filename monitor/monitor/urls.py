from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.views.generic.edit import CreateView
from django.urls import include, path, reverse_lazy

from users.forms import ArkanCustomUserCreationForm

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls', namespace='core')),
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
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
