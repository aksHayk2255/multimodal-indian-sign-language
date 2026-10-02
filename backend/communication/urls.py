from django.urls import path
from .views import SendCommunicationMessageView

urlpatterns = [
    path('send/', SendCommunicationMessageView.as_view(), name='communication-send'),
]
