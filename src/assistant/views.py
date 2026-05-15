from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation
from .serializers import ConversationListSerializer, ConversationSerializer
from .services.llm_service import run_chat


class ChatView(APIView):
    """POST /assistant/api/chat/ — send a message, get a reply."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request) -> Response:
        message = request.data.get('message', '').strip()
        conversation_id = request.data.get('conversation_id')

        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

        if conversation_id:
            conversation = get_object_or_404(Conversation, pk=conversation_id, user=request.user)
        else:
            conversation = Conversation.objects.create(user=request.user)

        reply = run_chat(conversation, message, request.user.pk)

        return Response({
            'conversation_id': conversation.pk,
            'reply': reply,
        })


class ConversationListView(generics.ListAPIView):
    """GET /assistant/api/conversations/ — list user's conversations."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversationListSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)


class ConversationDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE/PATCH /assistant/api/conversations/<pk>/ — get messages, delete, or rename."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        """PATCH — update the conversation title only."""
        conversation = self.get_object()
        title = (request.data.get('title') or '').strip() or None
        conversation.title = title
        conversation.save(update_fields=['title'])
        return Response({'id': conversation.pk, 'title': conversation.title})
