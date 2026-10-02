from rest_framework import serializers


class SpeechTranscribeSerializer(serializers.Serializer):
    audio_base64 = serializers.CharField(required=False, allow_blank=True)
    language = serializers.CharField(default='en', max_length=10)


class TTSSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, allow_blank=False)
    language = serializers.CharField(default='en', max_length=10)
    slow = serializers.BooleanField(default=False)
