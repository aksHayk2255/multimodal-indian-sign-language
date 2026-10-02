from rest_framework import serializers


class ISLPredictSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=['frame', 'sequence'], default='frame')
    features = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        allow_empty=True,
        help_text="Single frame 225-dimensional feature array"
    )
    sequence = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField()),
        required=False,
        allow_empty=True,
        help_text="Full sequence of frames (e.g. 30x225)"
    )

    def validate(self, data):
        mode = data.get('mode', 'frame')
        if mode == 'frame' and not data.get('features'):
            raise serializers.ValidationError("Field 'features' is required when mode is 'frame'.")
        if mode == 'sequence' and not data.get('sequence'):
            raise serializers.ValidationError("Field 'sequence' is required when mode is 'sequence'.")
        return data
