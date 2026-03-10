from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('ping/', views.ping, name='ping'),
]
