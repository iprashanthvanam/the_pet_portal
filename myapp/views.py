from datetime import date, timedelta
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from .models import CartItem
from .forms import OrderCreateForm
from .models import Food, Order, OrderItem, Pet



import razorpay
from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseBadRequest

from .models import Order, OrderItem
from .forms import OrderCreateForm

from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import razorpay

from .models import Order




from django.http import HttpResponse
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
import io


from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required




from django.shortcuts import render
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
from .models import Order





from django.views.decorators.http import require_POST
from django.http import JsonResponse
import json






import hmac
import hashlib
import json
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse



import razorpay

from django.db.models import Q

from rest_framework.decorators import api_view
from rest_framework.response import Response
# from rest_framework import serializers




from .serializers import PetSerializer, FoodSerializer, AccessorySerializer



from google import genai
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt


import requests

from .models import UserProfile


from .models import Food, Order, OrderItem, Pet, DoctorAppointment

from .models import DoctorAppointment

from .models import PetCareBooking

from .models import GroomingBooking



from .models import Accessory
# from .serializers import AccessorySerializer

from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from weasyprint import HTML
from .models import Order 
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from weasyprint import HTML
from .models import Order 




from django.utils import timezone

from django.core.cache import cache
# =====================================================
# INTERNAL: CART SCHEMA NORMALIZER
# =====================================================

def normalize_cart(cart):
    normalized = {}
    for key, item in cart.items():
        normalized[key] = {
            'id': int(item.get('id')),
            'type': item.get('type'),
            'name': item.get('name'),
            'price': float(item.get('price')),
            'quantity': int(item.get('quantity', 1)),
        }
    return normalized


# =====================================================
# BASIC PAGES
# =====================================================

def welcome(request):
    return HttpResponse("welcome to the myapp application")









def home(request):
    pets_list = Pet.objects.all().order_by('-date_added')
    foods_list = Food.objects.all().order_by('expire_date')
    accessories_list = Accessory.objects.all().order_by('-date_added')

    cart = normalize_cart(request.session.get('cart', {}))
    cart_count = sum(item['quantity'] for item in cart.values()) if request.user.is_authenticated else 0

    today = date.today()
    soon_threshold = today + timedelta(days=30)

    for food in foods_list:
        food.is_expired = food.expire_date < today
        food.is_expiring_soon = today <= food.expire_date <= soon_threshold

    return render(request, 'myapp/home.html', {
        'pets': pets_list,
        'foods': foods_list,
        'accessories': accessories_list,
        'cart_count': cart_count,
    })



def about(request):
    return render(request, 'myapp/about.html')


def contact(request):
    return render(request, 'myapp/contact.html')


# =====================================================
# AUTH
# =====================================================

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.email = request.POST.get('email')
            user.save()
            messages.success(request, f'Successfully registered {user.username}!')
            return redirect('login')
        messages.error(request, 'Registration failed.')
    else:
        form = UserCreationForm()

    return render(request, 'myapp/register.html', {'form': form})


def user_login(request):
    if request.method == 'POST':
        username_email = request.POST.get('username_email')
        password = request.POST.get('password')

        # 🔴 STEP 1: Capture cart BEFORE login
        cart_before_login = normalize_cart(request.session.get('cart', {}))

        user = authenticate(request, username=username_email, password=password)
        if user is None:
            try:
                user_obj = User.objects.get(email=username_email)
                user = authenticate(
                    request,
                    username=user_obj.username,
                    password=password
                )
            except User.DoesNotExist:
                user = None

        if user:
            # 🔴 STEP 2: Login (Django rotates session here)
            auth_login(request, user)

            

            # 🔴 STEP 3: Ensure NEW session exists
            if not request.session.session_key:
                request.session.create()

            # 🔴 STEP 4: Restore cart into NEW session
            request.session['cart'] = cart_before_login
            request.session.modified = True

            load_user_cart_into_session(request)

            messages.success(request, 'Login successful!')
            return redirect('pets')

        messages.error(request, 'Invalid credentials.')

    return render(request, 'myapp/login.html')


def logout_view(request):
    save_session_cart_to_db(request)
    logout(request)
    return redirect('home')



# =====================================================
# CATALOG
# =====================================================







@login_required
def pets(request):
    today = date.today()
    soon_threshold = today + timedelta(days=30)

    query = request.GET.get('q', '').strip()
    species_filter = request.GET.get('species', '').strip()
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    fresh_only = request.GET.get('fresh')

    pets_queryset = Pet.objects.all().order_by('-date_added')
    foods_queryset = Food.objects.all().order_by('expire_date')
    accessories_queryset = Accessory.objects.all().order_by('-date_added')

    if query:
        pets_queryset = pets_queryset.filter(
            Q(name__icontains=query) |
            Q(species__icontains=query) |
            Q(description__icontains=query)
        )

        foods_queryset = foods_queryset.filter(
            Q(name__icontains=query) |
            Q(food_type__icontains=query) |
            Q(description__icontains=query)
        )

        accessories_queryset = accessories_queryset.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__icontains=query)
        )

    if species_filter:
        pets_queryset = pets_queryset.filter(species__iexact=species_filter)

    if min_price:
        pets_queryset = pets_queryset.filter(price__gte=min_price)
        foods_queryset = foods_queryset.filter(price__gte=min_price)
        accessories_queryset = accessories_queryset.filter(price__gte=min_price)

    if max_price:
        pets_queryset = pets_queryset.filter(price__lte=max_price)
        foods_queryset = foods_queryset.filter(price__lte=max_price)
        accessories_queryset = accessories_queryset.filter(price__lte=max_price)

    pets_list = list(pets_queryset)
    foods_list = list(foods_queryset)
    accessories_list = list(accessories_queryset)

    for food in foods_list:
        food.is_expired = food.expire_date < today
        food.is_expiring_soon = today <= food.expire_date <= soon_threshold

    if fresh_only:
        foods_list = [f for f in foods_list if not f.is_expired]

    cart = normalize_cart(request.session.get('cart', {}))
    request.session['cart'] = cart
    cart_count = sum(item['quantity'] for item in cart.values())

    cart_lookup = {
        f"{item['type']}_{item['id']}": item['quantity']
        for item in cart.values()
    }

    for pet in pets_list:
        pet.cart_qty = cart_lookup.get(f"pet_{pet.id}", 0)

    for food in foods_list:
        food.cart_qty = cart_lookup.get(f"food_{food.id}", 0)

    for accessory in accessories_list:
        accessory.cart_qty = cart_lookup.get(f"accessory_{accessory.id}", 0)

    return render(request, 'myapp/pets.html', {
        'pets': pets_list,
        'foods': foods_list,
        'accessories': accessories_list,
        'cart_count': cart_count,
        'query': query,
    })





