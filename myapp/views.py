import json
import threading
import random
import hmac
import hashlib
import razorpay
from datetime import date, timedelta, datetime, time
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.template.loader import render_to_string
from django.conf import settings
from django.db import transaction
from django.db.models import Q, Sum, Count, Avg
from django.core.exceptions import ValidationError
from django.core.mail import send_mail, EmailMessage
from weasyprint import HTML
from google import genai
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from myapp.models import (
    Pet, PetHealthProfile, Food, Order, OrderItem, CartItem, UserProfile,
    DoctorAppointment, PetCareBooking, GroomingBooking, Accessory, products,
    PendingRegistration, Review, ReviewReply, AICachedReport
)
from myapp.serializers import (
    PetSerializer, FoodSerializer, AccessorySerializer, ProductSerializer,
    UserProfileSerializer, ReviewSerializer, ReviewReplySerializer, OrderSerializer, OrderItemSerializer,
    DoctorAppointmentSerializer, PetCareBookingSerializer, GroomingBookingSerializer,
    CartItemSerializer, PetHealthProfileSerializer
)
from myapp.permissions import (
    IsNormalCustomer, IsPetCareProvider, IsGroomingProvider, IsDoctor,
    IsPetSeller, IsProductSeller, IsAccessorySeller, IsMasterAdmin
)

# =====================================================
# INTERNAL: CART SCHEMA NORMALIZER & UTILITIES
# =====================================================

def normalize_cart(cart):
    normalized = {}
    from myapp.models import Pet, Food, Accessory
    for key, item in cart.items():
        try:
            item_type = item.get('type')
            item_id = int(item.get('id'))
            
            image_url = None
            db_price = 0.00
            db_name = ""
            
            if item_type == 'pet':
                p = Pet.objects.filter(id=item_id).first()
                if not p:
                    continue
                db_name = p.name
                db_price = float(p.price)
                if p.image:
                    image_url = p.image.url
            elif item_type == 'food':
                f = Food.objects.filter(id=item_id).first()
                if not f:
                    continue
                db_name = f.name
                db_price = float(f.price)
                if f.image:
                    image_url = f.image.url
            elif item_type == 'accessory':
                a = Accessory.objects.filter(id=item_id).first()
                if not a:
                    continue
                db_name = a.name
                db_price = float(a.price)
                if a.image:
                    image_url = a.image.url
            else:
                continue

            normalized[key] = {
                'id': item_id,
                'type': item_type,
                'name': db_name,
                'price': db_price,
                'quantity': int(item.get('quantity', 1)),
                'image_url': image_url
            }
        except (ValueError, TypeError):
            continue
    return normalized

def load_user_cart_into_session(request):
    db_cart_items = CartItem.objects.filter(user=request.user)
    session_cart = request.session.get('cart', {})
    
    for item in db_cart_items:
        key = f"{item.item_type}_{item.item_id}"
        if key not in session_cart:
            session_cart[key] = {
                'id': item.item_id,
                'type': item.item_type,
                'name': item.name,
                'price': float(item.price),
                'quantity': item.quantity
            }
    request.session['cart'] = session_cart
    request.session.modified = True

def save_session_cart_to_db(request):
    if not request.user.is_authenticated:
        return
    session_cart = request.session.get('cart', {})
    for key, item in session_cart.items():
        CartItem.objects.update_or_create(
            user=request.user,
            item_type=item['type'],
            item_id=item['id'],
            defaults={
                'name': item['name'],
                'price': item['price'],
                'quantity': item['quantity']
            }
        )

# =====================================================
# HELPER MAILERS
# =====================================================

def send_otp_email(email, otp):
    subject = "Verify your Email - Pet Portal"
    message = f"Your verification code (OTP) is: {otp}. It is valid for 10 minutes."
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True
    )

def send_booking_email(user, service_name, date_val, time_val, price):
    subject = f"Booking Confirmed: {service_name}"
    message = f"Hello {user.username},\n\nYour booking for {service_name} has been successfully created!\n\nDetails:\nDate: {date_val}\nTime: {time_val}\nPrice: INR {price}\n\nThank you for using Pet Portal!"
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )

def send_status_update_email(user, item_name, new_status):
    subject = f"Status Updated: {item_name}"
    message = f"Hello {user.username},\n\nThe status of your {item_name} has been updated to: {new_status}.\n\nThank you,\nPet Portal Team"
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )
def generate_invoice_pdf_reportlab(order):
    buffer = io.BytesIO()
    
    # Page setup
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Define primary theme colors (locked dark brand style)
    primary_color = colors.HexColor("#1e293b")  # Slate 800
    accent_color = colors.HexColor("#ec4899")   # Pink secondary
    text_color = colors.HexColor("#334155")     # Slate 700
    light_bg = colors.HexColor("#f8fafc")       # Slate 50
    border_color = colors.HexColor("#e2e8f0")   # Slate 200
    
    # Custom styles
    brand_style = ParagraphStyle(
        'BrandName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color,
        spaceAfter=0
    )
    
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=colors.HexColor("#94a3b8"),
        alignment=2, # Right aligned
        spaceAfter=0
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=6,
        textTransform='uppercase'
    )
    
    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=text_color,
        leading=13
    )
    
    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=text_color,
        leading=13
    )
    
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        spaceAfter=0
    )
    
    table_body = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=text_color,
        leading=12
    )
    
    table_body_bold = ParagraphStyle(
        'TableBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=text_color,
        leading=12
    )
    
    grand_total_label = ParagraphStyle(
        'GrandTotalLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor("#475569"),
        alignment=2
    )
    
    grand_total_val = ParagraphStyle(
        'GrandTotalVal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor("#6366f1"),
        alignment=2
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1, # Centered
        leading=11
    )
    
    # 1. Header Grid (Brand Logo left, "INVOICE" title right)
    header_data = [
        [
            Paragraph('The Pet Portal<font color="#ec4899">.</font>', brand_style),
            Paragraph('INVOICE', title_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[250, 265])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, border_color),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # 2. Billing & Order Info Grid
    # Left Column: Billed To info
    billed_to_content = [
        Paragraph('Billed To', section_heading),
        Paragraph(f'<b>{order.full_name}</b>', meta_val),
        Paragraph(f'{order.address}', meta_val),
        Paragraph(f'{order.city} - {order.postal_code}', meta_val),
        Spacer(1, 8),
        Paragraph(f'Ph: {order.mobile_number}', meta_val),
        Paragraph(f'Email: {order.email}', meta_val),
    ]
    
    # Right Column: Order Details
    status_label = order.status
    if order.status == "CANCELLED":
        status_label = "CANCELLED"
    elif order.payment_status == "PAID":
        status_label = "PAID"
    elif order.payment_status == "REFUNDED":
        status_label = "REFUNDED"
        
    details_rows = [
        [Paragraph('Order ID:', meta_label), Paragraph(f'#{order.order_id}', meta_val)],
        [Paragraph('Date:', meta_label), Paragraph(order.created_at.strftime('%b %d, %Y'), meta_val)],
        [Paragraph('Payment Method:', meta_label), Paragraph(order.payment_method, meta_val)],
    ]
    
    if order.razorpay_payment_id:
        details_rows.append([Paragraph('Payment ID:', meta_label), Paragraph(order.razorpay_payment_id, meta_val)])
    if order.razorpay_refund_id:
        details_rows.append([Paragraph('Refund ID:', meta_label), Paragraph(order.razorpay_refund_id, meta_val)])
        
    details_rows.append([Paragraph('Status:', meta_label), Paragraph(f'<b>{status_label}</b>', meta_val)])
    
    details_table = Table(details_rows, colWidths=[100, 155])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    
    info_data = [
        [billed_to_content, [Paragraph('Order Details', section_heading), details_table]]
    ]
    info_table = Table(info_data, colWidths=[250, 265])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 30))
    
    # 3. Itemized Table
    items_data = [
        [
            Paragraph('Product / Description', table_header),
            Paragraph('Price', table_header),
            Paragraph('Qty', table_header),
            Paragraph('Total', table_header)
        ]
    ]
    
    for item in order.items.all():
        items_data.append([
            Paragraph(f'<b>{item.product_name}</b>', table_body),
            Paragraph(f'INR {item.price}', table_body),
            Paragraph(str(item.quantity), table_body),
            Paragraph(f'INR {item.get_cost()}', table_body_bold)
        ])
        
    items_table = Table(items_data, colWidths=[260, 95, 60, 100])
    table_styles = [
        ('BACKGROUND', (0,0), (-1,0), light_bg),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1,0), 1, border_color),
    ]
    # Add light border between item rows
    for r in range(1, len(items_data)):
        table_styles.append(('LINEBELOW', (0, r), (-1, r), 0.5, border_color))
        
    items_table.setStyle(TableStyle(table_styles))
    story.append(items_table)
    story.append(Spacer(1, 20))
    
    # 4. Grand Total Section
    total_data = [
        [
            "",
            Paragraph('Grand Total:', grand_total_label),
            Paragraph(f'INR {order.total_cost}', grand_total_val)
        ]
    ]
    total_table = Table(total_data, colWidths=[260, 100, 155])
    total_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (1,0), (-1,-1), light_bg),
        ('TOPPADDING', (1,0), (-1,-1), 15),
        ('BOTTOMPADDING', (1,0), (-1,-1), 15),
        ('BOX', (1,0), (-1,-1), 1, border_color),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 50))
    
    # 5. Footer Notes
    story.append(Paragraph('<b>Thank you for choosing The Pet Portal!</b>', ParagraphStyle('FootBold', parent=disclaimer_style, fontName='Helvetica-Bold', textColor=colors.HexColor("#64748b"))))
    story.append(Spacer(1, 4))
    story.append(Paragraph('This is a computer-generated invoice and does not require a physical signature.', disclaimer_style))
    
    # Build Document
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def send_invoice_email(order):
    subject = f"Digital Invoice for Order {order.order_id}"
    body = f"""Hello {order.full_name},

Thank you for your purchase! and your order status is: {order.status}.

Order Summary:
Customer Name: {order.full_name}
Mobile Number: {order.mobile_number}
Transaction ID: {order.razorpay_payment_id or 'COD'}
Total Amount: INR {order.total_cost}

Please find the detailed invoice PDF attached.

Best regards,
Pet Portal Team"""

    pdf_file = None
    try:
        pdf_file = generate_invoice_pdf_reportlab(order)
    except Exception as e:
        print("Error generating invoice PDF for email using ReportLab:", e)

    try:
        email = EmailMessage(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [order.email]
        )
        if pdf_file:
            email.attach(f"Invoice_{order.order_id}.pdf", pdf_file, "application/pdf")
        email.send(fail_silently=False)
        print(f"Successfully sent invoice email for order {order.order_id} to {order.email}")
    except Exception as e:
        print("Failed to send invoice email:", e)


