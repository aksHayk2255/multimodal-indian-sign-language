from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    preferred_language_name = serializers.CharField(source='get_preferred_language_display', read_only=True)
    target_language_name = serializers.CharField(source='get_target_language_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'preferred_language',
            'preferred_language_name',
            'target_language',
            'target_language_name',
            'theme',
            'auto_speak',
            'speech_rate',
            'confidence_threshold',
            'created_at',
            'updated_at'
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    preferred_language = serializers.CharField(required=False, default='en')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'preferred_language']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        email = data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        pref_lang = validated_data.pop('preferred_language', 'en')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        if hasattr(user, 'profile'):
            user.profile.preferred_language = pref_lang
            user.profile.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
