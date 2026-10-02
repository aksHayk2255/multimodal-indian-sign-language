from django.urls import path
from .views import ISLPredictView, ISLStatusView, ISLClearSentenceView

urlpatterns = [
    path('predict/', ISLPredictView.as_view(), name='isl-predict'),
    path('status/', ISLStatusView.as_view(), name='isl-status'),
    path('clear/', ISLClearSentenceView.as_view(), name='isl-clear'),
]