def get_dashboard_redirect_url(role):
    redirects = {
        'customer': '/pets/',
        'pet_care': '/dashboard/pet-care/',
        'pet_grooming': '/dashboard/grooming/',
        'doctor': '/dashboard/doctor/',
        'pet_seller': '/dashboard/pet-seller/',
        'product_seller': '/dashboard/product-seller/',
        'accessory_seller': '/dashboard/accessory-seller/',
        'master_admin': '/dashboard/master-admin/'
    }
    return redirects.get(role, '/pets/')

@login_required
def login_redirect_view(request):
    if request.user.is_superuser:
        return redirect('/dashboard/master-admin/')
    try:
        profile = request.user.profile
        return redirect(get_dashboard_redirect_url(profile.role))
    except UserProfile.DoesNotExist:
        return redirect('/pets/')

# =====================================================
# THIN PAGE VIEWS (LEGACY TEMPLATES RENDERING AS SHELLS)
# =====================================================

def welcome(request):
    return HttpResponse("welcome to the myapp application")

def home(request):
    return render(request, 'myapp/home.html')

def about(request):
    return render(request, 'myapp/about.html')

def contact(request):
    return render(request, 'myapp/contact.html')

def forgot_password_view(request):
    return render(request, 'myapp/forgot_password.html')

def register(request):
    return render(request, 'myapp/register.html')

def user_login(request):
    return render(request, 'myapp/login.html')

def logout_view(request):
    save_session_cart_to_db(request)
    logout(request)
    return redirect('home')

@login_required
def pets(request):
    return render(request, 'myapp/pets.html')

@login_required
def cart_detail(request):
    return render(request, 'myapp/cart.html')

@login_required
def checkout(request):
    return render(request, 'myapp/checkout.html')

@login_required
def order_success(request, order_id):
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    return render(request, 'myapp/order_success.html', {'order': order})

@login_required
def order_history(request):
    return render(request, 'myapp/order_history.html')

@login_required
def track_order(request):
    order = None
    timeline = []

    if request.method == 'POST':
        order_id_input = request.POST.get('order_id', '').strip()
        if order_id_input:
            try:
                order = Order.objects.get(order_id=order_id_input, user=request.user)
            except (Order.DoesNotExist, ValueError):
                from django.contrib import messages as msg
                msg.error(request, 'No order found with that ID. Please check and try again.')

    if order and order.status != 'CANCELLED':
        # Build the timeline steps like Amazon/Flipkart
        STATUS_FLOW = [
            ('CONFIRMED', 'Order Confirmed', 'Your order has been placed and confirmed successfully.', order.confirmed_at),
            ('PROCESSING', 'Processing', 'Your order is being prepared and packed.', order.processing_at),
            ('SHIPPED', 'Shipped', 'Your package is on its way to the delivery hub.', order.shipped_at),
            ('DELIVERED', 'Delivered', 'Your order has been delivered. Enjoy!', order.delivered_at),
        ]

        # Find current status index
        status_order = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
        current_index = status_order.index(order.status) if order.status in status_order else -1

        for i, (status_key, label, desc, timestamp) in enumerate(STATUS_FLOW):
            step = {
                'label': label,
                'desc': desc,
                'time': timestamp,
                'completed': i < current_index or (i == current_index and timestamp),
                'active': i == current_index and not (i < current_index),
            }
            # The current step is active; steps before it are completed
            if i < current_index:
                step['completed'] = True
                step['active'] = False
            elif i == current_index:
                step['completed'] = True
                step['active'] = True
            else:
                step['completed'] = False
                step['active'] = False
            timeline.append(step)

    return render(request, 'myapp/track_order.html', {
        'order': order,
        'timeline': timeline,
    })

@login_required
def profile_view(request):
    return render(request, 'myapp/profile.html')

@login_required
def consult_doctor(request):
    return render(request, 'myapp/consult_doctor.html')

@login_required
def appointment_history(request):
    return render(request, 'myapp/appointment_history.html')

@login_required
def pet_care_booking(request):
    return render(request, 'myapp/pet_care_form.html')

@login_required
def pet_care_history(request):
    return render(request, 'myapp/pet_care_history.html')

@login_required
def grooming_booking(request):
    return render(request, 'myapp/grooming_form.html')

@login_required
def grooming_history(request):
    return render(request, 'myapp/grooming_history.html')

@login_required
def pet_detail(request, pk):
    return render(request, 'myapp/pet_detail.html', {'pk': pk})

@login_required
def food_detail(request, pk):
    return render(request, 'myapp/food_detail.html', {'pk': pk})

@login_required
def accessory_detail(request, pk):
    return render(request, 'myapp/accessory_detail.html', {'pk': pk})

@login_required
def admin_ai_dashboard(request):
    if not request.user.is_superuser:
        return redirect("home")
    return render(request, 'myapp/admin_ai_dashboard.html')

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
    if request.user.is_superuser:
        order = get_object_or_404(Order, order_id=order_id)
    else:
        order = get_object_or_404(Order, order_id=order_id, user=request.user)

    pdf_file = generate_invoice_pdf_reportlab(order)

    response = HttpResponse(pdf_file, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Invoice_{order.order_id}.pdf"'
    return response

# =====================================================
# ROLE-BASED DASHBOARD VIEWS (HTML ROUTING SHELLS)
# =====================================================

@login_required
def dashboard_pet_care(request):
    profile = getattr(request.user, 'profile', None)
    if not (request.user.is_superuser or request.user.is_staff or (profile and profile.role == 'pet_care')):
        return redirect("home")
    return render(request, 'myapp/dashboard_pet_care.html')

@login_required
def dashboard_grooming(request):
    profile = getattr(request.user, 'profile', None)
    if not (request.user.is_superuser or request.user.is_staff or (profile and profile.role == 'pet_grooming')):
        return redirect("home")
    return render(request, 'myapp/dashboard_grooming.html')

@login_required
def dashboard_doctor(request):
    profile = getattr(request.user, 'profile', None)
    if not (request.user.is_superuser or request.user.is_staff or (profile and profile.role == 'doctor')):
        return redirect("home")
    return render(request, 'myapp/dashboard_doctor.html')

@login_required
def dashboard_pet_seller(request):
    profile = getattr(request.user, 'profile', None)
    if not (request.user.is_superuser or request.user.is_staff or (profile and profile.role == 'pet_seller')):
        return redirect("home")
    return render(request, 'myapp/dashboard_pet_seller.html')

@login_required
def dashboard_product_seller(request):
    profile = getattr(request.user, 'profile', None)
    if not (request.user.is_superuser or request.user.is_staff or (profile and profile.role == 'product_seller')):
        return redirect("home")
    return render(request, 'myapp/dashboard_product_seller.html')

@login_required
def dashboard_accessory_seller(request):
    profile = getattr(request.user, 'profile', None)
    if not (request.user.is_superuser or request.user.is_staff or (profile and profile.role == 'accessory_seller')):
        return redirect("home")
    return render(request, 'myapp/dashboard_accessory_seller.html')

@login_required
def dashboard_master_admin(request):
    profile = getattr(request.user, 'profile', None)
    if not (request.user.is_superuser or request.user.is_staff or (profile and profile.role == 'master_admin')):
        return redirect("home")
    return render(request, 'myapp/dashboard_master_admin.html')

# =====================================================
# BACKEND REST API ENDPOINTS (DRF)
# =====================================================

@api_view(['POST'])
def api_register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role', 'customer')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    phone = request.data.get('phone', '')

    if not username or not email or not password:
        return Response({"error": "Username, email, and password are required."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists."}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already exists."}, status=400)

    from django.contrib.auth.hashers import make_password
    hashed = make_password(password)

    otp = str(random.randint(100000, 999999))
    
    # Delete any legacy/expired pending registrations to avoid IntegrityError due to unique constraints
    PendingRegistration.objects.filter(email=email).delete()
    PendingRegistration.objects.filter(username=username).delete()
    
    PendingRegistration.objects.create(
        username=username,
        email=email,
        password=hashed,
        role=role,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        otp=otp
    )

    send_otp_email(email, otp)
    
    from django.conf import settings
    response_data = {"success": True, "message": "OTP has been emailed. Please verify."}
    if not getattr(settings, 'EMAIL_HOST_PASSWORD', ''):
        response_data["dev_otp"] = otp
    return Response(response_data)

@api_view(['POST'])
def api_verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')

    if not email or not otp:
        return Response({"error": "Email and OTP are required."}, status=400)

    try:
        pending = PendingRegistration.objects.get(email=email, otp=otp)
    except PendingRegistration.DoesNotExist:
        return Response({"error": "Invalid verification code or email."}, status=400)

    # Enforce 10 minutes OTP expiration
    time_elapsed = timezone.now() - pending.created_at
    if time_elapsed > timedelta(minutes=10):
        pending.delete()
        return Response({"error": "This verification code has expired. Please register again to get a new code."}, status=400)

    with transaction.atomic():
        # Prevent race condition where email or username was taken right after registration
        if User.objects.filter(email=pending.email).exists():
            return Response({"error": "This email has already been registered by another user."}, status=400)
        if User.objects.filter(username=pending.username).exists():
            return Response({"error": "This username has already been registered by another user."}, status=400)

        user = User.objects.create(
            username=pending.username,
            email=pending.email,
            password=pending.password,
            first_name=pending.first_name,
            last_name=pending.last_name
        )
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.role = pending.role
        profile.phone = pending.phone
        profile.save()
        
        # Explicitly assign updated profile to prevent post_save signals from overwriting role back to default 'customer'
        user.profile = profile
        
        pending.delete()

        auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    return Response({
        "success": True,
        "role": profile.role,
        "redirect_url": get_dashboard_redirect_url(profile.role)
    })

from myapp.models import PasswordReset

@api_view(['POST'])
def api_forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email is required."}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "No user account exists with this email address."}, status=400)
    
    otp = str(random.randint(100000, 999999))
    PasswordReset.objects.filter(email=email).delete()
    PasswordReset.objects.create(email=email, otp=otp)
    
    # Send OTP
    subject = "Reset your Password - Pet Portal"
    message = f"Your verification code to reset your password is: {otp}. It is valid for 10 minutes."
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True
    )
    
    response_data = {"success": True, "message": "OTP has been emailed. Please verify."}
    if not getattr(settings, 'EMAIL_HOST_PASSWORD', ''):
        response_data["dev_otp"] = otp
    return Response(response_data)

