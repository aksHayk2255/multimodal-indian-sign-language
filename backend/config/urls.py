"""
Root URL Configuration for Multimodal ISL Assistant.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from backend.config.responses import api_success

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return api_success(
        data={
            "service": "AI-Powered Multimodal Indian Sign Language Assistant API",
            "version": "1.0.0",
            "endpoints": {
                "auth": "/api/auth/",
                "sign_language": "/api/sign-language/",
                "speech": "/api/speech/",
                "translation": "/api/translate/",
                "tts": "/api/speech/tts/",
                "history": "/api/history/",
                "settings": "/api/settings/",
                "communication": "/api/communication/"
            }
        },
        message="Multimodal ISL API is operational"
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/auth/', include('accounts.urls')),
    path('api/sign-language/', include('sign_language.urls')),
    path('api/speech/', include('speech.urls')),
    path('api/translate/', include('translation.urls')),
    path('api/history/', include('history.urls')),
    path('api/settings/', include('accounts.settings_urls')),
    path('api/communication/', include('communication.urls')),
]
