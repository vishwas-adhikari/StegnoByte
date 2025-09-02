# backend/core/apps.py

from django.apps import AppConfig

# This class name and the 'name' variable must match our new app name 'core'
class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'