@login_required
def search_suggestions(request):
    query = request.GET.get('q', '').strip()

    suggestions = []

    if query:
        pet_names = Pet.objects.filter(
            Q(name__icontains=query) |
            Q(species__icontains=query)
        ).values_list('name', flat=True)[:5]

        food_names = Food.objects.filter(
            Q(name__icontains=query) |
            Q(food_type__icontains=query)
        ).values_list('name', flat=True)[:5]

        suggestions = list(pet_names) + list(food_names)

    return JsonResponse({'suggestions': suggestions})



# =====================================================
# CART
# =====================================================



def add_to_cart(request, item_type, item_id):
    if not request.session.session_key:
        request.session.create()

    cart = normalize_cart(request.session.get('cart', {}))
    cart_key = f"{item_type}_{item_id}"

    if item_type == 'pet':
        pet = get_object_or_404(Pet, id=item_id)
        if cart_key in cart:
            return redirect(request.META.get('HTTP_REFERER', 'pets'))

        cart[cart_key] = {
            'id': pet.id,
            'type': 'pet',
            'name': pet.name,
            'price': float(pet.price),
            'quantity': 1,
        }

    elif item_type == 'food':
        food = get_object_or_404(Food, id=item_id)
        if cart_key in cart:
            cart[cart_key]['quantity'] += 1
        else:
            cart[cart_key] = {
                'id': food.id,
                'type': 'food',
                'name': food.name,
                'price': float(food.price),
                'quantity': 1,
            }

    elif item_type == 'accessory':
        accessory = get_object_or_404(Accessory, id=item_id)
        if cart_key in cart:
            cart[cart_key]['quantity'] += 1
        else:
            cart[cart_key] = {
                'id': accessory.id,
                'type': 'accessory',
                'name': accessory.name,
                'price': float(accessory.price),
                'quantity': 1,
            }

    request.session['cart'] = normalize_cart(cart)
    request.session.modified = True
    messages.success(request, "Item added to cart")

    if request.user.is_authenticated:
        save_session_cart_to_db(request)

    return redirect(request.META.get('HTTP_REFERER', 'pets'))





# def cart_detail(request):
#     cart = normalize_cart(request.session.get('cart', {}))
#     request.session['cart'] = cart

#     total_price = 0
#     for item in cart.values():
#         item['total'] = item['price'] * item['quantity']
#         total_price += item['total']

#     return render(request, 'myapp/cart.html', {
#         'cart': cart,
#         'total_price': total_price
#     })



def cart_detail(request):
    cart = normalize_cart(request.session.get('cart', {}))
    request.session['cart'] = cart
    request.session.modified = True

    total_price = 0
    cart_count = 0

    for item in cart.values():
        item['total'] = item['price'] * item['quantity']
        total_price += item['total']
        cart_count += item['quantity']

    return render(request, 'myapp/cart.html', {
        'cart': cart,
        'total_price': total_price,
        'cart_count': cart_count,   # ✅ FIXED
    })









# =====================================================
# CHECKOUT & ORDERS
# =====================================================

# @login_required
# def checkout(request):
#     cart = request.session.get('cart', {})
#     if not cart:
#         return redirect('cart_detail')

#     total_price = sum(
#         item['price'] * item['quantity']
#         for item in cart.values()
#     )

#     # ✅ ALWAYS define context FIRST
#     context = {
#         'form': OrderCreateForm(),
#         'total_price': total_price,
#         'cart': cart
#     }

#     if request.method == 'POST':
#         form = OrderCreateForm(request.POST)
#         if form.is_valid():
#             payment_method = form.cleaned_data['payment_method']

#             order = form.save(commit=False)
#             order.user = request.user
#             order.total_cost = total_price




#             # =====================
#             # COD FLOW
#             # =====================
#             if payment_method == 'COD':
#                 order.payment_method = 'COD'
#                 order.payment_status = 'UNPAID'
#                 order.save()

#                 for item in cart.values():
#                     OrderItem.objects.create(
#                         order=order,
#                         product_name=item['name'],
#                         price=item['price'],
#                         quantity=item['quantity']
#                         )

#                 request.session['cart'] = {}
#                 request.session.modified = True

#                 return redirect('order_success', order_id=order.order_id)


#             # =====================
#             # RAZORPAY FLOW
#             # =====================
#             client = razorpay.Client(
#                 auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
#             )

#             razorpay_order = client.order.create({
#                 "amount": int(total_price * 100),  # paise
#                 "currency": settings.RAZORPAY_CURRENCY,
#                 "payment_capture": 1
#             })

#             order.payment_method = 'RAZORPAY'
#             order.payment_status = 'UNPAID'
#             order.razorpay_order_id = razorpay_order['id']
#             order.save()

#             for item in cart.values():
#                 OrderItem.objects.create(
#                 order=order,
#                 product_name=item['name'],
#                 price=item['price'],
#                 quantity=item['quantity'])

#             return render(request, 'myapp/payment_redirect.html', {
#                 'order': order,
#                 'razorpay_key': settings.RAZORPAY_KEY_ID,
#                 'razorpay_amount': int(total_price * 100),
#                 'razorpay_order_id': razorpay_order['id'],
#                 'currency': settings.RAZORPAY_CURRENCY,
#                 'callback_url': request.build_absolute_uri('/payment/verify/')})

#         # invalid form
#         context['form'] = form

#     return render(request, 'myapp/checkout.html', context)