@api_view(['POST'])
def api_verify_reset_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    if not email or not otp:
        return Response({"error": "Email and OTP are required."}, status=400)
    
    try:
        reset_obj = PasswordReset.objects.get(email=email, otp=otp)
    except PasswordReset.DoesNotExist:
        return Response({"error": "Invalid verification code or email."}, status=400)
    
    # Enforce 10 minutes expiration check
    time_elapsed = timezone.now() - reset_obj.created_at
    if time_elapsed > timedelta(minutes=10):
        reset_obj.delete()
        return Response({"error": "This verification code has expired. Please request a new code."}, status=400)

    reset_obj.is_verified = True
    reset_obj.save()
    
    return Response({"success": True, "message": "OTP verified successfully. You can now reset your password."})

@api_view(['POST'])
def api_reset_password(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({"error": "Email and new password are required."}, status=400)
    
    try:
        reset_obj = PasswordReset.objects.get(email=email, is_verified=True)
    except PasswordReset.DoesNotExist:
        return Response({"error": "Verification session has expired or is invalid. Please start over."}, status=400)

    # Double check that verification session was created in the last 15 minutes max
    time_elapsed = timezone.now() - reset_obj.created_at
    if time_elapsed > timedelta(minutes=15):
        reset_obj.delete()
        return Response({"error": "Verification session has expired. Please request a new code."}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User account not found."}, status=400)
    
    from django.contrib.auth.hashers import make_password
    user.password = make_password(password)
    user.save()
    
    # Delete reset object
    reset_obj.delete()
    
    # Automatically log the user in
    auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    
    profile, created = UserProfile.objects.get_or_create(user=user)
    return Response({
        "success": True,
        "message": "Password reset successful.",
        "redirect_url": get_dashboard_redirect_url(profile.role)
    })

@api_view(['POST'])
def api_login(request):
    username_email = request.data.get('username_email')
    password = request.data.get('password')

    cart_before_login = normalize_cart(request.session.get('cart', {}))

    user = authenticate(request, username=username_email, password=password)
    if user is None:
        try:
            user_obj = User.objects.get(email=username_email)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None

    if user:
        auth_login(request, user)
        if not request.session.session_key:
            request.session.create()
        request.session['cart'] = cart_before_login
        request.session.modified = True
        load_user_cart_into_session(request)

        profile, created = UserProfile.objects.get_or_create(user=user)
        if user.is_superuser:
            profile.role = 'master_admin'
            profile.save()

        return Response({
            "success": True,
            "role": profile.role,
            "redirect_url": get_dashboard_redirect_url(profile.role)
        })

    return Response({"error": "Invalid credentials."}, status=400)

@api_view(['POST', 'GET'])
def api_logout(request):
    save_session_cart_to_db(request)
    logout(request)
    return Response({"success": True})

@api_view(['GET'])
def api_catalog(request):
    q = request.GET.get('q', '').strip()
    species = request.GET.get('species', '').strip()
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    fresh = request.GET.get('fresh')

    pets = Pet.objects.all().order_by('-date_added')
    foods = Food.objects.all().order_by('expire_date')
    accessories = Accessory.objects.all().order_by('-date_added')

    if q:
        q_lower = q.lower()
        # Synonyms mapping
        species_keywords = []
        if 'dog' in q_lower or 'puppy' in q_lower or 'canine' in q_lower:
            species_keywords.append('dog')
        if 'cat' in q_lower or 'kitten' in q_lower or 'feline' in q_lower:
            species_keywords.append('cat')
        if 'rabbit' in q_lower or 'bunny' in q_lower:
            species_keywords.append('rabbit')
        if 'bird' in q_lower or 'parrot' in q_lower:
            species_keywords.append('bird')

        pet_filter = Q(name__icontains=q) | Q(description__icontains=q) | Q(species__icontains=q)
        food_filter = Q(name__icontains=q) | Q(description__icontains=q) | Q(food_type__icontains=q)
        acc_filter = Q(name__icontains=q) | Q(description__icontains=q) | Q(category__icontains=q) | Q(pet_type__icontains=q)

        # Apply keyword/synonym match queries across items
        for keyword in species_keywords:
            pet_filter |= Q(species__icontains=keyword)
            food_filter |= Q(name__icontains=keyword) | Q(description__icontains=keyword) | Q(food_type__icontains=keyword)
            acc_filter |= Q(name__icontains=keyword) | Q(description__icontains=keyword) | Q(pet_type__icontains=keyword)

        pets = pets.filter(pet_filter)
        foods = foods.filter(food_filter)
        accessories = accessories.filter(acc_filter)

    if species:
        pets = pets.filter(species__iexact=species)
        foods = foods.filter(Q(name__icontains=species) | Q(description__icontains=species) | Q(food_type__icontains=species))
        accessories = accessories.filter(Q(name__icontains=species) | Q(description__icontains=species) | Q(pet_type__icontains=species))

    if min_price:
        pets = pets.filter(price__gte=min_price)
        foods = foods.filter(price__gte=min_price)
        accessories = accessories.filter(price__gte=min_price)

    if max_price:
        pets = pets.filter(price__lte=max_price)
        foods = foods.filter(price__lte=max_price)
        accessories = accessories.filter(price__lte=max_price)

    if fresh:
        foods = foods.filter(expire_date__gt=date.today())

    # Build response context
    pet_data = PetSerializer(pets, many=True, context={'request': request}).data
    food_data = FoodSerializer(foods, many=True, context={'request': request}).data
    acc_data = AccessorySerializer(accessories, many=True, context={'request': request}).data

    cart = normalize_cart(request.session.get('cart', {}))
    cart_count = sum(item['quantity'] for item in cart.values())

    return Response({
        "pets": pet_data,
        "foods": food_data,
        "accessories": acc_data,
        "cart_count": cart_count
    })

@api_view(['GET'])
def api_home_data(request):
    pets = Pet.objects.all().order_by('-date_added')[:6]
    foods = Food.objects.all().order_by('expire_date')[:6]
    accessories = Accessory.objects.all().order_by('-date_added')[:6]

    pet_data = PetSerializer(pets, many=True, context={'request': request}).data
    food_data = FoodSerializer(foods, many=True, context={'request': request}).data
    acc_data = AccessorySerializer(accessories, many=True, context={'request': request}).data

    cart = normalize_cart(request.session.get('cart', {}))
    cart_count = sum(item['quantity'] for item in cart.values())

    return Response({
        "pets": pet_data,
        "foods": food_data,
        "accessories": acc_data,
        "cart_count": cart_count
    })

def get_review_stats(reviews_queryset):
    total = reviews_queryset.count()
    if total == 0:
        return {
            "total_ratings": 0,
            "average_rating": 0.0,
            "stars_percentages": {
                "5": 0,
                "4": 0,
                "3": 0,
                "2": 0,
                "1": 0
            }
        }
    
    avg = reviews_queryset.aggregate(Avg('rating'))['rating__avg'] or 0.0
    percentages = {}
    for stars in range(1, 6):
        count = reviews_queryset.filter(rating=stars).count()
        percentages[str(stars)] = int(round((count / total) * 100))
        
    return {
        "total_ratings": total,
        "average_rating": round(float(avg), 1),
        "stars_percentages": percentages
    }

@api_view(['GET'])
def api_pet_detail(request, pk):
    pet = get_object_or_404(Pet, id=pk)
    data = PetSerializer(pet, context={'request': request}).data
    reviews = Review.objects.filter(pet=pet).order_by('-created_at')
    data['reviews'] = ReviewSerializer(reviews, many=True, context={'request': request}).data
    data['rating_stats'] = get_review_stats(reviews)
    return Response(data)

@api_view(['GET'])
def api_food_detail(request, pk):
    food = get_object_or_404(Food, id=pk)
    data = FoodSerializer(food, context={'request': request}).data
    reviews = Review.objects.filter(food=food).order_by('-created_at')
    data['reviews'] = ReviewSerializer(reviews, many=True, context={'request': request}).data
    data['rating_stats'] = get_review_stats(reviews)
    return Response(data)

@api_view(['GET'])
def api_accessory_detail(request, pk):
    acc = get_object_or_404(Accessory, id=pk)
    data = AccessorySerializer(acc, context={'request': request}).data
    reviews = Review.objects.filter(accessory=acc).order_by('-created_at')
    data['reviews'] = ReviewSerializer(reviews, many=True, context={'request': request}).data
    data['rating_stats'] = get_review_stats(reviews)
    return Response(data)

@api_view(['GET', 'POST', 'DELETE'])
def api_cart(request):
    cart = normalize_cart(request.session.get('cart', {}))

    if request.method == 'GET':
        from myapp.models import CheckoutSetting
        settings_obj = CheckoutSetting.objects.first()
        if not settings_obj:
            # Create a default settings instance if none exists
            settings_obj = CheckoutSetting.objects.create(
                name="Default Settings",
                tax=10.00,
                delivery_fee=50.00,
                gst_percent=18.00,
                platform_fee=5.00
            )
        
        subtotal = sum(item['price'] * item['quantity'] for item in cart.values())
        gst_amount = round((subtotal * float(settings_obj.gst_percent)) / 100, 2)
        total_price = subtotal + float(settings_obj.tax) + float(settings_obj.delivery_fee) + gst_amount + float(settings_obj.platform_fee)

        return Response({
            "items": list(cart.values()),
            "subtotal": subtotal,
            "tax": float(settings_obj.tax),
            "delivery_fee": float(settings_obj.delivery_fee),
            "gst_percent": float(settings_obj.gst_percent),
            "gst_amount": gst_amount,
            "platform_fee": float(settings_obj.platform_fee),
            "total_price": total_price,
            "cart_count": len(cart)
        })

    elif request.method == 'POST':
        item_type = request.data.get('item_type')
        item_id = int(request.data.get('item_id', 0))
        quantity = int(request.data.get('quantity', 1))

        # Enforce max quantity of 1 for pets
        if item_type == 'pet' and quantity > 1:
            quantity = 1

        if not item_type or not item_id:
            return Response({"error": "Item type and ID are required"}, status=400)

        name = ""
        price = 0.00
        if item_type == 'pet':
            item = get_object_or_404(Pet, id=item_id)
            name = item.name
            price = float(item.price)
        elif item_type == 'food':
            item = get_object_or_404(Food, id=item_id)
            name = item.name
            price = float(item.price)
        elif item_type == 'accessory':
            item = get_object_or_404(Accessory, id=item_id)
            name = item.name
            price = float(item.price)

        image_url = item.image.url if (hasattr(item, 'image') and item.image) else None
        key = f"{item_type}_{item_id}"
        if key in cart:
            cart[key]['quantity'] = quantity
        else:
            cart[key] = {
                'id': item_id,
                'type': item_type,
                'name': name,
                'price': price,
                'quantity': quantity,
                'image_url': image_url
            }

        request.session['cart'] = cart
        request.session.modified = True
        
        if request.user.is_authenticated:
            save_session_cart_to_db(request)

        return Response({"success": True, "cart": list(cart.values())})

    elif request.method == 'DELETE':
        item_type = request.data.get('item_type')
        item_id = int(request.data.get('item_id', 0))
        
        key = f"{item_type}_{item_id}"
        if key in cart:
            del cart[key]
            request.session['cart'] = cart
            request.session.modified = True
            if request.user.is_authenticated:
                CartItem.objects.filter(user=request.user, item_type=item_type, item_id=item_id).delete()

        return Response({"success": True, "cart": list(cart.values())})

@api_view(['POST'])
def api_checkout(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)

    cart = request.session.get('cart', {})
    if not cart:
        return Response({"error": "Cart is empty"}, status=400)

    from myapp.models import CheckoutSetting
    settings_obj = CheckoutSetting.objects.first()
    if not settings_obj:
        settings_obj = CheckoutSetting.objects.create(
            name="Default Settings",
            tax=10.00,
            delivery_fee=50.00,
            gst_percent=18.00,
            platform_fee=5.00
        )
    
    cart = normalize_cart(cart)
    subtotal = sum(item['price'] * item['quantity'] for item in cart.values())
    gst_amount = round((subtotal * float(settings_obj.gst_percent)) / 100, 2)
    final_total_price = subtotal + float(settings_obj.tax) + float(settings_obj.delivery_fee) + gst_amount + float(settings_obj.platform_fee)

    full_name = request.data.get('full_name')
    email = request.data.get('email')
    mobile_number = request.data.get('mobile_number')
    address = request.data.get('address')
    city = request.data.get('city')
    postal_code = request.data.get('postal_code')
    payment_method = request.data.get('payment_method', 'COD')

    if not all([full_name, email, address, city, postal_code]):
        return Response({"error": "All fields are required"}, status=400)

    if payment_method == 'COD':
        order = Order.objects.create(
            user=request.user,
            full_name=full_name,
            email=email,
            mobile_number=mobile_number,
            address=address,
            city=city,
            postal_code=postal_code,
            total_cost=final_total_price,
            tax=settings_obj.tax,
            delivery_fee=settings_obj.delivery_fee,
            gst=gst_amount,
            platform_fee=settings_obj.platform_fee,
            payment_method='COD',
            payment_status='UNPAID',
            status='CONFIRMED',
            confirmed_at=timezone.now()
        )
        for item in cart.values():
            OrderItem.objects.create(
                order=order,
                product_name=item['name'],
                price=item['price'],
                quantity=item['quantity']
            )
        request.session['cart'] = {}
        request.session.modified = True

        # Clear DB cart items for this user
        if request.user.is_authenticated:
            CartItem.objects.filter(user=request.user).delete()

        # Send invoice email in background thread so response is instant
        threading.Thread(target=send_invoice_email, args=(order,), daemon=True).start()
        return Response({"success": True, "order_id": str(order.order_id)})

    elif payment_method == 'RAZORPAY':
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        razorpay_order = client.order.create({
            "amount": int(final_total_price * 100),
            "currency": settings.RAZORPAY_CURRENCY,
            "payment_capture": 1
        })

        request.session['pending_order'] = {
            "form_data": {
                "full_name": full_name,
                "email": email,
                "mobile_number": mobile_number,
                "address": address,
                "city": city,
                "postal_code": postal_code
            },
            "cart": cart,
            "total_price": float(final_total_price),
            "tax": float(settings_obj.tax),
            "delivery_fee": float(settings_obj.delivery_fee),
            "gst": float(gst_amount),
            "platform_fee": float(settings_obj.platform_fee),
            "razorpay_order_id": razorpay_order['id']
        }
        request.session.modified = True

        return Response({
            "success": True,
            "razorpay": {
                "key": settings.RAZORPAY_KEY_ID,
                "amount": int(final_total_price * 100),
                "order_id": razorpay_order['id'],
                "currency": settings.RAZORPAY_CURRENCY,
                "callback_url": request.build_absolute_uri('/payment/verify/')
            }
        })



@api_view(['POST'])
def api_payment_verify(request):
    razorpay_payment_id = request.data.get("razorpay_payment_id")
    razorpay_order_id = request.data.get("razorpay_order_id")
    razorpay_signature = request.data.get("razorpay_signature")

    pending_order = request.session.get("pending_order")
    if not pending_order:
        # Check if order was already processed via Webhook as a safe fallback
        order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
        if order:
            return Response({"success": True, "order_id": str(order.order_id)})
        return Response({"error": "Session expired or invalid"}, status=400)

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    try:
        client.utility.verify_payment_signature({
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_signature": razorpay_signature,
        })

        # Double check if Webhook already processed the order
        existing_processed_order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
        if existing_processed_order:
            request.session.pop('pending_order', None)
            request.session.modified = True
            return Response({"success": True, "order_id": str(existing_processed_order.order_id)})

        # Check if this is a retry payment for an existing order
        existing_order_id = pending_order.get("existing_order_id")

        if existing_order_id:
            # RETRY PAYMENT: Update existing order instead of creating new one
            order = get_object_or_404(Order, order_id=existing_order_id, user=request.user)
            order.payment_method = "RAZORPAY"
            order.payment_status = "PAID"
            order.razorpay_order_id = razorpay_order_id
            order.razorpay_payment_id = razorpay_payment_id
            order.save()
        else:
            # NEW CHECKOUT: Create a new order
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
                tax=pending_order.get("tax", 0.0),
                delivery_fee=pending_order.get("delivery_fee", 0.0),
                gst=pending_order.get("gst", 0.0),
                platform_fee=pending_order.get("platform_fee", 0.0),
                payment_method="RAZORPAY",
                payment_status="PAID",
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                status="CONFIRMED",
                confirmed_at=timezone.now()
            )

            for item in cart.values():
                OrderItem.objects.create(
                    order=order,
                    product_name=item["name"],
                    price=item["price"],
                    quantity=item["quantity"]
                )

            request.session['cart'] = {}
            # Clear DB cart items
            if request.user.is_authenticated:
                CartItem.objects.filter(user=request.user).delete()

        request.session.pop('pending_order', None)
        request.session.modified = True

        # Send invoice email in background thread
        threading.Thread(target=send_invoice_email, args=(order,), daemon=True).start()
        return Response({"success": True, "order_id": str(order.order_id)})
    except razorpay.errors.SignatureVerificationError:
        return Response({"error": "Signature verification failed"}, status=400)

@csrf_exempt
@api_view(['POST'])
def api_payment_webhook(request):
    """
    Direct server-to-server Razorpay Webhook callback handler.
    Secures payment verification against frontend API spoofing.
    """
    payload = request.body.decode('utf-8')
    signature = request.META.get('HTTP_X_RAZORPAY_SIGNATURE', '')
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

    if not signature or not webhook_secret:
        return Response({"error": "Signature or Webhook Secret missing"}, status=400)

    # Verify Webhook signature using HMAC-SHA256
    expected_signature = hmac.new(
        webhook_secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        return Response({"error": "Invalid signature"}, status=400)

    try:
        event_data = json.loads(payload)
    except Exception:
        return Response({"error": "Invalid JSON"}, status=400)

    event = event_data.get("event")
    
    if event == "payment.captured":
        payment_entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        razorpay_payment_id = payment_entity.get("id")

        if razorpay_order_id:
            # Check if order already exists (created by frontend signature verification)
            order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
            if order:
                if order.payment_status != "PAID":
                    order.payment_status = "PAID"
                    order.razorpay_payment_id = razorpay_payment_id
                    order.save()
                    threading.Thread(target=send_invoice_email, args=(order,), daemon=True).start()
            else:
                # If backend Webhook fires first, we can process order directly if metadata is fetched
                # (Standard practice is fallback sync, return 200 OK so Razorpay knows we received it)
                pass

    return Response({"status": "ok"})


@api_view(['GET'])
def api_orders_list(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)
    if request.user.is_superuser or request.user.is_staff:
        orders = Order.objects.all().order_by('-created_at')
    else:
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return Response(OrderSerializer(orders, many=True).data)

@api_view(['GET', 'PUT'])
def api_order_detail(request, order_id):
    order = get_object_or_404(Order, order_id=order_id)
    
    # Check authorization: superuser, the owner user, or a vendor containing items in this order
    is_authorized = False
    if request.user.is_superuser:
        is_authorized = True
    elif order.user == request.user:
        if request.method == 'GET':
            is_authorized = True
    else:
        role = getattr(request.user.profile, 'role', '')
        if role in ['pet_seller', 'product_seller', 'accessory_seller']:
            # Get names list of items belonging to this vendor
            if role == 'pet_seller':
                # Allow pet sellers to manage all pet-related orders
                names = Pet.objects.values_list('name', flat=True)
            elif role == 'product_seller':
                # Allow product sellers to manage all food-related orders
                names = Food.objects.values_list('name', flat=True)
            elif role == 'accessory_seller':
                # Allow accessory sellers to manage all accessory-related orders
                names = Accessory.objects.values_list('name', flat=True)
            else:
                names = []
            if OrderItem.objects.filter(order=order, product_name__in=names).exists():
                is_authorized = True

    if not is_authorized:
        return Response({"error": "Permission denied"}, status=403)

    if request.method == 'GET':
        return Response(OrderSerializer(order).data)
        
    elif request.method == 'PUT':
        order.full_name = request.data.get('full_name', order.full_name)
        order.email = request.data.get('email', order.email)
        order.mobile_number = request.data.get('mobile_number', order.mobile_number)
        order.address = request.data.get('address', order.address)
        order.city = request.data.get('city', order.city)
        order.postal_code = request.data.get('postal_code', order.postal_code)
        
        status_val = request.data.get('status', order.status)
        if status_val in [choice[0] for choice in Order.STATUS_CHOICES]:
            # Auto-set timestamps when status changes
            if status_val != order.status:
                if status_val == 'CONFIRMED' and not order.confirmed_at:
                    order.confirmed_at = timezone.now()
                elif status_val == 'PROCESSING' and not order.processing_at:
                    order.processing_at = timezone.now()
                elif status_val == 'SHIPPED' and not order.shipped_at:
                    order.shipped_at = timezone.now()
                elif status_val == 'DELIVERED' and not order.delivered_at:
                    order.delivered_at = timezone.now()
                elif status_val == 'CANCELLED' and not order.cancelled_at:
                    order.cancelled_at = timezone.now()
            order.status = status_val
            
        order.payment_method = request.data.get('payment_method', order.payment_method)
        order.payment_status = request.data.get('payment_status', order.payment_status)
        order.razorpay_refund_id = request.data.get('razorpay_refund_id', order.razorpay_refund_id)
        order.razorpay_order_id = request.data.get('razorpay_order_id', order.razorpay_order_id)
        order.razorpay_payment_id = request.data.get('razorpay_payment_id', order.razorpay_payment_id)
        
        # DateTime helper
        def parse_dt(val, current):
            if val == '':
                return None
            if not val:
                return current
            try:
                # Handle ISO formatting
                cleaned = val.replace('Z', '').split('.')[0]
                return timezone.make_aware(datetime.fromisoformat(cleaned))
            except Exception as e:
                print("Error parsing datetime:", e)
                return current

        order.confirmed_at = parse_dt(request.data.get('confirmed_at'), order.confirmed_at)
        order.processing_at = parse_dt(request.data.get('processing_at'), order.processing_at)
        order.shipped_at = parse_dt(request.data.get('shipped_at'), order.shipped_at)
        order.delivered_at = parse_dt(request.data.get('delivered_at'), order.delivered_at)
        order.cancelled_at = parse_dt(request.data.get('cancelled_at'), order.cancelled_at)

        order.save()
        
        send_status_update_email(order.user, f"Order {order.order_id}", order.status)
        return Response(OrderSerializer(order).data)
@api_view(['POST'])
def api_cancel_order(request, order_id):
    order = get_object_or_404(Order, order_id=order_id)
    if order.user != request.user and not request.user.is_superuser:
        return Response({"error": "Denied"}, status=403)
    if order.status == "CANCELLED":
        return Response({"error": "This order is already cancelled"}, status=400)
    if order.status == "DELIVERED":
        return Response({"error": "Delivered orders cannot be cancelled. Please contact customer support for return options."}, status=400)
    if order.status == "SHIPPED":
        return Response({"error": "This order has already been shipped and cannot be cancelled in transit."}, status=400)
    if not order.can_cancel():
        return Response({"error": f"Cannot cancel order in current state ({order.status})"}, status=400)

    # Process Automatic Razorpay Refund
    if order.payment_method == 'RAZORPAY' and order.payment_status == 'PAID' and order.razorpay_payment_id:
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            # Refund full amount
            refund = client.refund.create({
                "payment_id": order.razorpay_payment_id,
                "amount": int(order.total_cost * 100)
            })
            order.razorpay_refund_id = refund.get('id')
            order.payment_status = 'REFUNDED'
        except Exception as e:
            print("Automatic Razorpay refund failed:", e)
            # Log the error but continue cancelling the order; admin can manually refund if needed

    order.status = "CANCELLED"
    order.cancelled_at = timezone.now()
    order.save()

    send_status_update_email(order.user, f"Order {order.order_id}", "CANCELLED")
    return Response({"success": True})

@api_view(['POST'])
def api_update_order_status(request, order_id):
    order = get_object_or_404(Order, order_id=order_id)
    
    # Check authorization: superuser or vendor containing items in this order
    is_authorized = False
    if request.user.is_superuser:
        is_authorized = True
    else:
        role = getattr(request.user.profile, 'role', '')
        if role in ['pet_seller', 'product_seller', 'accessory_seller']:
            if role == 'pet_seller':
                # Allow pet sellers to update status for all pet-related orders
                names = Pet.objects.values_list('name', flat=True)
            elif role == 'product_seller':
                # Allow product sellers to update status for all food-related orders
                names = Food.objects.values_list('name', flat=True)
            elif role == 'accessory_seller':
                # Allow accessory sellers to update status for all accessory-related orders
                names = Accessory.objects.values_list('name', flat=True)
            else:
                names = []
            if OrderItem.objects.filter(order=order, product_name__in=names).exists():
                is_authorized = True

    if not is_authorized:
        return Response({"error": "Permission denied"}, status=403)

    new_status = request.data.get('status')
    if new_status not in [choice[0] for choice in Order.STATUS_CHOICES]:
        return Response({"error": "Invalid status"}, status=400)

    order.status = new_status
    if new_status == 'PROCESSING':
        order.processing_at = timezone.now()
    elif new_status == 'SHIPPED':
        order.shipped_at = timezone.now()
    elif new_status == 'DELIVERED':
        order.delivered_at = timezone.now()
        if order.payment_method == 'COD':
            order.payment_status = 'PAID'
    order.save()

    threading.Thread(target=send_status_update_email, args=(order.user, f"Order {order.order_id}", new_status), daemon=True).start()
    return Response({"success": True})

@api_view(['POST'])
def api_retry_payment(request, order_id):
    order = get_object_or_404(Order, order_id=order_id, user=request.user)
    if order.payment_status == 'PAID':
        return Response({"error": "Already paid"}, status=400)

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    razorpay_order = client.order.create({
        "amount": int(order.total_cost * 100),
        "currency": settings.RAZORPAY_CURRENCY,
        "payment_capture": 1
    })

    # Update order with the new razorpay_order_id
    order.razorpay_order_id = razorpay_order['id']
    order.save()

    # Mark this as a RETRY so api_payment_verify updates existing order
    request.session['pending_order'] = {
        "existing_order_id": str(order.order_id),
        "razorpay_order_id": razorpay_order['id']
    }
    request.session.modified = True

    return Response({
        "razorpay": {
            "key": settings.RAZORPAY_KEY_ID,
            "amount": int(order.total_cost * 100),
            "order_id": razorpay_order['id'],
            "currency": settings.RAZORPAY_CURRENCY,
        }
    })

# =====================================================
# SERVICE APIS (DOCTOR, CARE, GROOMING)
# =====================================================

@api_view(['GET', 'POST'])
def api_doctor_bookings(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)
    profile = getattr(request.user, 'profile', None)

    if request.method == 'GET':
        if profile and profile.role == 'doctor':
            bookings = DoctorAppointment.objects.all().order_by('-appointment_date', '-appointment_time')
        else:
            bookings = DoctorAppointment.objects.filter(user=request.user).order_by('-appointment_date', '-appointment_time')
        return Response(DoctorAppointmentSerializer(bookings, many=True).data)

    elif request.method == 'POST':
        serializer = DoctorAppointmentSerializer(data=request.data)
        if serializer.is_valid():
            try:
                appointment = DoctorAppointment(
                    user=request.user,
                    **serializer.validated_data
                )
                appointment.full_clean()  # Trigger model validation
                appointment.save()
                threading.Thread(target=send_booking_email, args=(request.user, "Doctor Appointment", appointment.appointment_date, appointment.appointment_time, 0.00), daemon=True).start()
                return Response(DoctorAppointmentSerializer(appointment).data, status=201)
            except ValidationError as e:
                msgs = []
                if hasattr(e, 'message_dict'):
                    for field_msgs in e.message_dict.values():
                        msgs.extend(field_msgs)
                else:
                    msgs = [str(e)]
                return Response({"error": '; '.join(msgs)}, status=400)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
def api_cancel_doctor_booking(request, pk):
    appointment = get_object_or_404(DoctorAppointment, id=pk)
    if appointment.user != request.user and not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'doctor':
            return Response({"error": "Permission denied"}, status=403)
    appointment.status = 'CANCELLED'
    appointment.save()
    threading.Thread(target=send_status_update_email, args=(appointment.user, f"Doctor Appointment ({appointment.appointment_date})", "CANCELLED"), daemon=True).start()
    return Response({"success": True})

@api_view(['GET', 'POST'])
def api_pet_care_bookings(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)
    profile = getattr(request.user, 'profile', None)

    if request.method == 'GET':
        if profile and profile.role == 'pet_care':
            bookings = PetCareBooking.objects.all().order_by('-start_datetime')
        else:
            bookings = PetCareBooking.objects.filter(user=request.user).order_by('-start_datetime')
        return Response(PetCareBookingSerializer(bookings, many=True).data)

    elif request.method == 'POST':
        serializer = PetCareBookingSerializer(data=request.data)
        if serializer.is_valid():
            try:
                booking = PetCareBooking(
                    user=request.user,
                    pet_name=serializer.validated_data['pet_name'],
                    pet_species=serializer.validated_data['pet_species'],
                    pet_age=serializer.validated_data['pet_age'],
                    pet_gender=serializer.validated_data.get('pet_gender', ''),
                    health_notes=serializer.validated_data.get('health_notes', ''),
                    vaccinated=serializer.validated_data.get('vaccinated', False),
                    special_diet=serializer.validated_data.get('special_diet', False),
                    injection_required=serializer.validated_data.get('injection_required', False),
                    vaccine_required=serializer.validated_data.get('vaccine_required', False),
                    extra_care=serializer.validated_data.get('extra_care', False),
                    start_datetime=serializer.validated_data['start_datetime'],
                    end_datetime=serializer.validated_data['end_datetime']
                )
                booking.full_clean()
                booking.save()
                threading.Thread(target=send_booking_email, args=(request.user, "Pet Care Boarding", booking.start_datetime.date(), booking.start_datetime.time(), booking.total_price), daemon=True).start()
                return Response(PetCareBookingSerializer(booking).data, status=201)
            except ValidationError as e:
                msgs = []
                if hasattr(e, 'message_dict'):
                    for field_msgs in e.message_dict.values():
                        msgs.extend(field_msgs)
                else:
                    msgs = [str(e)]
                return Response({"error": '; '.join(msgs)}, status=400)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
def api_cancel_pet_care(request, pk):
    booking = get_object_or_404(PetCareBooking, id=pk)
    if booking.user != request.user and not booking.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'pet_care':
            return Response({"error": "Permission denied"}, status=403)
    booking.status = 'CANCELLED'
    booking.save()
    threading.Thread(target=send_status_update_email, args=(booking.user, f"Pet Care Boarding ({booking.start_datetime.date()})", "CANCELLED"), daemon=True).start()
    return Response({"success": True})

@api_view(['GET', 'POST'])
def api_grooming_bookings(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)
    profile = getattr(request.user, 'profile', None)

    if request.method == 'GET':
        if profile and profile.role == 'pet_grooming':
            bookings = GroomingBooking.objects.all().order_by('-appointment_datetime')
        else:
            bookings = GroomingBooking.objects.filter(user=request.user).order_by('-appointment_datetime')
        return Response(GroomingBookingSerializer(bookings, many=True).data)

    elif request.method == 'POST':
        serializer = GroomingBookingSerializer(data=request.data)
        if serializer.is_valid():
            try:
                booking = GroomingBooking(
                    user=request.user,
                    pet_name=serializer.validated_data['pet_name'],
                    pet_type=serializer.validated_data['pet_type'],
                    pet_size=serializer.validated_data['pet_size'],
                    package_type=serializer.validated_data['package_type'],
                    visit_type=serializer.validated_data['visit_type'],
                    preferred_groomer=serializer.validated_data.get('preferred_groomer', ''),
                    appointment_datetime=serializer.validated_data['appointment_datetime']
                )
                booking.full_clean()
                booking.save()
                threading.Thread(target=send_booking_email, args=(request.user, f"Grooming Service ({booking.get_package_type_display()})", booking.appointment_datetime.date(), booking.appointment_datetime.time(), booking.total_price), daemon=True).start()
                return Response(GroomingBookingSerializer(booking).data, status=201)
            except ValidationError as e:
                msgs = []
                if hasattr(e, 'message_dict'):
                    for field_msgs in e.message_dict.values():
                        msgs.extend(field_msgs)
                else:
                    msgs = [str(e)]
                return Response({"error": '; '.join(msgs)}, status=400)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
def api_cancel_grooming(request, pk):
    booking = get_object_or_404(GroomingBooking, id=pk)
    if booking.user != request.user and not booking.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'pet_grooming':
            return Response({"error": "Permission denied"}, status=403)
    booking.status = 'CANCELLED'
    booking.save()
    threading.Thread(target=send_status_update_email, args=(booking.user, f"Pet Grooming Booking ({booking.appointment_datetime.date()})", "CANCELLED"), daemon=True).start()
    return Response({"success": True})

# =====================================================
# USER PROFILE & REVIEWS APIs
# =====================================================

@api_view(['GET', 'POST', 'PUT'])
def api_profile(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(UserProfileSerializer(profile, context={'request': request}).data)

    elif request.method in ['POST', 'PUT']:
        request.user.first_name = request.data.get('first_name', request.user.first_name)
        request.user.last_name = request.data.get('last_name', request.user.last_name)
        request.user.email = request.data.get('email', request.user.email)
        request.user.save()

        profile.phone = request.data.get('phone', profile.phone)
        profile.address = request.data.get('address', profile.address)
        profile.city = request.data.get('city', profile.city)
        profile.postal_code = request.data.get('postal_code', profile.postal_code)

        if 'profile_image' in request.FILES:
            profile.profile_image = request.FILES['profile_image']
        profile.save()

        return Response(UserProfileSerializer(profile, context={'request': request}).data)

@api_view(['GET', 'POST'])
def api_reviews(request):
    if request.method == 'GET':
        rating = request.GET.get('rating')
        is_reported = request.GET.get('is_reported')
        pet_id = request.GET.get('pet_id')
        product_id = request.GET.get('product_id')
        accessory_id = request.GET.get('accessory_id')
        pet_care_id = request.GET.get('pet_care_id')
        grooming_id = request.GET.get('grooming_id')
        doctor_id = request.GET.get('doctor_id')

        reviews = Review.objects.all().order_by('-created_at')
        if rating:
            reviews = reviews.filter(rating=rating)
        if is_reported:
            reviews = reviews.filter(is_reported=(is_reported.lower() == 'true'))
        if pet_id:
            reviews = reviews.filter(pet_id=pet_id)
        if product_id:
            reviews = reviews.filter(product_id=product_id)
        if accessory_id:
            reviews = reviews.filter(accessory_id=accessory_id)
        if pet_care_id:
            reviews = reviews.filter(service_type="PET_CARE")
        if grooming_id:
            reviews = reviews.filter(service_type="GROOMING")
        if doctor_id:
            reviews = reviews.filter(service_type="DOCTOR")

        return Response(ReviewSerializer(reviews, many=True, context={'request': request}).data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'customer':
            return Response({"error": "Only normal customers can submit reviews."}, status=403)

        serializer = ReviewSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            review = serializer.save(user=request.user)
            # Retrieve all files attached with key 'media_files' or individual 'image' and 'video' if any
            media_files = request.FILES.getlist('media_files')
            from .models import ReviewMedia
            for f in media_files:
                # determine if video or image by content type or extension
                is_video = False
                ct = f.content_type or ""
                if "video" in ct or f.name.lower().endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv', '.3gp')):
                    is_video = True
                ReviewMedia.objects.create(review=review, file=f, is_video=is_video)
            return Response(ReviewSerializer(review, context={'request': request}).data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
def api_report_review(request, pk):
    review = get_object_or_404(Review, id=pk)
    review.is_reported = True
    review.save()
    return Response({"success": True, "message": "Review reported."})

@api_view(['POST', 'DELETE'])
def api_moderate_review(request, pk):
    if not request.user.is_superuser:
        return Response({"error": "Admin only"}, status=403)
    review = get_object_or_404(Review, id=pk)
    if request.method == 'DELETE':
        review.delete()
        return Response({"success": True, "message": "Review deleted."})
    elif request.method == 'POST':
        action = request.data.get('action')
        if action == 'approve':
            review.is_reported = False
            review.save()
            return Response({"success": True, "message": "Report cleared."})
    return Response({"error": "Invalid method/action"}, status=400)

@api_view(['POST', 'PUT'])
def api_reply_review(request, pk):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required"}, status=401)
    
    review = get_object_or_404(Review, id=pk)
    user = request.user
    profile = getattr(user, 'profile', None)
    
    if not profile:
        return Response({"error": "User profile missing"}, status=400)
    
    role = profile.role
    is_master = role == 'master_admin' or user.is_superuser

    if request.method == 'PUT':
        reply_id = request.data.get('reply_id')
        reply = get_object_or_404(ReviewReply, id=reply_id, review=review)
        if reply.user != user and not is_master:
            return Response({"error": "You do not have permission to edit this reply."}, status=403)

        reply_text = request.data.get('reply_text', '').strip()
        if not reply_text:
            return Response({"error": "Reply text cannot be empty."}, status=400)

        reply.reply_text = reply_text
        reply.save()
        return Response(ReviewReplySerializer(reply).data)

    # Check permission logic for POST:
    can_reply = False
    if is_master:
        can_reply = True
    elif role == 'pet_seller' and review.pet is not None:
        can_reply = True
    elif role == 'product_seller' and review.product is not None:
        can_reply = True
    elif (role == 'product_seller' or role == 'food_seller') and review.food is not None:
        # Accept either product_seller or dedicated food_seller roles for food reviews
        can_reply = True
    elif (role == 'accessory_seller' or role == 'product_seller') and review.accessory is not None:
        can_reply = True
    elif role == 'doctor' and review.service_type == 'DOCTOR':
        can_reply = True
    elif role == 'pet_care' and review.service_type == 'PET_CARE':
        can_reply = True
    elif role == 'pet_grooming' and review.service_type == 'GROOMING':
        can_reply = True

    if not can_reply:
        return Response({"error": "You do not have permission to reply to this review category."}, status=403)
        
    reply_text = request.data.get('reply_text', '').strip()
    if not reply_text:
        return Response({"error": "Reply text cannot be empty."}, status=400)
        
    reply = ReviewReply.objects.create(
        review=review,
        user=user,
        reply_text=reply_text
    )
    return Response(ReviewReplySerializer(reply).data, status=201)

# =====================================================
# ROLE-BASED DASHBOARD API DATA VIEWS
# =====================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPetCareProvider])
def api_dashboard_pet_care(request):
    bookings = PetCareBooking.objects.all().order_by('-created_at')
    return Response(PetCareBookingSerializer(bookings, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsGroomingProvider])
def api_dashboard_grooming(request):
    bookings = GroomingBooking.objects.all().order_by('-created_at')
    return Response(GroomingBookingSerializer(bookings, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def api_dashboard_doctor(request):
    bookings = DoctorAppointment.objects.all().order_by('-created_at')
    return Response(DoctorAppointmentSerializer(bookings, many=True).data)

def get_vendor_items_orders(user, names_list):
    items = OrderItem.objects.filter(product_name__in=names_list)
    orders = Order.objects.filter(id__in=items.values_list('order_id', flat=True)).distinct().order_by('-created_at')
    return OrderSerializer(orders, many=True).data

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPetSeller])
def api_dashboard_pet_seller(request):
    # Requirement: showing all pets in pet seller dashboard just like manage pets in master admin
    pets = Pet.objects.all().order_by('-date_added')
    
    # Filter orders to only contain items of type pet (which is what pet seller sells)
    orders = Order.objects.filter(
        id__in=OrderItem.objects.filter(product_name__in=Pet.objects.values_list('name', flat=True)).values_list('order_id', flat=True)
    ).distinct().order_by('-created_at')

    # Get reviews only related to pets
    reviews = Review.objects.filter(pet__isnull=False).order_by('-created_at')

    return Response({
        "listings": PetSerializer(pets, many=True, context={'request': request}).data,
        "orders": OrderSerializer(orders, many=True).data,
        "reviews": ReviewSerializer(reviews, many=True, context={'request': request}).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsProductSeller])
def api_dashboard_product_seller(request):
    foods = Food.objects.all().order_by('expire_date')
    
    # Filter orders to only contain food listings
    orders = Order.objects.filter(
        id__in=OrderItem.objects.filter(product_name__in=Food.objects.values_list('name', flat=True)).values_list('order_id', flat=True)
    ).distinct().order_by('-created_at')

    # Get reviews only related to food products
    reviews = Review.objects.filter(food__isnull=False).order_by('-created_at')

    return Response({
        "listings": FoodSerializer(foods, many=True, context={'request': request}).data,
        "orders": OrderSerializer(orders, many=True).data,
        "reviews": ReviewSerializer(reviews, many=True, context={'request': request}).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAccessorySeller])
def api_dashboard_accessory_seller(request):
    acc = Accessory.objects.all().order_by('-date_added')
    
    # Filter orders to only contain accessory listings
    orders = Order.objects.filter(
        id__in=OrderItem.objects.filter(product_name__in=Accessory.objects.values_list('name', flat=True)).values_list('order_id', flat=True)
    ).distinct().order_by('-created_at')

    # Get reviews only related to accessories
    reviews = Review.objects.filter(accessory__isnull=False).order_by('-created_at')

    return Response({
        "listings": AccessorySerializer(acc, many=True, context={'request': request}).data,
        "orders": OrderSerializer(orders, many=True).data,
        "reviews": ReviewSerializer(reviews, many=True, context={'request': request}).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPetCareProvider])
def api_dashboard_pet_care(request):
    # Bookings are specific to the seller (pet care provider)
    bookings = PetCareBooking.objects.all().order_by('-created_at')
    reviews = Review.objects.filter(service_type="PET_CARE").order_by('-created_at')
    return Response({
        "bookings": PetCareBookingSerializer(bookings, many=True).data,
        "reviews": ReviewSerializer(reviews, many=True, context={'request': request}).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsGroomingProvider])
def api_dashboard_grooming(request):
    # Bookings are specific to the seller (grooming provider)
    bookings = GroomingBooking.objects.all().order_by('-created_at')
    reviews = Review.objects.filter(service_type="GROOMING").order_by('-created_at')
    return Response({
        "bookings": GroomingBookingSerializer(bookings, many=True).data,
        "reviews": ReviewSerializer(reviews, many=True, context={'request': request}).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def api_dashboard_doctor(request):
    # Bookings are specific to the seller (doctor)
    bookings = DoctorAppointment.objects.all().order_by('-created_at')
    reviews = Review.objects.filter(service_type="DOCTOR").order_by('-created_at')
    return Response({
        "bookings": DoctorAppointmentSerializer(bookings, many=True).data,
        "reviews": ReviewSerializer(reviews, many=True, context={'request': request}).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_dashboard_master_admin(request):
    # Logs and metrics aggregation
    orders = Order.objects.all().order_by('-created_at')
    appointments = DoctorAppointment.objects.all().order_by('-created_at')
    pet_care = PetCareBooking.objects.all().order_by('-created_at')
    grooming = GroomingBooking.objects.all().order_by('-created_at')
    cart_items = CartItem.objects.all().order_by('-id')
    health_profiles = PetHealthProfile.objects.all().order_by('-id')
    
    return Response({
        "orders": OrderSerializer(orders, many=True).data,
        "appointments": DoctorAppointmentSerializer(appointments, many=True).data,
        "pet_care": PetCareBookingSerializer(pet_care, many=True).data,
        "grooming": GroomingBookingSerializer(grooming, many=True).data,
        "cart_items": CartItemSerializer(cart_items, many=True).data,
        "health_profiles": PetHealthProfileSerializer(health_profiles, many=True).data
    })

# =====================================================
# AI WEEKLY CACHED REPORT ENDPOINT
# =====================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_ai_insights(request):
    # Retrieve latest weekly cached report
    report = AICachedReport.objects.order_by('-created_at').first()
    if not report:
        # Fallback to run live if no report exists, but write warning
        from django.core.management import call_command
        try:
            call_command('run_ai_analytics')
            report = AICachedReport.objects.order_by('-created_at').first()
        except Exception as e:
            return Response({"error": f"Failed to generate analytics cache fallback: {str(e)}"}, status=500)
    
    return Response(report.report_data if report else {"error": "Report not found"})

# =====================================================
# CRUD OPERATIONS FOR MASTER ADMIN
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_products_crud(request):
    if request.method == 'GET':
        prod = products.objects.all()
        return Response(ProductSerializer(prod, many=True, context={'request': request}).data)
    elif request.method == 'POST':
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_product_detail_crud(request, pk):
    prod = get_object_or_404(products, id=pk)
    if request.method == 'GET':
        return Response(ProductSerializer(prod, context={'request': request}).data)
    elif request.method == 'PUT':
        serializer = ProductSerializer(prod, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        prod.delete()
        return Response({"success": True})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsMasterAdmin | IsProductSeller])
def api_admin_foods_crud(request):
    if request.method == 'GET':
        if request.user.is_superuser or request.user.is_staff:
            f = Food.objects.all()
        else:
            f = Food.objects.filter(vendor=request.user)
        return Response(FoodSerializer(f, many=True, context={'request': request}).data)
    elif request.method == 'POST':
        serializer = FoodSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            vendor = request.user
            if request.user.is_superuser or request.user.is_staff:
                vendor_id = request.data.get('vendor')
                if vendor_id:
                    vendor = get_object_or_404(User, id=vendor_id)
            serializer.save(vendor=vendor)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsMasterAdmin | IsProductSeller])
def api_admin_food_detail_crud(request, pk):
    f = get_object_or_404(Food, id=pk)
    # Allow product sellers permission to manage all foods
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user.profile, 'role', '') == 'product_seller'):
        return Response({"error": "Permission denied"}, status=403)
        
    if request.method == 'GET':
        return Response(FoodSerializer(f, context={'request': request}).data)
    elif request.method == 'PUT':
        serializer = FoodSerializer(f, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        f.delete()
        return Response({"success": True})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsMasterAdmin | IsAccessorySeller])
def api_admin_accessories_crud(request):
    if request.method == 'GET':
        if request.user.is_superuser or request.user.is_staff:
            acc = Accessory.objects.all()
        else:
            acc = Accessory.objects.filter(vendor=request.user)
        return Response(AccessorySerializer(acc, many=True, context={'request': request}).data)
    elif request.method == 'POST':
        serializer = AccessorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            vendor = request.user
            if request.user.is_superuser or request.user.is_staff:
                vendor_id = request.data.get('vendor')
                if vendor_id:
                    vendor = get_object_or_404(User, id=vendor_id)
            serializer.save(vendor=vendor)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsMasterAdmin | IsAccessorySeller])
def api_admin_accessory_detail_crud(request, pk):
    acc = get_object_or_404(Accessory, id=pk)
    # Allow accessory sellers permission to manage all accessories
    if not (request.user.is_superuser or request.user.is_staff or getattr(request.user.profile, 'role', '') == 'accessory_seller'):
        return Response({"error": "Permission denied"}, status=403)

    if request.method == 'GET':
        return Response(AccessorySerializer(acc, context={'request': request}).data)
    elif request.method == 'PUT':
        serializer = AccessorySerializer(acc, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        acc.delete()
        return Response({"success": True})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsMasterAdmin | IsPetSeller])
