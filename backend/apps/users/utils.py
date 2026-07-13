import json
import secrets
import string
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

VERIFICATION_EXPIRY_HOURS = 24
TEST_RECAPTCHA_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"

# Símbolos seguros para contraseñas — evitamos caracteres que
# algunos formularios o sistemas escapan mal (`, \, ", ')
_PASSWORD_SYMBOLS = "!@#$%^&*"


def generate_temp_password(length: int = 12) -> str:
    """
    Genera una contraseña temporal criptográficamente segura.

    Usa el módulo secrets (respaldado por os.urandom) en lugar de
    random, que no es apto para credenciales de seguridad. Garantiza
    que el resultado siempre incluya al menos una mayúscula, una
    minúscula, un número y un símbolo, cumpliendo los requisitos
    de seguridad del sistema.

    Args:
        length (int): longitud total de la contraseña. Mínimo 12
            para garantizar entropía suficiente.

    Returns:
        str: contraseña temporal en texto plano, lista para enviarse
            al usuario. Solo se expone una vez — en BD se guarda
            únicamente el hash.
    """
    # Garantizamos al menos un carácter de cada categoría requerida
    required = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(_PASSWORD_SYMBOLS),
    ]

    all_chars = string.ascii_letters + string.digits + _PASSWORD_SYMBOLS
    # Completamos la longitud restante con caracteres aleatorios
    rest = [secrets.choice(all_chars) for _ in range(length - len(required))]

    password = required + rest

    # SystemRandom es criptográficamente seguro — evita que los chars
    # requeridos siempre caigan en posiciones predecibles (ej: siempre
    # el primero es mayúscula), lo que reduciría la entropía real.
    secrets.SystemRandom().shuffle(password)

    return "".join(password)


def generate_verification_token():
    return uuid.uuid4()


def verification_token_is_expired(user):
    if not user.verification_token_created_at:
        return True
    return timezone.now() - user.verification_token_created_at > timedelta(
        hours=VERIFICATION_EXPIRY_HOURS
    )


def verify_recaptcha(token, remote_ip=None):

    secret = getattr(settings, "RECAPTCHA_SECRET", "").strip()

    print("========== RECAPTCHA ==========")
    print("DEBUG:", settings.DEBUG)
    print("TOKEN:", token)
    print("SECRET:", secret[:10] + "..." if secret else "VACÍA")
    print("===============================")

    if settings.DEBUG and secret in {"", TEST_RECAPTCHA_SECRET}:
        print("Entró al modo DEBUG")
        return bool(token)

    payload = {
        "secret": secret,
        "response": token,
    }

    if remote_ip:
        payload["remoteip"] = remote_ip

    data = urllib.parse.urlencode(payload).encode("utf-8")

    request = urllib.request.Request(
        "https://www.google.com/recaptcha/api/siteverify",
        data=data,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))

            print("Respuesta Google:")
            print(result)

    except (urllib.error.URLError, ValueError) as e:
        print("ERROR RECAPTCHA:", e)
        return False

    return bool(result.get("success"))


def send_verification_email(user):
    verification_link = (
        f"{settings.FRONTEND_URL.rstrip('/')}/verificar-email/{user.verification_token}"
    )
    context = {
        "user": user,
        "verification_link": verification_link,
        "expiry_hours": VERIFICATION_EXPIRY_HOURS,
        "brand_name": "Flowstate",
    }

    subject = "Verifica tu correo de Flowstate"
    text_message = render_to_string("emails/verification_email.txt", context)
    html_message = render_to_string("emails/verification_email.html", context)

    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