@login_required
def checkout(request):
    cart = request.session.get('cart', {})
    if not cart:
        return redirect('cart_detail')

    total_price = sum(
        item['price'] * item['quantity']
        for item in cart.values()
    )

    context = {
        'form': OrderCreateForm(),
        'total_price': total_price,
        'cart': cart
    }

    if request.method == 'POST':
        form = OrderCreateForm(request.POST)

        if form.is_valid():
            payment_method = form.cleaned_data['payment_method']

            # =====================
            # COD FLOW (UNCHANGED)
            # =====================
            if payment_method == 'COD':

                order = form.save(commit=False)
                order.user = request.user
                order.total_cost = total_price
                order.payment_method = 'COD'
                order.payment_status = 'UNPAID'
                order.save()

                for item in cart.values():
                    OrderItem.objects.create(
                        order=order,
                        product_name=item['name'],
                        price=item['price'],
                        quantity=item['quantity']
                    )

                # Clear cart after order placed
                request.session['cart'] = {}
                request.session.modified = True

                return redirect('order_success', order_id=order.order_id)

            # =====================
            # ✅ RAZORPAY FLOW (FIXED)
            # =====================
            if payment_method == 'RAZORPAY':

                client = razorpay.Client(
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                )

                razorpay_order = client.order.create({
                    "amount": int(total_price * 100),  # in paise
                    "currency": settings.RAZORPAY_CURRENCY,
                    "payment_capture": 1
                })

                # 🔥 DO NOT CREATE ORDER IN DB HERE

                # ✅ Store everything in session
                request.session['pending_order'] = {
                    "form_data": form.cleaned_data,
                    "cart": cart,
                    "total_price": float(total_price),
                    "razorpay_order_id": razorpay_order['id']
                }

                request.session.modified = True

                return render(request, 'myapp/payment_redirect.html', {
                    'razorpay_key': settings.RAZORPAY_KEY_ID,
                    'razorpay_amount': int(total_price * 100),
                    'razorpay_order_id': razorpay_order['id'],
                    'currency': settings.RAZORPAY_CURRENCY,
                    'callback_url': request.build_absolute_uri('/payment/verify/')
                })

        context['form'] = form

    return render(request, 'myapp/checkout.html', context)







@csrf_exempt
def payment_verify(request):
    if request.method != "POST":
        return redirect("home")

    razorpay_payment_id = request.POST.get("razorpay_payment_id")
    razorpay_order_id = request.POST.get("razorpay_order_id")
    razorpay_signature = request.POST.get("razorpay_signature")

    pending_order = request.session.get("pending_order")

    if not pending_order:
        messages.error(request, "Session expired. Please try again.")
        return redirect("checkout")

    client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )

    try:
        # ✅ Verify signature
        client.utility.verify_payment_signature({
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_signature": razorpay_signature,
        })

        # ===============================
        # NOW CREATE ORDER (ONLY HERE)
        # ===============================

        form_data = pending_order["form_data"]
        cart = pending_order["cart"]
        total_price = pending_order["total_price"]

        order = Order.objects.create(
            user=request.user,
            full_name=form_data["full_name"],
            email=form_data["email"],
            mobile_number=form_data["mobile_number"],
            address=form_data["address"],
            city=form_data["city"],
            postal_code=form_data["postal_code"],
            total_cost=total_price,
            payment_method="RAZORPAY",
            payment_status="PAID",
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            status="CONFIRMED"
        )

        for item in cart.values():
            OrderItem.objects.create(
                order=order,
                product_name=item["name"],
                price=item["price"],
                quantity=item["quantity"]
            )

        # ✅ Clear cart only after success
        request.session['cart'] = {}
        request.session.pop('pending_order', None)
        request.session.modified = True

        return redirect("order_success", order_id=order.order_id)

    except razorpay.errors.SignatureVerificationError:
        messages.error(request, "Payment verification failed.")
        return redirect("checkout")





@login_required
def order_success(request, order_id):
    order = get_object_or_404(Order, order_id=order_id)
    return render(request, 'myapp/order_success.html', {'order': order})



@login_required
def order_history(request):
    # Admin sees all orders, users see their own
    if request.user.is_superuser:
        orders = Order.objects.all().prefetch_related('items').order_by('-created_at')
    else:
        orders = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')

    return render(request, 'myapp/order_history.html', {
        'orders': orders
    })













# def track_order(request):
#     order = None
#     timeline = []

#     if request.method == 'POST':
#         order_uuid = request.POST.get('order_id')

#         try:
#             if request.user.is_authenticated and request.user.is_superuser:
#                 order = Order.objects.get(order_id=order_uuid)
#             elif request.user.is_authenticated:
#                 order = Order.objects.get(order_id=order_uuid, user=request.user)
#             else:
#                 order = Order.objects.get(order_id=order_uuid)

#             base_time = order.created_at

#             timeline = [
#                 {
#                     'key': 'CONFIRMED',
#                     'label': 'Order Confirmed',
#                     'desc': 'Your order has been received and verified.',
#                     'time': base_time,
#                 },
#                 {
#                     'key': 'PROCESSING',
#                     'label': 'Processing',
#                     'desc': 'Preparing your items for shipment.',
#                     'time': base_time + timedelta(days=1),
#                 },
#                 {
#                     'key': 'SHIPPED',
#                     'label': 'Shipped',
#                     'desc': 'Your package is on its way!',
#                     'time': base_time + timedelta(days=2),
#                 },
#                 {
#                     'key': 'DELIVERED',
#                     'label': 'Delivered',
#                     'desc': 'Successfully delivered to your door.',
#                     'time': base_time + timedelta(days=3),
#                 },
#             ]

#         except Order.DoesNotExist:
#             messages.error(request, "Order ID not found or access denied.")

#     return render(request, 'myapp/track_order.html', {
#         'order': order,
#         'timeline': timeline
#     })





