"""
Account and User Profile Models for Multimodal ISL Assistant.
"""

from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('ml', 'Malayalam'),
        ('ta', 'Tamil'),
        ('te', 'Telugu'),
        ('kn', 'Kannada'),
    ]

    THEME_CHOICES = [
        ('dark', 'Dark Contrast (Accessible)'),
        ('light', 'Light Mode'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    preferred_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    target_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='hi')
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='dark')
    auto_speak = models.BooleanField(default=True, help_text="Automatically vocalize recognized signs via TTS")
    speech_rate = models.FloatField(default=1.0)
    confidence_threshold = models.FloatField(default=0.75, help_text="Minimum confidence for sign emission")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_preferred_language_display()})"
