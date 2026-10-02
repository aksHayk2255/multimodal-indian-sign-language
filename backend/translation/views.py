"""
Translation Views.
Provides text translation between English and Indian languages,
and enumerates supported languages.
"""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from backend.config.responses import api_success, api_error
from .serializers import TranslationRequestSerializer
from .services import TranslationService


class TranslateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TranslationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                code="INVALID_PAYLOAD",
                message="Text and valid language parameters are required.",
                details=serializer.errors,
                status_code=400
            )

        text = serializer.validated_data['text']
        source = serializer.validated_data.get('source_language', 'en')
        target = serializer.validated_data.get('target_language', 'hi')

        result = TranslationService.translate(
            text=text,
            source_language=source,
            target_language=target
        )

        return api_success(
            data=result,
            message="Translation completed"
        )


class SupportedLanguagesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        languages = TranslationService.get_supported_languages()
        return api_success(
            data={"languages": languages},
            message="Supported languages retrieved"
        )