@login_required
def track_order(request):
    order = None
    timeline = []

    if request.method == 'POST':
        order_uuid = request.POST.get('order_id')

        try:
            if request.user.is_authenticated and request.user.is_superuser:
                order = Order.objects.get(order_id=order_uuid)
            elif request.user.is_authenticated:
                order = Order.objects.get(order_id=order_uuid, user=request.user)
            else:
                order = Order.objects.get(order_id=order_uuid)

            # Define timeline order
            status_flow = [
                ("CONFIRMED", "Order Confirmed", "Your order has been received and verified.", order.confirmed_at),
                ("PROCESSING", "Processing", "Preparing your items for shipment.", order.processing_at),
                ("SHIPPED", "Shipped", "Your package is on its way!", order.shipped_at),
                ("DELIVERED", "Delivered", "Successfully delivered to your door.", order.delivered_at),
            ]

            status_index = {
                "CONFIRMED": 0,
                "PROCESSING": 1,
                "SHIPPED": 2,
                "DELIVERED": 3,
            }

            current_index = status_index.get(order.status, 0)

            for index, (key, label, desc, time_value) in enumerate(status_flow):

                # If delivered → everything completed
                if order.status == "DELIVERED":
                    completed = True
                    active = False
                else:
                    completed = index < current_index
                    active = index == current_index

                timeline.append({
                    "key": key,
                    "label": label,
                    "desc": desc if time_value else "",
                    "time": time_value,
                    "completed": completed,
                    "active": active,
                })

        except Order.DoesNotExist:
            messages.error(request, "Order ID not found or access denied.")

    return render(request, 'myapp/track_order.html', {
        'order': order,
        'timeline': timeline
    })





def load_user_cart_into_session(request):
    cart = {}
    for item in CartItem.objects.filter(user=request.user):
        key = f"{item.item_type}_{item.item_id}"
        cart[key] = {
            'id': item.item_id,
            'type': item.item_type,
            'name': item.name,
            'price': float(item.price),
            'quantity': item.quantity,
        }
    request.session['cart'] = cart
    request.session.modified = True





def save_session_cart_to_db(request):
    if not request.user.is_authenticated:
        return

    CartItem.objects.filter(user=request.user).delete()

    cart = normalize_cart(request.session.get('cart', {}))
    for item in cart.values():
        CartItem.objects.create(
            user=request.user,
            item_type=item['type'],
            item_id=item['id'],
            name=item['name'],
            price=item['price'],
            quantity=item['quantity']
        )








# =========================
# RAZORPAY POLICY PAGES
# =========================

def privacy_policy(request):
    return render(request, 'myapp/privacy_policy.html')


def terms_and_conditions(request):
    return render(request, 'myapp/terms_and_conditions.html')


def refund_policy(request):
    return render(request, 'myapp/refund_policy.html')


def shipping_policy(request):
    return render(request, 'myapp/shipping_policy.html')


def contact_us(request):
    return render(request, 'myapp/contact_us.html')








@login_required
def download_invoice(request, order_id):
    # Security: admin can download any invoice, users only their own
    if request.user.is_superuser:
        order = get_object_or_404(Order, order_id=order_id)
    else:
        order = get_object_or_404(Order, order_id=order_id, user=request.user)

    # FIXED PATH: Added 'myapp/' so Django can find the file
    html_string = render_to_string('myapp/invoice.html', {'order': order})

    # Generate the PDF
    pdf_file = HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf()

    # Return as downloadable file
    response = HttpResponse(pdf_file, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Invoice_{order.order_id}.pdf"'

    return response








@require_POST
def update_cart_ajax(request):
    data = json.loads(request.body)
    item_id = int(data["item_id"])
    item_type = data["item_type"]
    action = data["action"]

    cart = normalize_cart(request.session.get("cart", {}))
    key = f"{item_type}_{item_id}"

    if action == "add":
        if key in cart:
            if item_type == "pet":
                pass
            else:
                cart[key]["quantity"] += 1
        else:
            if item_type == "pet":
                product = Pet.objects.get(id=item_id)
            elif item_type == "food":
                product = Food.objects.get(id=item_id)
            elif item_type == "accessory":
                product = Accessory.objects.get(id=item_id)
            else:
                return JsonResponse({"error": "Invalid item type"}, status=400)

            cart[key] = {
                "id": item_id,
                "type": item_type,
                "name": product.name,
                "price": float(product.price),
                "quantity": 1,
            }

    elif action == "remove" and key in cart:
        cart[key]["quantity"] -= 1
        if cart[key]["quantity"] <= 0:
            del cart[key]

    request.session["cart"] = cart
    request.session.modified = True

    qty = cart[key]["quantity"] if key in cart else 0
    item_subtotal = cart[key]["price"] * qty if key in cart else 0
    cart_total = sum(i["price"] * i["quantity"] for i in cart.values())
    cart_count = sum(i["quantity"] for i in cart.values())

    return JsonResponse({
        "qty": qty,
        "item_subtotal": item_subtotal,
        "cart_total": cart_total,
        "cart_count": cart_count,
        "removed": key not in cart
    })






@login_required
def retry_razorpay_payment(request, order_id):
    if request.user.is_superuser:
        order = get_object_or_404(Order, order_id=order_id)
    else:
        order = get_object_or_404(Order, order_id=order_id, user=request.user)

    if order.payment_status == "PAID":
        messages.error(request, "Order already paid.")
        return redirect("order_history")

    client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )

    razorpay_order = client.order.create({
        "amount": int(order.total_cost * 100),
        "currency": settings.RAZORPAY_CURRENCY,
    })

    order.payment_method = "RAZORPAY"
    order.payment_status = "UNPAID"
    order.razorpay_order_id = razorpay_order["id"]
    order.razorpay_payment_id = None
    order.save()

    return render(request, "myapp/payment_redirect.html", {
        "order": order,
        "razorpay_key": settings.RAZORPAY_KEY_ID,
        "razorpay_amount": int(order.total_cost * 100),
        "razorpay_order_id": razorpay_order["id"],
        "currency": settings.RAZORPAY_CURRENCY,
    })


