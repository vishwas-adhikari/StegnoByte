# backend/core/urls.py

from django.urls import path
from .views import EncodeAPIView, DecodeAPIView

urlpatterns = [
    path('encode/', EncodeAPIView.as_view(), name='encode'),
    path('decode/', DecodeAPIView.as_view(), name='decode'),
]