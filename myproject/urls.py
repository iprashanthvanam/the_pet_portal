






from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from myapp import views

urlpatterns = [

    # ==========================
    # CORE PAGES
    # ==========================
    path('', views.home, name='home'),
    path('home/', views.home, name='home'),
    path('welcome/', views.welcome, name='welcome'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),

    # ==========================
    # CUSTOM AUTH (Your System)
    # ==========================
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # ==========================
    # GOOGLE / ALLAUTH
    # ==========================
    path('accounts/', include('allauth.urls')),

    # ==========================
    # CATALOG
    # ==========================
    path('pets/', views.pets, name='pets'),

    # ==========================
    # CART & ORDERS
    # ==========================
    path('cart/add/<str:item_type>/<int:item_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/', views.cart_detail, name='cart_detail'),
    path('cart/update/', views.update_cart_ajax, name='update_cart_ajax'),
    path('checkout/', views.checkout, name='checkout'),
    path('order/success/<uuid:order_id>/', views.order_success, name='order_success'),
    path('track/', views.track_order, name='track_order'),
    path('orders/', views.order_history, name='order_history'),
    path('order/invoice/<uuid:order_id>/', views.download_invoice, name='download_invoice'),
    path('order/retry-payment/<uuid:order_id>/', views.retry_razorpay_payment, name='retry_payment'),
    path('order/cancel/<uuid:order_id>/', views.cancel_order, name='cancel_order'),

    # ==========================
    # PAYMENTS
    # ==========================
    path('payment/verify/', views.payment_verify, name='payment_verify'),
    path('payment/verify-status/<str:razorpay_order_id>/', views.payment_verify_status),
    path('payment/webhook/', views.razorpay_webhook, name='razorpay_webhook'),

    # ==========================
    # POLICIES
    # ==========================
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),
    path('terms-and-conditions/', views.terms_and_conditions, name='terms_and_conditions'),
    path('refund-policy/', views.refund_policy, name='refund_policy'),
    path('shipping-policy/', views.shipping_policy, name='shipping_policy'),
    path('contact-us/', views.contact_us, name='contact_us'),

    # ==========================
    # ADMIN
    # ==========================
    path('admin/', admin.site.urls),


    # Product Detail Pages
    path('pet/<int:pk>/', views.pet_detail, name='pet_detail'),
    path('food/<int:pk>/', views.food_detail, name='food_detail'),

    path('cart/', views.cart_detail, name='cart'),

    path('search-suggestions/', views.search_suggestions, name='search_suggestions'),

    path('api/home-data/', views.home_api, name='home_api'),

    path('api/chatbot/', views.chatbot_api, name='chatbot_api'),

    path('profile/', views.profile_view, name='profile'),


    # Doctor Consultation
    path('consult/', views.consult_doctor, name='consult_doctor'),
    path('appointments/', views.appointment_history, name='appointment_history'),
    path('appointments/cancel/<int:appointment_id>/', views.cancel_appointment, name='cancel_appointment'),


    # Pet Care Boarding
    path('pet-care/', views.pet_care_booking, name='pet_care'),
    path('pet-care/history/', views.pet_care_history, name='pet_care_history'),
    path('pet-care/cancel/<int:booking_id>/', views.cancel_pet_care, name='cancel_pet_care'),


    # Grooming Service
    path('grooming/', views.grooming_booking, name='grooming'),
    path('grooming/history/', views.grooming_history, name='grooming_history'),
    path('grooming/cancel/<int:booking_id>/', views.cancel_grooming, name='cancel_grooming'),

    path('accessory/<int:pk>/', views.accessory_detail, name='accessory_detail'),
    path('accessory/<int:pk>/', views.accessory_detail, name='accessory_detail'),











]

# Static & Media
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