def payment_verify_status(request, razorpay_order_id):
    order = get_object_or_404(Order, razorpay_order_id=razorpay_order_id)

    if order.payment_status == "PAID":
        return JsonResponse({"status": "PAID"})

    client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )

    payments = client.order.payments(razorpay_order_id)

    for payment in payments.get("items", []):
        if payment["status"] == "captured":
            order.payment_status = "PAID"
            order.payment_method = "RAZORPAY"
            order.razorpay_payment_id = payment["id"]
            order.save(update_fields=[
                "payment_status",
                "payment_method",
                "razorpay_payment_id"
            ])
            return JsonResponse({"status": "PAID"})

    return JsonResponse({"status": "UNPAID"})





@csrf_exempt
def razorpay_webhook(request):
    payload = request.body
    signature = request.headers.get("X-Razorpay-Signature")

    try:
        razorpay.Client(auth=None).utility.verify_webhook_signature(
            payload,
            signature,
            settings.RAZORPAY_WEBHOOK_SECRET
        )
    except Exception:
        return HttpResponse(status=400)

    data = json.loads(payload)

    if data.get("event") == "payment.captured":
        payment = data["payload"]["payment"]["entity"]
        razorpay_order_id = payment["order_id"]
        razorpay_payment_id = payment["id"]

        try:
            order = Order.objects.get(razorpay_order_id=razorpay_order_id)
            order.mark_paid(razorpay_payment_id)
        except Order.DoesNotExist:
            pass

    return HttpResponse(status=200)















@login_required
def cancel_order(request, order_id):
    if request.user.is_superuser:
        order = get_object_or_404(Order, order_id=order_id)
    else:
        order = get_object_or_404(Order, order_id=order_id, user=request.user)

    if not order.can_cancel():
        messages.error(request, "Order cannot be cancelled at this stage.")
        return redirect("order_history")

    # ---------- COD ----------
    if order.payment_method == "COD":
        order.status = "CANCELLED"
        order.payment_status = "UNPAID"
        order.save(update_fields=["status", "payment_status"])
        messages.success(request, "Order cancelled successfully.")
        return redirect("order_history")

    # ---------- RAZORPAY ----------
    if order.payment_method == "RAZORPAY" and order.payment_status == "PAID":
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        try:
            refund = client.payment.refund(order.razorpay_payment_id, {
                "amount": int(order.total_cost * 100)
            })

            order.mark_refunded(refund["id"])
            messages.success(request, "Order cancelled and refund initiated.")

        except Exception as e:
            messages.error(request, "Refund failed. Please contact support.")

    return redirect("order_history")








# =====================================================
# PRODUCT DETAIL VIEWS
# =====================================================


def pet_detail(request, pk):
    pet = get_object_or_404(
        Pet.objects.select_related('health_profile'),
        pk=pk
    )

    cart = normalize_cart(request.session.get('cart', {}))
    request.session['cart'] = cart

    cart_key = f"pet_{pet.id}"
    pet.cart_qty = cart.get(cart_key, {}).get("quantity", 0)

    cart_count = sum(item['quantity'] for item in cart.values())

    return render(request, 'myapp/pet_detail.html', {
        'pet': pet,
        'cart_count': cart_count,
    })






def food_detail(request, pk):
    food = get_object_or_404(Food, pk=pk)

    cart = normalize_cart(request.session.get('cart', {}))
    request.session['cart'] = cart

    cart_key = f"food_{food.id}"
    food.cart_qty = cart.get(cart_key, {}).get("quantity", 0)

    cart_count = sum(item['quantity'] for item in cart.values())

    return render(request, 'myapp/food_detail.html', {
        'food': food,
        'cart_count': cart_count,
    })





def accessory_detail(request, pk):
    accessory = get_object_or_404(Accessory, pk=pk)

    cart = normalize_cart(request.session.get('cart', {}))
    request.session['cart'] = cart

    cart_key = f"accessory_{accessory.id}"
    accessory.cart_qty = cart.get(cart_key, {}).get("quantity", 0)

    cart_count = sum(item['quantity'] for item in cart.values())

    return render(request, 'myapp/accessory_detail.html', {
        'accessory': accessory,
        'cart_count': cart_count,
    })




