from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotesViewSet, GroupsViewSet, TagsViewSet

app_name = 'notes'

router = DefaultRouter()
router.register(r'notes', NotesViewSet, basename='notes')
router.register(r'groups', GroupsViewSet, basename='groups')
router.register(r'tags', TagsViewSet, basename='tags')

urlpatterns = [
    path('', include(router.urls)),
]
