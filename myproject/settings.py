


# from pathlib import Path

# BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY = 'django-insecure-3bayyx7n-!9=&p3q$p+$7emc48=vc#hg^4nvszc945ya@=#+6o'
# DEBUG = True
# ALLOWED_HOSTS = []

# INSTALLED_APPS = [
#     'django.contrib.admin',
#     'django.contrib.auth',
#     'django.contrib.contenttypes',
#     'django.contrib.sessions',
#     'django.contrib.messages',
#     'django.contrib.staticfiles',
#     'myapp',
#     "rest_framework",
# ]

# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'django.middleware.common.CommonMiddleware',
#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',
#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
# ]

# ROOT_URLCONF = 'myproject.urls'

# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = 'myproject.wsgi.application'

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# LANGUAGE_CODE = 'en-us'
# TIME_ZONE = 'UTC'
# USE_I18N = True
# USE_TZ = True

# STATIC_URL = '/static/'
# STATICFILES_DIRS = [BASE_DIR / 'myapp/static']

# MEDIA_URL = '/media/'
# MEDIA_ROOT = BASE_DIR / 'media'

# LOGIN_REDIRECT_URL = '/pets/'
# LOGIN_URL = '/login/'

# DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'









# # ==========================
# # Razorpay Sandbox Settings for test mode
# # ==========================

# # RAZORPAY_KEY_ID = "rzp_live_S76Whsmh2XAIdR"
# # RAZORPAY_KEY_SECRET = "xVYarYdy7O75yb06IyzrP2di"

# # RAZORPAY_CURRENCY = "INR"




# # ==========================
# # Razorpay Sandbox Settings for live mode
# # ==========================


# RAZORPAY_KEY_ID = "rzp_live_S76Whsmh2XAIdR"
# RAZORPAY_KEY_SECRET = "xVYarYdy7O75yb06IyzrP2di"

# RAZORPAY_CURRENCY = "INR"
# RAZORPAY_WEBHOOK_SECRET = "Prashwebhook@7552"






















































# from pathlib import Path

# import os
# from dotenv import load_dotenv

# load_dotenv()


# BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY = 'django-insecure-3bayyx7n-!9=&p3q$p+$7emc48=vc#hg^4nvszc945ya@=#+6o'
# DEBUG = True
# ALLOWED_HOSTS = ['127.0.0.1', 'localhost']


# CSRF_TRUSTED_ORIGINS = [
#     "http://127.0.0.1:8000",
#     "http://localhost:8000",
# ]


# INSTALLED_APPS = [
#     'django.contrib.admin',
#     'django.contrib.auth',
#     'django.contrib.contenttypes',
#     'django.contrib.sessions',
#     'django.contrib.messages',
#     'django.contrib.staticfiles',
#     'django.contrib.sites',   # NEW

#     'myapp',
#     'rest_framework',

#     # ALLAUTH
#     'allauth',
#     'allauth.account',
#     'allauth.socialaccount',
#     'allauth.socialaccount.providers.google',
# ]


# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'django.contrib.sessions.middleware.SessionMiddleware',

#     # ALLAUTH REQUIRED MIDDLEWARE (MUST COME AFTER SessionMiddleware)
#     'allauth.account.middleware.AccountMiddleware',

#     'django.middleware.common.CommonMiddleware',
#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',
#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
# ]

# ROOT_URLCONF = 'myproject.urls'

# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = 'myproject.wsgi.application'

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# LANGUAGE_CODE = 'en-us'
# TIME_ZONE = 'UTC'
# USE_I18N = True
# USE_TZ = True

# STATIC_URL = '/static/'
# STATICFILES_DIRS = [BASE_DIR / 'myapp/static']

# MEDIA_URL = '/media/'
# MEDIA_ROOT = BASE_DIR / 'media'

# LOGIN_REDIRECT_URL = '/pets/'
# LOGIN_URL = '/login/'

# DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'









# # ==========================
# # Razorpay Sandbox Settings for test mode
# # ==========================

# # RAZORPAY_KEY_ID = "rzp_live_S76Whsmh2XAIdR"
# # RAZORPAY_KEY_SECRET = "xVYarYdy7O75yb06IyzrP2di"

# # RAZORPAY_CURRENCY = "INR"




# # ==========================
# # Razorpay Sandbox Settings for live mode
# # ==========================


# RAZORPAY_KEY_ID = "rzp_live_S76Whsmh2XAIdR"
# RAZORPAY_KEY_SECRET = "xVYarYdy7O75yb06IyzrP2di"

# RAZORPAY_CURRENCY = "INR"
# RAZORPAY_WEBHOOK_SECRET = "Prashwebhook@7552"





# # ==========================
# # Django Allauth Configuration (CORRECT FINAL VERSION)
# # ==========================

# SITE_ID = 1

# AUTHENTICATION_BACKENDS = [
#     'django.contrib.auth.backends.ModelBackend',
#     'allauth.account.auth_backends.AuthenticationBackend',
# ]

# # Allow login with username OR email (for your manual login)
# ACCOUNT_LOGIN_METHODS = {'username', 'email'}

# # VERY IMPORTANT:
# # Do NOT require password for Google signup
# ACCOUNT_SIGNUP_FIELDS = ['email*']

# ACCOUNT_EMAIL_VERIFICATION = 'none'

# LOGIN_REDIRECT_URL = '/pets/'
# LOGOUT_REDIRECT_URL = '/'
# LOGIN_URL = '/login/'

# # --- GOOGLE ---
# SOCIALACCOUNT_AUTO_SIGNUP = True
# SOCIALACCOUNT_EMAIL_REQUIRED = True
# SOCIALACCOUNT_LOGIN_ON_GET = True
# SOCIALACCOUNT_QUERY_EMAIL = True

# # SOCIALACCOUNT_PROVIDERS = {
# #     'google': {
# #         'SCOPE': [
# #             'profile',
# #             'email',
# #         ],
# #     }
# # }



# SOCIALACCOUNT_PROVIDERS = {
#     'google': {
#         'SCOPE': [
#             'profile',
#             'email',
#         ],
#         'AUTH_PARAMS': {
#             # 🔥 THIS FORCES GOOGLE TO SHOW ACCOUNT SELECT SCREEN EVERY TIME
#             'prompt': 'select_account',
#         },
#     }
# }



# GEMINI_API_KEY = "AIzaSyCGSnQfLvVkRrc3dHZb-0Kazh7Hh1us4Yg"












from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================
# SECURITY
# ==========================

SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

# ==========================
# APPS
# ==========================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    'myapp',
    'rest_framework',

    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myproject.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'myapp/static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==========================
# LOGIN
# ==========================

LOGIN_REDIRECT_URL = '/pets/'
LOGOUT_REDIRECT_URL = '/'
LOGIN_URL = '/login/'

# ==========================
# RAZORPAY
# ==========================

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
RAZORPAY_CURRENCY = os.getenv("RAZORPAY_CURRENCY")

# ==========================
# ALLAUTH
# ==========================

SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_LOGIN_METHODS = {'username', 'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*']
ACCOUNT_EMAIL_VERIFICATION = 'none'

SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_LOGIN_ON_GET = True
SOCIALACCOUNT_QUERY_EMAIL = True

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {
            'prompt': 'select_account',
        },
    }
}

# ==========================
# GEMINI
# ==========================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
