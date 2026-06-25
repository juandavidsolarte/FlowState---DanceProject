import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flowstate_backend.settings')

application = get_wsgi_application()

# esto para que Vercel pueda arrancar backend
app = application