def api_admin_pets_crud(request):
    if request.method == 'GET':
        if request.user.is_superuser or request.user.is_staff:
            p = Pet.objects.all()
        else:
            p = Pet.objects.filter(vendor=request.user)
        return Response(PetSerializer(p, many=True, context={'request': request}).data)
    elif request.method == 'POST':
        serializer = PetSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            vendor = request.user
            if request.user.is_superuser or request.user.is_staff:
                vendor_id = request.data.get('vendor')
                if vendor_id:
                    vendor = get_object_or_404(User, id=vendor_id)
            serializer.save(vendor=vendor)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsMasterAdmin | IsPetSeller])
def api_admin_pet_detail_crud(request, pk):
    p = get_object_or_404(Pet, id=pk)
    if not (request.user.is_superuser or request.user.is_staff or p.vendor == request.user):
        return Response({"error": "Permission denied"}, status=403)

    if request.method == 'GET':
        return Response(PetSerializer(p, context={'request': request}).data)
    elif request.method == 'PUT':
        serializer = PetSerializer(p, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        p.delete()
        return Response({"success": True})

# =====================================================
# SEARCH SUGGESTIONS & CHATBOT APIs
# =====================================================

@login_required
def search_suggestions(request):
    query = request.GET.get('q', '').strip()
    suggestions = []
    if query:
        pet_names = Pet.objects.filter(Q(name__icontains=query) | Q(species__icontains=query)).values_list('name', flat=True)[:5]
        food_names = Food.objects.filter(Q(name__icontains=query) | Q(food_type__icontains=query)).values_list('name', flat=True)[:5]
        suggestions = list(pet_names) + list(food_names)
    return JsonResponse({'suggestions': suggestions})

@csrf_exempt
@require_POST
def chatbot_api(request):
    try:
        data = json.loads(request.body)
        user_message = data.get("message", "").strip()
        if not user_message:
            return JsonResponse({"error": "Empty message"}, status=400)

        # Anonymized chatbot context fetcher wrapper
        if not request.user.is_authenticated:
            context_data = "User is anonymous."
        else:
            user = request.user
            profile = getattr(user, "profile", None)
            context_data = f"User: {user.username}\nRole: {profile.role if profile else 'customer'}\n"
            
            # Fetch Cart Items Context
            from myapp.models import CartItem
            cart_items = CartItem.objects.filter(user=user)
            context_data += "Active Cart Items:\n"
            for item in cart_items:
                context_data += f"- {item.name} ({item.item_type}): Qty {item.quantity}, Price ₹{item.price}\n"
            
            # Fetch Order History Context
            orders = Order.objects.filter(user=user).prefetch_related("items").order_by("-created_at")[:5]
            context_data += "\nRecent Orders:\n"
            for o in orders:
                context_data += f"- Order #{o.order_id}: Status {o.status}, Total ₹{o.total_cost}, Payment Status: {o.payment_status}, Razorpay Payment ID: {o.razorpay_payment_id or 'N/A'}\n"
                for item in o.items.all():
                    context_data += f"  * {item.product_name} (Qty {item.quantity})\n"

            # Fetch Bookings Context
            from myapp.models import DoctorAppointment, PetCareBooking, GroomingBooking
            
            # Doctor Appointments
            doctor_bookings = DoctorAppointment.objects.filter(user=user).order_by("-appointment_date")[:3]
            context_data += "\nDoctor Appointments:\n"
            for db in doctor_bookings:
                context_data += f"- Pet: {db.pet_name} ({db.pet_type}), Date: {db.appointment_date} @ {db.appointment_time}, Status: {db.status}\n"

            # Boarding Bookings
            boarding_bookings = PetCareBooking.objects.filter(user=user).order_by("-start_datetime")[:3]
            context_data += "\nPet Boarding Bookings:\n"
            for bb in boarding_bookings:
                context_data += f"- Pet: {bb.pet_name} ({bb.pet_species}), Start: {bb.start_datetime.date()}, End: {bb.end_datetime.date()}, Status: {bb.status}\n"

            # Grooming Sessions
            grooming_bookings = GroomingBooking.objects.filter(user=user).order_by("-appointment_datetime")[:3]
            context_data += "\nGrooming Bookings:\n"
            for gb in grooming_bookings:
                context_data += f"- Pet: {gb.pet_name} ({gb.pet_type}), Package: {gb.package_type}, Date: {gb.appointment_datetime.date()}, Status: {gb.status}\n"

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        system_instruction = (
            "You are PetPortal AI Assistant, a helpful assistant helping customers. "
            "IMPORTANT: Protect user privacy. Do NOT leak precise billing addresses, email passwords, "
            "or internal database IDs to Gemini or in your response unless explicitly relevant. "
            "Use only the provided contextual information. Be helpful but cautious about sharing private data."
        )
        ai_prompt = f"System Instructions:\n{system_instruction}\n\nContext:\n{context_data}\n\nUser Message: {user_message}\n\nPlease reply professionally to the customer."
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=ai_prompt,
        )
        return JsonResponse({"reply": response.text})
    except Exception as e:
        print("Chatbot API Exception:", e)
        return JsonResponse({"reply": "I apologize, I'm currently unable to process your request."}, status=500)