@login_required
def profile_view(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        request.user.first_name = request.POST.get("first_name")
        request.user.last_name = request.POST.get("last_name")
        request.user.email = request.POST.get("email")
        request.user.save()

        profile.phone = request.POST.get("phone")
        profile.address = request.POST.get("address")
        profile.city = request.POST.get("city")
        profile.postal_code = request.POST.get("postal_code")

        if request.FILES.get("profile_image"):
            profile.profile_image = request.FILES.get("profile_image")

        profile.save()

        messages.success(request, "Profile updated successfully!")
        return redirect("profile")

    return render(request, "myapp/profile.html", {
        "profile": profile
    })








# =========================
# DOCTOR CONSULTATION
# =========================




from django.utils import timezone
from datetime import datetime



@login_required
def consult_doctor(request):

    if request.method == "POST":
        pet_name = request.POST.get("pet_name")
        pet_type = request.POST.get("pet_type")
        appointment_date = request.POST.get("appointment_date")
        appointment_time = request.POST.get("appointment_time")
        symptoms = request.POST.get("symptoms")

        # Prevent booking past dates
        if appointment_date:
            selected_date = datetime.strptime(appointment_date, "%Y-%m-%d").date()
            if selected_date < timezone.now().date():
                messages.error(request, "You cannot book an appointment for a past date.")
                return redirect("consult_doctor")

        # Prevent double booking same slot
        if DoctorAppointment.objects.filter(
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            status__in=["PENDING", "CONFIRMED"]
        ).exists():
            messages.error(request, "This time slot is already booked. Please choose another.")
            return redirect("consult_doctor")

        DoctorAppointment.objects.create(
            user=request.user,
            pet_name=pet_name,
            pet_type=pet_type,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            symptoms=symptoms,
        )

        messages.success(request, "Appointment booked successfully!")
        return redirect("appointment_history")

    return render(request, "myapp/consult_doctor.html")






@login_required
def appointment_history(request):
    appointments = DoctorAppointment.objects.filter(user=request.user).order_by("-created_at")

    return render(request, "myapp/appointment_history.html", {
        "appointments": appointments
    })


@login_required
def cancel_appointment(request, appointment_id):
    appointment = get_object_or_404(
        DoctorAppointment,
        id=appointment_id,
        user=request.user
    )

    if appointment.status == "PENDING":
        appointment.status = "CANCELLED"
        appointment.save()
        messages.success(request, "Appointment cancelled successfully.")

    return redirect("appointment_history")












# =========================
# PET CARE BOARDING
# =========================
from datetime import datetime
from django.utils import timezone

@login_required
def pet_care_booking(request):

    if request.method == "POST":
        try:
            # Convert datetime-local to proper datetime
            start_str = request.POST.get("start_datetime")
            end_str = request.POST.get("end_datetime")

            start_dt = datetime.strptime(start_str, "%Y-%m-%dT%H:%M")
            end_dt = datetime.strptime(end_str, "%Y-%m-%dT%H:%M")

            # Make timezone aware
            start_dt = timezone.make_aware(start_dt)
            end_dt = timezone.make_aware(end_dt)

            booking = PetCareBooking.objects.create(
                user=request.user,
                pet_name=request.POST.get("pet_name"),
                pet_species=request.POST.get("pet_species"),
                pet_age=int(request.POST.get("pet_age")),
                pet_gender=request.POST.get("pet_gender"),
                health_notes=request.POST.get("health_notes"),

                vaccinated=bool(request.POST.get("vaccinated")),
                special_diet=bool(request.POST.get("special_diet")),
                injection_required=bool(request.POST.get("injection_required")),
                vaccine_required=bool(request.POST.get("vaccine_required")),  # ✅ FIXED NAME
                extra_care=bool(request.POST.get("extra_care")),

                start_datetime=start_dt,
                end_datetime=end_dt,
            )

            messages.success(request, "Pet Care Booking Created Successfully!")
            return redirect("pet_care_history")

        except Exception as e:
            messages.error(request, str(e))

    return render(request, "myapp/pet_care_form.html")


@login_required
def pet_care_history(request):
    bookings = PetCareBooking.objects.filter(user=request.user).order_by("-created_at")

    total_used = bookings.count()
    total_spent = sum(b.total_price for b in bookings)

    return render(request, "myapp/pet_care_history.html", {
        "bookings": bookings,
        "total_used": total_used,
        "total_spent": total_spent
    })


@login_required
def cancel_pet_care(request, booking_id):
    booking = get_object_or_404(PetCareBooking, id=booking_id, user=request.user)

    if booking.status in ["PENDING", "CONFIRMED"]:
        booking.status = "CANCELLED"
        booking.save()
        messages.success(request, "Pet Care Booking Cancelled.")
    else:
        messages.error(request, "Cannot cancel active or completed booking.")

    return redirect("pet_care_history")











# =========================
# PET GROOMING SERVICE
# =========================

@login_required
def grooming_booking(request):

    if request.method == "POST":
        try:
            dt_str = request.POST.get("appointment_datetime")
            appointment_dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M")
            appointment_dt = timezone.make_aware(appointment_dt)

            GroomingBooking.objects.create(
                user=request.user,
                pet_name=request.POST.get("pet_name"),
                pet_type=request.POST.get("pet_type"),
                pet_size=request.POST.get("pet_size"),
                package_type=request.POST.get("package_type"),
                visit_type=request.POST.get("visit_type"),
                preferred_groomer=request.POST.get("preferred_groomer"),
                appointment_datetime=appointment_dt,
            )

            messages.success(request, "Grooming booking submitted! Awaiting admin approval.")
            return redirect("grooming_history")

        except Exception as e:
            messages.error(request, str(e))

    return render(request, "myapp/grooming_form.html")


@login_required
def grooming_history(request):

    bookings = GroomingBooking.objects.filter(user=request.user).order_by("-created_at")

    return render(request, "myapp/grooming_history.html", {
        "bookings": bookings
    })


@login_required
def cancel_grooming(request, booking_id):

    booking = get_object_or_404(GroomingBooking, id=booking_id, user=request.user)

    if booking.status in ["PENDING", "APPROVED"]:
        booking.status = "CANCELLED"
        booking.save()
        messages.success(request, "Grooming booking cancelled.")
    else:
        messages.error(request, "Cannot cancel this booking.")

    return redirect("grooming_history")


























# =========================
# HOME PAGE API ENDPOINT
# =========================









@api_view(['GET'])
def home_api(request):

    pets = Pet.objects.select_related('health_profile').all().order_by('-date_added')
    foods = Food.objects.all().order_by('expire_date')
    accessories = Accessory.objects.all().order_by('-date_added')

    pet_data = PetSerializer(pets, many=True, context={'request': request}).data
    food_data = FoodSerializer(foods, many=True, context={'request': request}).data
    accessory_data = AccessorySerializer(accessories, many=True, context={'request': request}).data

    return Response({
        "pets": pet_data,
        "foods": food_data,
        "accessories": accessory_data
    })






# ==========================================
# GEMINI CHATBOT API (PETS PAGE ONLY)
# ==========================================




# MODEL_NAME = "gemini-2.5-flash"


# @csrf_exempt
# @require_POST
# def chatbot_api(request):
#     try:
#         data = json.loads(request.body)
#         user_message = data.get("message", "").strip()

#         if not user_message:
#             return JsonResponse({"error": "Empty message"}, status=400)

#         SYSTEM_PROMPT = """
# You are PetPortal AI assistant.

# You help users with:
# - Pet suggestions
# - Food recommendations
# - Refund policy
# - Shipping policy
# - Order tracking
# - General FAQ

# Keep answers short and friendly.
# """

#         # Initialize Gemini client
#         client = genai.Client(api_key=settings.GEMINI_API_KEY)

#         response = client.models.generate_content(
#             model=MODEL_NAME,
#             contents=SYSTEM_PROMPT + "\nUser: " + user_message,
#         )

#         reply = response.text

#         if not reply:
#             reply = "Sorry, I couldn't understand that."

#         return JsonResponse({"reply": reply})

#     except Exception as e:
#         print("Chatbot exception:", str(e))
#         return JsonResponse(
#             {"error": "AI service temporarily unavailable."},
#             status=500
#         )














# # ==========================================
# # SMART CONTEXT-AWARE GEMINI CHATBOT
# # ==========================================

# MODEL_NAME = "gemini-2.5-flash"

# @csrf_exempt
# @require_POST
# def chatbot_api(request):
#     try:
#         data = json.loads(request.body)
#         user_message = data.get("message", "").strip()

#         if not user_message:
#             return JsonResponse({"error": "Empty message"}, status=400)

#         # ==========================
#         # If user not logged in
#         # ==========================
#         if not request.user.is_authenticated:
#             context_data = "User is not logged in."
#         else:
#             user = request.user

#             # ---- PROFILE ----
#             profile = getattr(user, "profile", None)

#             profile_data = f"""
# Username: {user.username}
# Full Name: {user.first_name} {user.last_name}
# Email: {user.email}
# Phone: {profile.phone if profile else ""}
# City: {profile.city if profile else ""}
# Address: {profile.address if profile else ""}
# Postal Code: {profile.postal_code if profile else ""}
# """

#             # ---- ORDERS ----
#             orders = Order.objects.filter(user=user).prefetch_related("items").order_by("-created_at")

#             order_summary = ""
#             total_spent = 0

#             for order in orders[:5]:  # limit to last 5
#                 total_spent += order.total_cost
#                 items_list = ", ".join([f"{item.product_name} (x{item.quantity})" for item in order.items.all()])

#                 order_summary += f"""
# Order ID: {order.order_id}
# Status: {order.status}
# Payment Status: {order.payment_status}
# Total: ₹{order.total_cost}
# Items: {items_list}
# Created At: {order.created_at}
# """

#             # ---- DOCTOR APPOINTMENTS ----
#             appointments = DoctorAppointment.objects.filter(user=user).order_by("-created_at")[:3]
#             appointment_data = ""
#             for a in appointments:
#                 appointment_data += f"""
# Pet: {a.pet_name}
# Date: {a.appointment_date}
# Time: {a.appointment_time}
# Status: {a.status}
# """

#             # ---- PET CARE ----
#             pet_care = PetCareBooking.objects.filter(user=user).order_by("-created_at")[:3]
#             pet_care_data = ""
#             for p in pet_care:
#                 pet_care_data += f"""
# Pet: {p.pet_name}
# From: {p.start_datetime}
# To: {p.end_datetime}
# Status: {p.status}
# Total: ₹{p.total_price}
# """

#             # ---- GROOMING ----
#             grooming = GroomingBooking.objects.filter(user=user).order_by("-created_at")[:3]
#             grooming_data = ""
#             for g in grooming:
#                 grooming_data += f"""
# Pet: {g.pet_name}
# Package: {g.package_type}
# Visit: {g.visit_type}
# Status: {g.status}
# Total: ₹{g.total_price}
# """

#             context_data = f"""
# USER PROFILE:
# {profile_data}

# LAST ORDERS:
# {order_summary}

# TOTAL SPENT: ₹{total_spent}

# DOCTOR APPOINTMENTS:
# {appointment_data}

# PET CARE BOOKINGS:
# {pet_care_data}

# GROOMING BOOKINGS:
# {grooming_data}
# """

#         SYSTEM_PROMPT = f"""
# You are PetPortal AI assistant.

# You are allowed to answer using ONLY the provided context data.

# If the question is about:
# - Orders
# - Payment
# - Refund
# - Profile
# - Appointments
# - Grooming
# - Pet Care
# - Spending

# Use the real data from context.

# If data is missing, politely say you could not find it.

# Never mention passwords.
# Never expose sensitive data.
# Keep answers short, clear and friendly.

# CONTEXT:
# {context_data}

# User Question:
# {user_message}
# """

#         ai_insights = cache.get("admin_ai_insights")

#         if not ai_insights:
#             try:
#                 client = genai.Client(api_key=settings.GEMINI_API_KEY)

#                 response = client.models.generate_content(
#                     model="gemini-2.5-flash",
#                     contents=ai_prompt,
#                 )

#                 ai_insights = response.text
#                 cache.set("admin_ai_insights", ai_insights, 1800)  # 30 minutes

#             except Exception:
#                 ai_insights = "AI analysis temporarily unavailable."



    #     client = genai.Client(api_key=settings.GEMINI_API_KEY)

    #     response = client.models.generate_content(
    #         model=MODEL_NAME,
    #         contents=SYSTEM_PROMPT,
    #     )

    #     reply = response.text or "Sorry, I couldn't understand that."

    #     return JsonResponse({"reply": reply})

    # except Exception as e:
    #     print("Chatbot exception:", str(e))
    #     return JsonResponse(
    #         {"error": "AI service temporarily unavailable."},
    #         status=500
    #     )




# ==========================================
# SMART CONTEXT-AWARE GEMINI CHATBOT
# ==========================================

MODEL_NAME = "gemini-2.5-flash"

@csrf_exempt
@require_POST
def chatbot_api(request):
    try:
        data = json.loads(request.body)
        user_message = data.get("message", "").strip()

        if not user_message:
            return JsonResponse({"error": "Empty message"}, status=400)

        # ==========================
        # Build Context
        # ==========================

        if not request.user.is_authenticated:
            context_data = "User is not logged in."
        else:
            user = request.user
            profile = getattr(user, "profile", None)

            # ---- PROFILE ----
            profile_data = f"""
Username: {user.username}
Full Name: {user.first_name} {user.last_name}
Email: {user.email}
Phone: {profile.phone if profile else ""}
City: {profile.city if profile else ""}
Address: {profile.address if profile else ""}
Postal Code: {profile.postal_code if profile else ""}
"""

            # ---- ORDERS ----
            orders = Order.objects.filter(user=user).prefetch_related("items").order_by("-created_at")
            order_summary = ""
            total_spent = 0

            for order in orders[:5]:
                total_spent += order.total_cost
                items_list = ", ".join(
                    [f"{item.product_name} (x{item.quantity})" for item in order.items.all()]
                )

                order_summary += f"""
Order ID: {order.order_id}
Status: {order.status}
Payment Status: {order.payment_status}
Total: ₹{order.total_cost}
Items: {items_list}
Created At: {order.created_at}
"""

            # ---- DOCTOR ----
            appointments = DoctorAppointment.objects.filter(user=user).order_by("-created_at")[:3]
            appointment_data = ""
            for a in appointments:
                appointment_data += f"""
Pet: {a.pet_name}
Date: {a.appointment_date}
Time: {a.appointment_time}
Status: {a.status}
"""

            # ---- PET CARE ----
            pet_care = PetCareBooking.objects.filter(user=user).order_by("-created_at")[:3]
            pet_care_data = ""
            for p in pet_care:
                pet_care_data += f"""
Pet: {p.pet_name}
From: {p.start_datetime}
To: {p.end_datetime}
Status: {p.status}
Total: ₹{p.total_price}
"""

            # ---- GROOMING ----
            grooming = GroomingBooking.objects.filter(user=user).order_by("-created_at")[:3]
            grooming_data = ""
            for g in grooming:
                grooming_data += f"""
Pet: {g.pet_name}
Package: {g.package_type}
Visit: {g.visit_type}
Status: {g.status}
Total: ₹{g.total_price}
"""

            context_data = f"""
USER PROFILE:
{profile_data}

LAST ORDERS:
{order_summary}

TOTAL SPENT: ₹{total_spent}

DOCTOR APPOINTMENTS:
{appointment_data}

PET CARE BOOKINGS:
{pet_care_data}

GROOMING BOOKINGS:
{grooming_data}
"""

        # ==========================
        # SYSTEM PROMPT
        # ==========================

        system_prompt = f"""
You are PetPortal AI assistant.

You must answer ONLY using the provided context data.

If data is missing, politely say you could not find it.

Never mention passwords.
Never expose sensitive data.
Keep answers short, clear and friendly.

CONTEXT:
{context_data}

User Question:
{user_message}
"""

        # ==========================
        # Call Gemini
        # ==========================

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=system_prompt,
            )

            reply = response.text or "Sorry, I couldn't understand that."

        except Exception as e:
            print("Gemini error:", str(e))
            reply = "AI service temporarily unavailable. Please try again later."

        return JsonResponse({"reply": reply})

    except Exception as e:
        print("Chatbot exception:", str(e))
        return JsonResponse(
            {"error": "Something went wrong."},
            status=500
        )








