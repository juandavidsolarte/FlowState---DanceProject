from django.urls import path
from . import views

app_name = 'catalog'

urlpatterns = [
    path('ping/', views.ping, name='ping'),
]
