# from django.shortcuts import render
# from django.http import HttpResponse
# from django.shortcuts import render, redirect

# def welcome(request):
#     return HttpResponse("welcome to the myapp application")

# # def home(request):
# #     return HttpResponse("home page")

# # def about(request):
# #     return HttpResponse("hello")

# # def register(request):
# #     return render(request, 'myapp/register.html')

# def home(request):
#     return render(request, 'myapp/home.html')

# def about(request):
#     return render(request, 'myapp/about.html')

# def pets(request):
#     return render(request, 'myapp/pets.html')

# def contact(request):
#     return render(request, 'myapp/contact.html')

# # def login(request):
# #     return render(request, 'myapp/login.html')


# def register(request):
#     if request.method == 'POST':
#         # Simulate form processing (in a real app, validate and save to a database)
#         fullname = request.POST.get('fullname')
#         email = request.POST.get('email')
#         number = request.POST.get('number')
#         password = request.POST.get('password')
#         confirm_password = request.POST.get('confirm_password')

#         # Basic validation
#         if password == confirm_password:
#             messages.success(request, f'Successfully registered {fullname}!')
#             return redirect('login')  # Redirect to login page
#         else:
#             messages.error(request, 'Passwords do not match.')
#             return render(request, 'myapp/register.html')
#     return render(request, 'myapp/register.html')

# def login(request):
#     if request.method == 'POST':
#         # Simulate login processing (in a real app, validate credentials)
#         username_email = request.POST.get('username_email')
#         password = request.POST.get('password')
#         # For this example, assume login is successful
#         return redirect('pets')  # Redirect to pets page
#     return render(request, 'myapp/login.html')













# from django.shortcuts import render, redirect
# from django.http import HttpResponse
# from django.contrib import messages  # Ensure this import is present

# def welcome(request):
#     return HttpResponse("welcome to the myapp application")

# def home(request):
#     return render(request, 'myapp/home.html')

# def about(request):
#     return render(request, 'myapp/about.html')

# def register(request):
#     if request.method == 'POST':
#         # Simulate form processing (in a real app, validate and save to a database)
#         fullname = request.POST.get('fullname')
#         email = request.POST.get('email')
#         number = request.POST.get('number')
#         password = request.POST.get('password')
#         confirm_password = request.POST.get('confirm_password')

#         # Basic validation
#         if password == confirm_password:
#             messages.success(request, f'Successfully registered {fullname}!')
#             return redirect('login')  # Redirect to login page
#         else:
#             messages.error(request, 'Passwords do not match.')
#             return render(request, 'myapp/register.html')
#     return render(request, 'myapp/register.html')

# def pets(request):
#     return render(request, 'myapp/pets.html')

# def contact(request):
#     return render(request, 'myapp/contact.html')

# def login(request):
#     if request.method == 'POST':
#         # Simulate login processing (in a real app, validate credentials)
#         username_email = request.POST.get('username_email')
#         password = request.POST.get('password')
#         # For this example, assume login is successful
#         return redirect('pets')  # Redirect to pets page
#     return render(request, 'myapp/login.html')






















# from django.shortcuts import render, redirect
# from django.http import HttpResponse
# from django.contrib.auth import authenticate, login, logout
# from django.contrib.auth.forms import UserCreationForm
# from django.contrib import messages
# from django.contrib.auth.decorators import login_required
# from .models import Pet

# def welcome(request):
#     return HttpResponse("welcome to the myapp application")

# def home(request):
#     return render(request, 'myapp/home.html')

# def about(request):
#     return render(request, 'myapp/about.html')

# def register(request):
#     if request.method == 'POST':
#         form = UserCreationForm(request.POST)
#         if form.is_valid():
#             user = form.save()
#             messages.success(request, f'Successfully registered {user.username}!')
#             return redirect('login')
#         else:
#             messages.error(request, 'Registration failed. Please check the form.')
#     else:
#         form = UserCreationForm()
#     return render(request, 'myapp/register.html', {'form': form})

# def login(request):
#     if request.method == 'POST':
#         username_email = request.POST.get('username_email')
#         password = request.POST.get('password')
#         user = authenticate(request, username=username_email, password=password)
#         if user is not None:
#             login(request, user)
#             return redirect('pets')
#         else:
#             messages.error(request, 'Invalid username or password.')
#     return render(request, 'myapp/login.html')

# @login_required
# def pets(request):
#     pets = Pet.objects.all()
#     return render(request, 'myapp/pets.html', {'pets': pets})

# def contact(request):
#     return render(request, 'myapp/contact.html')

# def logout_view(request):
#     logout(request)
#     return redirect('home')





















# myapp/views.py
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Pet

def welcome(request):
    return HttpResponse("welcome to the myapp application")

def home(request):
    return render(request, 'myapp/home.html')

def about(request):
    return render(request, 'myapp/about.html')

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.email = request.POST.get('email')  # Save email from form
            user.save()
            messages.success(request, f'Successfully registered {user.username}!')
            return redirect('login')
        else:
            messages.error(request, 'Registration failed. Please check the form.')
    else:
        form = UserCreationForm()
    return render(request, 'myapp/register.html', {'form': form})

def user_login(request):
    if request.method == 'POST':
        username_email = request.POST.get('username_email')
        password = request.POST.get('password')
        # Try to authenticate with username
        user = authenticate(request, username=username_email, password=password)
        if user is None:
            # If failed, check if it's an email
            try:
                user_obj = User.objects.get(email=username_email)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        if user is not None:
            auth_login(request, user)
            messages.success(request, 'Login successful!')
            return redirect('pets')
        else:
            messages.error(request, 'Invalid username/email or password.')
    return render(request, 'myapp/login.html')

@login_required
def pets(request):
    pets = Pet.objects.all()
    return render(request, 'myapp/pets.html', {'pets': pets})

def contact(request):
    return render(request, 'myapp/contact.html')

def logout_view(request):
    logout(request)
    return redirect('home')