@api_view(['POST'])
def api_update_doctor_status(request, pk):
    appointment = get_object_or_404(DoctorAppointment, id=pk)
    if not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'doctor':
            return Response({"error": "Denied"}, status=403)
    new_status = request.data.get('status')
    if new_status not in [choice[0] for choice in DoctorAppointment.STATUS_CHOICES]:
        return Response({"error": "Invalid status"}, status=400)
    appointment.status = new_status
    appointment.save()
    send_status_update_email(appointment.user, f"Doctor Appointment ({appointment.appointment_date})", new_status)
    return Response({"success": True})

@api_view(['POST'])
def api_update_care_status(request, pk):
    booking = get_object_or_404(PetCareBooking, id=pk)
    if not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'pet_care':
            return Response({"error": "Denied"}, status=403)
    new_status = request.data.get('status')
    if new_status not in [choice[0] for choice in PetCareBooking.STATUS_CHOICES]:
        return Response({"error": "Invalid status"}, status=400)
    booking.status = new_status
    booking.save()
    send_status_update_email(booking.user, f"Pet Care Boarding ({booking.start_datetime.date()})", new_status)
    return Response({"success": True})

@api_view(['POST'])
def api_update_grooming_status(request, pk):
    booking = get_object_or_404(GroomingBooking, id=pk)
    if not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'pet_grooming':
            return Response({"error": "Denied"}, status=403)
    new_status = request.data.get('status')
    if new_status not in [choice[0] for choice in GroomingBooking.STATUS_CHOICES]:
        return Response({"error": "Invalid status"}, status=400)
    booking.status = new_status
    booking.save()
    send_status_update_email(booking.user, f"Pet Grooming Booking ({booking.appointment_datetime.date()})", new_status)
    return Response({"success": True})

