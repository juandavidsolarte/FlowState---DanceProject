from django.urls import path
from . import views

app_name = 'sales'

urlpatterns = [
    path('ping/', views.ping, name='ping'),
]
