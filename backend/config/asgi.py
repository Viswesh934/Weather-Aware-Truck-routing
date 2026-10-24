"""
ASGI config for Weather-Aware Truck Routing project.
Exposes the ASGI callable as ``application`` and AWS Lambda handler as ``handler``.
"""

import os
from django.core.asgi import get_asgi_application
from mangum import Mangum

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
handler = Mangum(application)
