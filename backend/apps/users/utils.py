from datetime import timedelta
import json
import urllib.error
import urllib.parse
import urllib.request
import uuid

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone


VERIFICATION_EXPIRY_HOURS = 24
TEST_RECAPTCHA_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'


def generate_verification_token():
    return uuid.uuid4()


def verification_token_is_expired(user):
    if not user.verification_token_created_at:
        return True
    return timezone.now() - user.verification_token_created_at > timedelta(hours=VERIFICATION_EXPIRY_HOURS)


def verify_recaptcha(token, remote_ip=None):

    secret = getattr(settings, 'RECAPTCHA_SECRET', '').strip()

    print("========== RECAPTCHA ==========")
    print("DEBUG:", settings.DEBUG)
    print("TOKEN:", token)
    print("SECRET:", secret[:10] + "..." if secret else "VACÍA")
    print("===============================")

    if settings.DEBUG and secret in {'', TEST_RECAPTCHA_SECRET}:
        print("Entró al modo DEBUG")
        return bool(token)

    payload = {
        'secret': secret,
        'response': token,
    }

    if remote_ip:
        payload['remoteip'] = remote_ip

    data = urllib.parse.urlencode(payload).encode('utf-8')

    request = urllib.request.Request(
        'https://www.google.com/recaptcha/api/siteverify',
        data=data,
        method='POST',
    )

    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            result = json.loads(response.read().decode('utf-8'))

            print("Respuesta Google:")
            print(result)

    except (urllib.error.URLError, ValueError) as e:
        print("ERROR RECAPTCHA:", e)
        return False

    return bool(result.get('success'))


def send_verification_email(user):
    verification_link = f"{settings.FRONTEND_URL.rstrip('/')}/verificar-email/{user.verification_token}"
    context = {
        'user': user,
        'verification_link': verification_link,
        'expiry_hours': VERIFICATION_EXPIRY_HOURS,
        'brand_name': 'Flowstate',
    }

    subject = 'Verifica tu correo de Flowstate'
    text_message = render_to_string('emails/verification_email.txt', context)
    html_message = render_to_string('emails/verification_email.html', context)

    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )