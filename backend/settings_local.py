"""
Local settings for testing motorcycle database population
"""

from revsync.settings import *

# Use SQLite for local testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_local.sqlite3',
    }
}

# Disable some dependencies for faster testing
CELERY_TASK_ALWAYS_EAGER = True
DEBUG = True
ALLOWED_HOSTS = ['*'] 