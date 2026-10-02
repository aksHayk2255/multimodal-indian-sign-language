"""
History and Conversation Database Models.
Stores conversation sessions and granular multimodal messages
for sign users, speech users, and translations.
"""

from django.db import models
from django.contrib.auth.models import User


class Conversation(models.Model):
    MODE_CHOICES = [
        ('isl_to_speech', 'ISL to Speech'),
        ('speech_to_text', 'Speech to Text'),
        ('two_way', 'Two-Way Conversation'),
        ('multilingual', 'Multilingual Translation'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='conversations')
    title = models.CharField(max_length=255, default='New Conversation')
    mode = models.CharField(max_length=30, choices=MODE_CHOICES, default='two_way')
    source_language = models.CharField(max_length=10, default='en')
    target_language = models.CharField(max_length=10, default='hi')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.get_mode_display()}) - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class ConversationMessage(models.Model):
    SENDER_CHOICES = [
        ('sign_user', 'Sign User'),
        ('speech_user', 'Speech User'),
        ('system', 'System Assistant'),
    ]

    MESSAGE_TYPE_CHOICES = [
        ('isl_sign', 'ISL Gesture Recognition'),
        ('speech_transcript', 'Speech-to-Text Transcript'),
        ('text', 'Typed Message'),
        ('translation', 'Translated Text'),
    ]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES, default='sign_user')
    message_type = models.CharField(max_length=25, choices=MESSAGE_TYPE_CHOICES, default='text')
    original_text = models.TextField()
    translated_text = models.TextField(blank=True, default='')
    confidence = models.FloatField(null=True, blank=True)
    audio_url = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"[{self.get_sender_display()}] {self.original_text[:30]} ({self.timestamp.strftime('%H:%M:%S')})"