@api_view(['GET', 'PUT'])
def api_doctor_booking_detail(request, pk):
    appointment = get_object_or_404(DoctorAppointment, id=pk)
    if not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'doctor':
            return Response({"error": "Denied"}, status=403)

    if request.method == 'GET':
        return Response(DoctorAppointmentSerializer(appointment).data)
    elif request.method == 'PUT':
        appointment.pet_name = request.data.get('pet_name', appointment.pet_name)
        appointment.pet_type = request.data.get('pet_type', appointment.pet_type)
        
        # date
        app_date = request.data.get('appointment_date')
        if app_date:
            appointment.appointment_date = datetime.strptime(app_date, "%Y-%m-%d").date()
        
        # time
        app_time = request.data.get('appointment_time')
        if app_time:
            if 'T' in app_time:
                app_time = app_time.split('T')[1]
            parts = app_time.split(':')
            appointment.appointment_time = time(int(parts[0]), int(parts[1]))
            
        appointment.symptoms = request.data.get('symptoms', appointment.symptoms)
        
        status = request.data.get('status', appointment.status)
        if status in [c[0] for c in DoctorAppointment.STATUS_CHOICES]:
            appointment.status = status
            
        appointment.save()
        send_status_update_email(appointment.user, f"Doctor Appointment ({appointment.appointment_date})", appointment.status)
        return Response(DoctorAppointmentSerializer(appointment).data)

