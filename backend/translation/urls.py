from django.urls import path
from .views import TranslateView, SupportedLanguagesView

urlpatterns = [
    path('', TranslateView.as_view(), name='translate-text'),
    path('languages/', SupportedLanguagesView.as_view(), name='supported-languages'),
]
