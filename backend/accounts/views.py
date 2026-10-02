"""
Authentication and Profile API Views.
Supports Token-based login, registration, logout, profile update, and settings.
"""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from backend.config.responses import api_success, api_error
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserProfileSerializer
)
from .models import UserProfile


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return api_success(
                data={
                    "token": token.key,
                    "user": UserSerializer(user).data
                },
                message="User registered successfully",
                status_code=201
            )
        return api_error(
            code="REGISTRATION_FAILED",
            message="Registration validation failed",
            details=serializer.errors,
            status_code=400
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                code="INVALID_DATA",
                message="Username and password are required.",
                details=serializer.errors,
                status_code=400
            )

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        # Support login with either username or email
        user = authenticate(username=username, password=password)
        if not user:
            # Check if email was provided as username
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if not user:
            return api_error(
                code="INVALID_CREDENTIALS",
                message="Invalid username or password.",
                status_code=401
            )

        token, _ = Token.objects.get_or_create(user=user)
        return api_success(
            data={
                "token": token.key,
                "user": UserSerializer(user).data
            },
            message="Login successful"
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return api_success(message="Logged out successfully")


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return api_success(
            data=UserSerializer(request.user).data,
            message="Profile fetched successfully"
        )

    def put(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        first_name = request.data.get('first_name', user.first_name)
        last_name = request.data.get('last_name', user.last_name)
        user.first_name = first_name
        user.last_name = last_name
        user.save()

        profile_serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if profile_serializer.is_valid():
            profile_serializer.save()
            return api_success(
                data=UserSerializer(user).data,
                message="Profile updated successfully"
            )

        return api_error(
            code="UPDATE_FAILED",
            message="Failed to update profile",
            details=profile_serializer.errors,
            status_code=400
        )


class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return api_success(
            data=UserProfileSerializer(profile).data,
            message="User settings retrieved"
        )

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return api_success(
                data=serializer.data,
                message="User settings updated successfully"
            )
        return api_error(
            code="SETTINGS_UPDATE_FAILED",
            message="Failed to update settings",
            details=serializer.errors,
            status_code=400
        )