@api_view(['GET', 'PUT'])
def api_pet_care_booking_detail(request, pk):
    booking = get_object_or_404(PetCareBooking, id=pk)
    if not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'pet_care':
            return Response({"error": "Denied"}, status=403)

    if request.method == 'GET':
        return Response(PetCareBookingSerializer(booking).data)
    elif request.method == 'PUT':
        booking.pet_name = request.data.get('pet_name', booking.pet_name)
        booking.pet_species = request.data.get('pet_species', booking.pet_species)
        booking.pet_age = int(request.data.get('pet_age', booking.pet_age))
        booking.pet_gender = request.data.get('pet_gender', booking.pet_gender)
        booking.health_notes = request.data.get('health_notes', booking.health_notes)
        
        def to_bool(val):
            if val is None:
                return False
            return str(val).lower() in ['true', '1', 'on', 'yes']

        if 'vaccinated' in request.data:
            booking.vaccinated = to_bool(request.data.get('vaccinated'))
        if 'special_diet' in request.data:
            booking.special_diet = to_bool(request.data.get('special_diet'))
        if 'injection_required' in request.data:
            booking.injection_required = to_bool(request.data.get('injection_required'))
        if 'vaccine_required' in request.data:
            booking.vaccine_required = to_bool(request.data.get('vaccine_required'))
        if 'extra_care' in request.data:
            booking.extra_care = to_bool(request.data.get('extra_care'))

        def parse_dt(val, current):
            if not val:
                return current
            try:
                cleaned = val.replace('Z', '').split('.')[0]
                return timezone.make_aware(datetime.fromisoformat(cleaned))
            except Exception:
                return current

        booking.start_datetime = parse_dt(request.data.get('start_datetime'), booking.start_datetime)
        booking.end_datetime = parse_dt(request.data.get('end_datetime'), booking.end_datetime)
        
        status = request.data.get('status', booking.status)
        if status in [c[0] for c in PetCareBooking.STATUS_CHOICES]:
            booking.status = status

        booking.save()
        send_status_update_email(booking.user, f"Pet Care Boarding ({booking.start_datetime.date()})", booking.status)
        return Response(PetCareBookingSerializer(booking).data)

