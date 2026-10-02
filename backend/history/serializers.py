from rest_framework import serializers
from .models import Conversation, ConversationMessage


class ConversationMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='get_sender_display', read_only=True)
    message_type_name = serializers.CharField(source='get_message_type_display', read_only=True)

    class Meta:
        model = ConversationMessage
        fields = [
            'id',
            'conversation',
            'sender',
            'sender_name',
            'message_type',
            'message_type_name',
            'original_text',
            'translated_text',
            'confidence',
            'audio_url',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class ConversationSerializer(serializers.ModelSerializer):
    messages = ConversationMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    mode_name = serializers.CharField(source='get_mode_display', read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id',
            'title',
            'mode',
            'mode_name',
            'source_language',
            'target_language',
            'message_count',
            'messages',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
