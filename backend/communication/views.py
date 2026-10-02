"""
Integrated Communication Views.
Orchestrates two-way turns between sign user and speech user:
Input text/sign -> Translation -> TTS -> Persistence in Conversation history.
"""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from backend.config.responses import api_success, api_error
from history.models import Conversation, ConversationMessage
from history.serializers import ConversationMessageSerializer
from translation.services import TranslationService
from speech.services import TextToSpeechService


class SendCommunicationMessageView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        conversation_id = data.get('conversation_id')
        sender = data.get('sender', 'sign_user')
        message_type = data.get('message_type', 'isl_sign' if sender == 'sign_user' else 'speech_transcript')
        original_text = data.get('original_text', '').strip()
        confidence = data.get('confidence')
        source_lang = data.get('source_language', 'en')
        target_lang = data.get('target_language', 'hi')

        if not original_text:
            return api_error(code="EMPTY_MESSAGE", message="Message text cannot be empty.", status_code=400)

        # Retrieve or create conversation session
        conversation = None
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                pass

        if not conversation:
            user = request.user if request.user.is_authenticated else None
            title = f"Chat: {original_text[:25]}"
            conversation = Conversation.objects.create(
                user=user,
                title=title,
                mode='two_way',
                source_language=source_lang,
                target_language=target_lang
            )

        # 1. Multilingual translation
        translation_res = TranslationService.translate(
            text=original_text,
            source_language=source_lang,
            target_language=target_lang
        )
        translated_text = translation_res.get("translated_text", "")

        # 2. Text to Speech generation for the recipient
        # For sign user: speak the translated (or original) text out loud for the hearing person
        # For speech user: provide TTS for hearing impaired / audio verification
        tts_text_to_speak = translated_text if translated_text else original_text
        tts_lang = target_lang if translated_text else source_lang
        audio_url = TextToSpeechService.synthesize_to_base64(tts_text_to_speak, language=tts_lang) or ""

        # 3. Store message
        msg = ConversationMessage.objects.create(
            conversation=conversation,
            sender=sender,
            message_type=message_type,
            original_text=original_text,
            translated_text=translated_text,
            confidence=confidence,
            audio_url=audio_url
        )

        return api_success(
            data={
                "conversation_id": conversation.id,
                "message": ConversationMessageSerializer(msg).data
            },
            message="Message transmitted and saved"
        )