@api_view(['GET', 'PUT'])
def api_grooming_booking_detail(request, pk):
    booking = get_object_or_404(GroomingBooking, id=pk)
    if not request.user.is_superuser:
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'pet_grooming':
            return Response({"error": "Denied"}, status=403)

    if request.method == 'GET':
        return Response(GroomingBookingSerializer(booking).data)
    elif request.method == 'PUT':
        booking.pet_name = request.data.get('pet_name', booking.pet_name)
        booking.pet_type = request.data.get('pet_type', booking.pet_type)
        booking.pet_size = request.data.get('pet_size', booking.pet_size)
        booking.package_type = request.data.get('package_type', booking.package_type)
        booking.visit_type = request.data.get('visit_type', booking.visit_type)
        booking.preferred_groomer = request.data.get('preferred_groomer', booking.preferred_groomer)
        
        def parse_dt(val, current):
            if not val:
                return current
            try:
                cleaned = val.replace('Z', '').split('.')[0]
                return timezone.make_aware(datetime.fromisoformat(cleaned))
            except Exception:
                return current

        booking.appointment_datetime = parse_dt(request.data.get('appointment_datetime'), booking.appointment_datetime)
        
        status = request.data.get('status', booking.status)
        if status in [c[0] for c in GroomingBooking.STATUS_CHOICES]:
            booking.status = status

        booking.save()
        send_status_update_email(booking.user, f"Pet Grooming Booking ({booking.appointment_datetime.date()})", booking.status)
        return Response(GroomingBookingSerializer(booking).data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_users_crud(request):
    if request.method == 'GET':
        profiles = UserProfile.objects.all().select_related('user')
        data = []
        for p in profiles:
            data.append({
                "id": p.id,
                "user_id": p.user.id,
                "username": p.user.username,
                "email": p.user.email,
                "first_name": p.user.first_name,
                "last_name": p.user.last_name,
                "phone": p.phone,
                "address": p.address,
                "city": p.city,
                "postal_code": p.postal_code,
                "role": p.role,
                "profile_image": request.build_absolute_uri(p.profile_image.url) if p.profile_image else None
            })
        return Response(data)

    elif request.method == 'POST':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'customer')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone = request.data.get('phone', '')
        address = request.data.get('address', '')
        city = request.data.get('city', '')
        postal_code = request.data.get('postal_code', '')

        if not username or not email or not password:
            return Response({"error": "Username, email, and password are required."}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists."}, status=400)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            if role == 'master_admin':
                user.is_superuser = True
                user.is_staff = True
                user.save()

            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.phone = phone
            profile.address = address
            profile.city = city
            profile.postal_code = postal_code
            profile.save()

        return Response({"success": True, "user_id": user.id})

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_user_detail_crud(request, pk):
    profile = get_object_or_404(UserProfile, id=pk)
    user = profile.user

    if request.method == 'GET':
        return Response({
            "id": profile.id,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": profile.phone,
            "address": profile.address,
            "city": profile.city,
            "postal_code": profile.postal_code,
            "role": profile.role,
            "profile_image": request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
        })

    elif request.method == 'PUT':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        phone = request.data.get('phone')
        address = request.data.get('address')
        city = request.data.get('city')
        postal_code = request.data.get('postal_code')

        if username and username != user.username:
            if User.objects.filter(username=username).exists():
                return Response({"error": "Username already exists."}, status=400)
            user.username = username

        if email and email != user.email:
            if User.objects.filter(email=email).exists():
                return Response({"error": "Email already exists."}, status=400)
            user.email = email

        if password:
            user.set_password(password)

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name

        if role is not None:
            profile.role = role
            if role == 'master_admin':
                user.is_superuser = True
                user.is_staff = True
            else:
                user.is_superuser = False
                user.is_staff = False

        user.save()

        if phone is not None:
            profile.phone = phone
        if address is not None:
            profile.address = address
        if city is not None:
            profile.city = city
        if postal_code is not None:
            profile.postal_code = postal_code
        profile.save()

        return Response({"success": True})

    elif request.method == 'DELETE':
        if user == request.user:
            return Response({"error": "You cannot delete your own master admin user account."}, status=400)
        user.delete()
        return Response({"success": True})


# =====================================================
# ADDITIONAL ADMIN CRUD FOR CART ITEMS & HEALTH PROFILES
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_cart_items_crud(request):
    if request.method == 'GET':
        items = CartItem.objects.all().order_by('-id')
        return Response(CartItemSerializer(items, many=True).data)
    elif request.method == 'POST':
        # Retrieve user if user_id is provided
        user_id = request.data.get('user')
        if not user_id:
            return Response({"error": "User ID is required"}, status=400)
        user = get_object_or_404(User, id=user_id)
        serializer = CartItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_cart_item_detail_crud(request, pk):
    item = get_object_or_404(CartItem, id=pk)
    if request.method == 'GET':
        return Response(CartItemSerializer(item).data)
    elif request.method == 'PUT':
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        item.delete()
        return Response({"success": True})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_health_profiles_crud(request):
    if request.method == 'GET':
        profiles = PetHealthProfile.objects.all().order_by('-id')
        return Response(PetHealthProfileSerializer(profiles, many=True).data)
    elif request.method == 'POST':
        pet_id = request.data.get('pet')
        if not pet_id:
            return Response({"error": "Pet ID is required"}, status=400)
        pet = get_object_or_404(Pet, id=pet_id)
        if PetHealthProfile.objects.filter(pet=pet).exists():
            return Response({"error": "Health profile already exists for this pet"}, status=400)
        serializer = PetHealthProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pet=pet)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsMasterAdmin])
def api_admin_health_profile_detail_crud(request, pk):
    profile = get_object_or_404(PetHealthProfile, id=pk)
    if request.method == 'GET':
        return Response(PetHealthProfileSerializer(profile).data)
    elif request.method == 'PUT':
        serializer = PetHealthProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        profile.delete()
        return Response({"success": True})


