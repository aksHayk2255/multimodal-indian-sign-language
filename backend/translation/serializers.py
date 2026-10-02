from rest_framework import serializers


class TranslationRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, allow_blank=False)
    source_language = serializers.CharField(default='en', max_length=10)
    target_language = serializers.CharField(default='hi', max_length=10)