# ==========================================
# ADMIN AI ANALYTICS DASHBOARD
# ==========================================

from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

@login_required
def admin_ai_dashboard(request):

    if not request.user.is_superuser:
        return redirect("home")

    # ==========================
    # BASIC METRICS
    # ==========================

    total_orders = Order.objects.count()
    total_revenue = Order.objects.filter(payment_status="PAID").aggregate(
        revenue=Sum("total_cost")
    )["revenue"] or 0

    total_refunds = Order.objects.filter(payment_status="REFUNDED").count()

    grooming_count = GroomingBooking.objects.count()
    petcare_count = PetCareBooking.objects.count()
    appointment_count = DoctorAppointment.objects.count()

    cancelled_orders = Order.objects.filter(status="CANCELLED").count()

    # ==========================
    # TOP SELLING PRODUCTS
    # ==========================

    top_items = (
        OrderItem.objects
        .values("product_name")
        .annotate(total_qty=Sum("quantity"))
        .order_by("-total_qty")[:5]
    )

    # ==========================
    # LOW STOCK ACCESSORIES
    # ==========================

    low_stock = Accessory.objects.filter(stock__lt=5).order_by("stock")

    # ==========================
    # PEAK BOOKING HOURS
    # ==========================

    peak_hours = (
        DoctorAppointment.objects
        .values("appointment_time")
        .annotate(count=Count("id"))
        .order_by("-count")[:3]
    )

    # ==========================
    # MONTHLY GROWTH
    # ==========================

    now = timezone.now()
    last_month = now - timedelta(days=30)

    current_month_revenue = Order.objects.filter(
        created_at__gte=last_month,
        payment_status="PAID"
    ).aggregate(total=Sum("total_cost"))["total"] or 0

    previous_month = last_month - timedelta(days=30)

    previous_month_revenue = Order.objects.filter(
        created_at__range=(previous_month, last_month),
        payment_status="PAID"
    ).aggregate(total=Sum("total_cost"))["total"] or 0

    growth_rate = 0
    if previous_month_revenue > 0:
        growth_rate = ((current_month_revenue - previous_month_revenue) / previous_month_revenue) * 100

    # ==========================
    # AI ANALYTICS
    # ==========================

    analytics_summary = f"""
Total Orders: {total_orders}
Total Revenue: ₹{total_revenue}
Total Refunds: {total_refunds}
Cancelled Orders: {cancelled_orders}

Grooming Bookings: {grooming_count}
Pet Care Bookings: {petcare_count}
Doctor Appointments: {appointment_count}

Current Month Revenue: ₹{current_month_revenue}
Previous Month Revenue: ₹{previous_month_revenue}
Growth Rate: {growth_rate:.2f}%

Top Selling Items:
{list(top_items)}

Low Stock Accessories:
{list(low_stock.values_list('name', flat=True))}
"""

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        ai_prompt = f"""
You are a Business Intelligence AI.

Analyze the following business metrics and generate:

1. Best performing service
2. Worst performing service
3. Revenue trend analysis
4. Refund risk detection
5. Cancellation risk
6. Business recommendations
7. Growth forecast insight

DATA:
{analytics_summary}

Keep response professional and structured.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=ai_prompt,
        )

        ai_insights = response.text

    except Exception:
        ai_insights = "AI analysis temporarily unavailable."

    context = {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_refunds": total_refunds,
        "cancelled_orders": cancelled_orders,
        "grooming_count": grooming_count,
        "petcare_count": petcare_count,
        "appointment_count": appointment_count,
        "growth_rate": round(growth_rate, 2),
        "top_items": top_items,
        "low_stock": low_stock,
        "peak_hours": peak_hours,
        "ai_insights": ai_insights,
    }

    return render(request, "myapp/admin_ai_dashboard.html", context)
