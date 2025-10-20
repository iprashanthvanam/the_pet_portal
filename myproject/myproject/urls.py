# """
# URL configuration for myproject project.

# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/5.2/topics/http/urls/
# Examples:
# Function views
#     1. Add an import:  from my_app import views
#     2. Add a URL to urlpatterns:  path('', views.home, name='home')
# Class-based views
#     1. Add an import:  from other_app.views import Home
#     2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
# Including another URLconf
#     1. Import the include() function: from django.urls import include, path
#     2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
# """
# from django.contrib import admin
# from django.urls import path
# from myapp.views import welcome
# from myapp.views import home
# from myapp.views import about
# from myapp.views import register
# from myapp.views import login
# from myapp.views import home
# from myapp.views import about
# from myapp.views import pets
# from myapp.views import contact


# from django.conf import settings
# from django.conf.urls.static import static


# urlpatterns = [
#     path('', home, name='home'),
#     path('admin/', admin.site.urls),
#     path('welcome/', welcome, name='welcome'),
#     path('home/', home, name='home'),
#     path('about/', about, name='about'),
#     path('register/' , register, name='register'),
#     path('login/' , login, name='login'),
#     path('pets/' , pets, name='pets'),
#     path('contact/' , contact, name='contact')
# ]


# if settings.DEBUG:
#     urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)













# from django.contrib import admin
# from django.urls import path
# from myapp.views import welcome, home, about, register, login, pets, contact
# from django.conf import settings
# from django.conf.urls.static import static

# urlpatterns = [
#     path('', home, name='home'),
#     path('admin/', admin.site.urls),
#     path('welcome/', welcome, name='welcome'),
#     path('home/', home, name='home'),
#     path('about/', about, name='about'),
#     path('register/', register, name='register'),
#     path('login/', login, name='login'),
#     path('pets/', pets, name='pets'),
#     path('contact/', contact, name='contact')
# ]

# if settings.DEBUG:
#     urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

























from django.contrib import admin
from django.urls import path
from myapp.views import welcome, home, about, register, user_login, pets, contact, logout_view  # Updated to user_login
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('welcome/', welcome, name='welcome'),
    path('home/', home, name='home'),
    path('about/', about, name='about'),
    path('register/', register, name='register'),
    path('login/', user_login, name='login'),  # Updated to user_login
    path('pets/', pets, name='pets'),
    path('contact/', contact, name='contact'),
    path('logout/', logout_view, name='logout'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)