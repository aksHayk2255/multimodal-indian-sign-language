"""
History Views.
Allows listing, viewing, filtering, creating, and deleting past conversation sessions.
"""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db.models import Q

from backend.config.responses import api_success, api_error
from .models import Conversation, ConversationMessage
from .serializers import ConversationSerializer, ConversationMessageSerializer


class ConversationListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        queryset = Conversation.objects.all()

        if user:
            queryset = queryset.filter(Q(user=user) | Q(user__isnull=True))

        # Filtering options
        mode = request.query_params.get('mode')
        search = request.query_params.get('search')

        if mode:
            queryset = queryset.filter(mode=mode)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(messages__original_text__icontains=search) |
                Q(messages__translated_text__icontains=search)
            ).distinct()

        serializer = ConversationSerializer(queryset[:50], many=True)
        return api_success(
            data={"conversations": serializer.data},
            message="Conversations retrieved"
        )

    def post(self, request):
        data = request.data.copy()
        user = request.user if request.user.is_authenticated else None

        conversation = Conversation.objects.create(
            user=user,
            title=data.get('title', 'New Conversation'),
            mode=data.get('mode', 'two_way'),
            source_language=data.get('source_language', 'en'),
            target_language=data.get('target_language', 'hi')
        )

        # If initial messages are provided
        initial_messages = data.get('messages', [])
        for msg in initial_messages:
            ConversationMessage.objects.create(
                conversation=conversation,
                sender=msg.get('sender', 'sign_user'),
                message_type=msg.get('message_type', 'text'),
                original_text=msg.get('original_text', ''),
                translated_text=msg.get('translated_text', ''),
                confidence=msg.get('confidence'),
                audio_url=msg.get('audio_url', '')
            )

        serializer = ConversationSerializer(conversation)
        return api_success(
            data=serializer.data,
            message="Conversation created",
            status_code=201
        )


class ConversationDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            conv = Conversation.objects.get(pk=pk)
        except Conversation.DoesNotExist:
            return api_error(code="NOT_FOUND", message="Conversation not found", status_code=404)

        serializer = ConversationSerializer(conv)
        return api_success(data=serializer.data, message="Conversation details retrieved")

    def delete(self, request, pk):
        try:
            conv = Conversation.objects.get(pk=pk)
            conv.delete()
            return api_success(message="Conversation deleted successfully")
        except Conversation.DoesNotExist:
            return api_error(code="NOT_FOUND", message="Conversation not found", status_code=404)
