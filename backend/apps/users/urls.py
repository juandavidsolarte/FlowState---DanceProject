from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('ping/', views.ping, name='ping'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/verify-email/<uuid:token>/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('auth/resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    path('auth/refresh/', views.RefreshFromCookieView.as_view(), name='refresh'),
    path('auth/me/', views.MeView.as_view(), name='me'),
]
