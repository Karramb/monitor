from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.authentication import JWTAuthentication


from notes.models import Notes, Groups, Tags
from notes.serializers import NotesSerializer, GroupsSerializer, TagsSerializer

class NotesViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Notes.objects.all().order_by('-pub_date')
    serializer_class = NotesSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class GroupsViewSet(viewsets.ModelViewSet):
    queryset = Groups.objects.all()
    serializer_class = GroupsSerializer
    permission_classes = (IsAuthenticated,)

class TagsViewSet(viewsets.ModelViewSet):
    queryset = Tags.objects.all()
    serializer_class = TagsSerializer
    permission_classes = (IsAuthenticated,)
