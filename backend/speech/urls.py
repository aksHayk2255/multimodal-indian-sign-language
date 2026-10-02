from django.urls import path
from .views import SpeechTranscribeView, TTSView

urlpatterns = [
    path('transcribe/', SpeechTranscribeView.as_view(), name='speech-transcribe'),
    path('tts/', TTSView.as_view(), name='speech-tts'),
]
