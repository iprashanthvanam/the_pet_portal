from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from myapp import views

urlpatterns = [

    # ==========================
    # CORE SHELL PAGES
    # ==========================
    path('', views.home, name='home'),
    path('home/', views.home, name='home'),
    path('welcome/', views.welcome, name='welcome'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),

    # ==========================
    # AUTH / LOGIN SHELL PAGES
    # ==========================
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),

    # ==========================
    # GOOGLE / ALLAUTH
    # ==========================
    path('accounts/login-redirect/', views.login_redirect_view, name='login_redirect_view'),
    path('accounts/', include('allauth.urls')),

    # ==========================
    # CATALOG & CART SHELL PAGES
    # ==========================
    path('pets/', views.pets, name='pets'),
    path('pet/<int:pk>/', views.pet_detail, name='pet_detail'),
    path('food/<int:pk>/', views.food_detail, name='food_detail'),
    path('accessory/<int:pk>/', views.accessory_detail, name='accessory_detail'),
    path('cart/', views.cart_detail, name='cart_detail'),
    path('checkout/', views.checkout, name='checkout'),
    path('order/success/<uuid:order_id>/', views.order_success, name='order_success'),
    path('track/', views.track_order, name='track_order'),
    path('orders/', views.order_history, name='order_history'),
    path('order/invoice/<uuid:order_id>/', views.download_invoice, name='download_invoice'),

    # ==========================
    # SERVICE BOOKINGS SHELL PAGES
    # ==========================
    path('consult/', views.consult_doctor, name='consult_doctor'),
    path('appointments/', views.appointment_history, name='appointment_history'),
    path('pet-care/', views.pet_care_booking, name='pet_care'),
    path('pet-care/history/', views.pet_care_history, name='pet_care_history'),
    path('grooming/', views.grooming_booking, name='grooming'),
    path('grooming/history/', views.grooming_history, name='grooming_history'),

    # ==========================
    # PROFILE & POLICIES SHELL PAGES
    # ==========================
    path('profile/', views.profile_view, name='profile'),
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),
    path('terms-and-conditions/', views.terms_and_conditions, name='terms_and_conditions'),
    path('refund-policy/', views.refund_policy, name='refund_policy'),
    path('shipping-policy/', views.shipping_policy, name='shipping_policy'),
    path('contact-us/', views.contact_us, name='contact_us'),

    # ==========================
    # ROLE-BASED DASHBOARDS (SHELLS)
    # ==========================
    path('dashboard/pet-care/', views.dashboard_pet_care, name='dashboard_pet_care'),
    path('dashboard/grooming/', views.dashboard_grooming, name='dashboard_grooming'),
    path('dashboard/doctor/', views.dashboard_doctor, name='dashboard_doctor'),
    path('dashboard/pet-seller/', views.dashboard_pet_seller, name='dashboard_pet_seller'),
    path('dashboard/product-seller/', views.dashboard_product_seller, name='dashboard_product_seller'),
    path('dashboard/accessory-seller/', views.dashboard_accessory_seller, name='dashboard_accessory_seller'),
    path('dashboard/master-admin/', views.dashboard_master_admin, name='dashboard_master_admin'),
    path('admin-ai-dashboard/', views.admin_ai_dashboard, name='admin_ai_dashboard'),

    # ==========================
    # CUSTOM ADMIN INTERFACE
    # ==========================
    path('admin/', admin.site.urls),

    # ==========================
    # BACKEND REST API ENDPOINTS
    # ==========================
    path('api/register/', views.api_register, name='api_register'),
    path('api/verify-otp/', views.api_verify_otp, name='api_verify_otp'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/forgot-password/', views.api_forgot_password, name='api_forgot_password'),
    path('api/verify-reset-otp/', views.api_verify_reset_otp, name='api_verify_reset_otp'),
    path('api/reset-password/', views.api_reset_password, name='api_reset_password'),
    
    path('api/catalog/', views.api_catalog, name='api_catalog'),
    path('api/home-data/', views.api_home_data, name='api_home_data'),
    path('api/pets/<int:pk>/', views.api_pet_detail, name='api_pet_detail'),
    path('api/foods/<int:pk>/', views.api_food_detail, name='api_food_detail'),
    path('api/accessories/<int:pk>/', views.api_accessory_detail, name='api_accessory_detail'),
    
    path('api/cart/', views.api_cart, name='api_cart'),
    path('api/checkout/', views.api_checkout, name='api_checkout'),
    path('api/payment/verify/', views.api_payment_verify, name='api_payment_verify'),
    path('api/payment/webhook/', views.api_payment_webhook, name='api_payment_webhook'),
    
    path('api/orders/', views.api_orders_list, name='api_orders_list'),
    path('api/orders/<uuid:order_id>/', views.api_order_detail, name='api_order_detail'),
    path('api/orders/<uuid:order_id>/cancel/', views.api_cancel_order, name='api_cancel_order'),
    path('api/orders/<uuid:order_id>/status/', views.api_update_order_status, name='api_update_order_status'),
    path('api/orders/<uuid:order_id>/retry-payment/', views.api_retry_payment, name='api_retry_payment'),
    
    path('api/bookings/doctor/', views.api_doctor_bookings, name='api_doctor_bookings'),
    path('api/bookings/doctor/<int:pk>/cancel/', views.api_cancel_doctor_booking, name='api_cancel_doctor_booking'),
    path('api/bookings/doctor/<int:pk>/status/', views.api_update_doctor_status, name='api_update_doctor_status'),
    path('api/bookings/care/', views.api_pet_care_bookings, name='api_pet_care_bookings'),
    path('api/bookings/care/<int:pk>/cancel/', views.api_cancel_pet_care, name='api_cancel_pet_care'),
    path('api/bookings/care/<int:pk>/status/', views.api_update_care_status, name='api_update_care_status'),
    path('api/bookings/grooming/', views.api_grooming_bookings, name='api_grooming_bookings'),
    path('api/bookings/grooming/<int:pk>/cancel/', views.api_cancel_grooming, name='api_cancel_grooming'),
    path('api/bookings/grooming/<int:pk>/status/', views.api_update_grooming_status, name='api_update_grooming_status'),
    path('api/bookings/doctor/<int:pk>/', views.api_doctor_booking_detail, name='api_doctor_booking_detail'),
    path('api/bookings/care/<int:pk>/', views.api_pet_care_booking_detail, name='api_pet_care_booking_detail'),
    path('api/bookings/grooming/<int:pk>/', views.api_grooming_booking_detail, name='api_grooming_booking_detail'),
    
    path('api/profile/', views.api_profile, name='api_profile'),
    path('api/reviews/', views.api_reviews, name='api_reviews'),
    path('api/reviews/<int:pk>/report/', views.api_report_review, name='api_report_review'),
    path('api/reviews/<int:pk>/moderate/', views.api_moderate_review, name='api_moderate_review'),
    path('api/reviews/<int:pk>/reply/', views.api_reply_review, name='api_reply_review'),

    # Dashboard Data APIs
    path('api/dashboard/pet-care/', views.api_dashboard_pet_care, name='api_api_dashboard_pet_care'),
    path('api/dashboard/grooming/', views.api_dashboard_grooming, name='api_api_dashboard_grooming'),
    path('api/dashboard/doctor/', views.api_dashboard_doctor, name='api_api_dashboard_doctor'),
    path('api/dashboard/pet-seller/', views.api_dashboard_pet_seller, name='api_api_dashboard_pet_seller'),
    path('api/dashboard/product-seller/', views.api_dashboard_product_seller, name='api_api_dashboard_product_seller'),
    path('api/dashboard/accessory-seller/', views.api_dashboard_accessory_seller, name='api_api_dashboard_accessory_seller'),
    path('api/dashboard/master-admin/', views.api_dashboard_master_admin, name='api_api_dashboard_master_admin'),
    path('api/admin/ai-insights/', views.api_admin_ai_insights, name='api_admin_ai_insights'),

    # Admin CRUD APIs
    path('api/admin/products/', views.api_admin_products_crud, name='api_admin_products_crud'),
    path('api/admin/products/<int:pk>/', views.api_admin_product_detail_crud, name='api_admin_product_detail_crud'),
    path('api/admin/foods/', views.api_admin_foods_crud, name='api_admin_foods_crud'),
    path('api/admin/foods/<int:pk>/', views.api_admin_food_detail_crud, name='api_admin_food_detail_crud'),
    path('api/admin/accessories/', views.api_admin_accessories_crud, name='api_admin_accessories_crud'),
    path('api/admin/accessories/<int:pk>/', views.api_admin_accessory_detail_crud, name='api_admin_accessory_detail_crud'),
    path('api/admin/pets/', views.api_admin_pets_crud, name='api_admin_pets_crud'),
    path('api/admin/pets/<int:pk>/', views.api_admin_pet_detail_crud, name='api_admin_pet_detail_crud'),
    path('api/admin/users/', views.api_admin_users_crud, name='api_admin_users_crud'),
    path('api/admin/users/<int:pk>/', views.api_admin_user_detail_crud, name='api_admin_user_detail_crud'),
    path('api/admin/cart-items/', views.api_admin_cart_items_crud, name='api_admin_cart_items_crud'),
    path('api/admin/cart-items/<int:pk>/', views.api_admin_cart_item_detail_crud, name='api_admin_cart_item_detail_crud'),
    path('api/admin/health-profiles/', views.api_admin_health_profiles_crud, name='api_admin_health_profiles_crud'),
    path('api/admin/health-profiles/<int:pk>/', views.api_admin_health_profile_detail_crud, name='api_admin_health_profile_detail_crud'),

    # Search & Chatbot APIs
    path('search-suggestions/', views.search_suggestions, name='search_suggestions'),
    path('api/chatbot/', views.chatbot_api, name='chatbot_api'),
]

# Static & Media
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
