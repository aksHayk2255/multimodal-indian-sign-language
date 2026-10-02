"""
Speech and Text-to-Speech API Views.
"""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from backend.config.responses import api_success, api_error
from .serializers import SpeechTranscribeSerializer, TTSSerializer
from .services import SpeechRecognitionService, TextToSpeechService


class SpeechTranscribeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SpeechTranscribeSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                code="INVALID_PAYLOAD",
                message="Invalid transcription payload",
                details=serializer.errors,
                status_code=400
            )

        audio_file = request.FILES.get('audio')
        audio_b64 = serializer.validated_data.get('audio_base64')
        language = serializer.validated_data.get('language', 'en')

        result = SpeechRecognitionService.transcribe(
            audio_file=audio_file,
            audio_base64=audio_b64,
            language=language
        )

        return api_success(
            data=result,
            message="Audio transcribed successfully"
        )


class TTSView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TTSSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                code="INVALID_PAYLOAD",
                message="Text parameter is required for TTS synthesis.",
                details=serializer.errors,
                status_code=400
            )

        text = serializer.validated_data['text']
        language = serializer.validated_data.get('language', 'en')
        slow = serializer.validated_data.get('slow', False)

        audio_uri = TextToSpeechService.synthesize_to_base64(
            text=text,
            language=language,
            slow=slow
        )

        if not audio_uri:
            return api_error(
                code="TTS_FAILED",
                message="Text-to-speech synthesis failed",
                status_code=500
            )

        return api_success(
            data={
                "audio_url": audio_uri,
                "text": text,
                "language": language
            },
            message="TTS audio synthesized successfully"
        )
