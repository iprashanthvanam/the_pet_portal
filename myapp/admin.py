
# from django.contrib import admin
# from unfold.admin import ModelAdmin

# from django.contrib import admin



from .models import UserProfile
from .models import DoctorAppointment
from django.contrib import admin


from .models import (
    Order, OrderItem,
    Pet, Food, CartItem,
    products, PetHealthProfile
)

from .models import GroomingBooking

from .models import Accessory



# =========================
# PET HEALTH INLINE
# =========================

class PetHealthInline(admin.StackedInline):
    model = PetHealthProfile
    extra = 0
    can_delete = False


# =========================
# ORDER ADMIN
# =========================

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_name", "price", "quantity")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_id",
        "user",
        "status",
        "payment_method",
        "payment_status",
        "total_cost",
        "created_at",
    )

    list_filter = (
        "status",
        "payment_method",
        "payment_status",
        "created_at",
    )

    search_fields = (
        "order_id",
        "full_name",
        "email",
        "razorpay_order_id",
        "razorpay_payment_id",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "order_id",
        "razorpay_order_id",
        "razorpay_payment_id",
        "created_at",
        "total_cost",
    )

    inlines = [OrderItemInline]



# @admin.register(DoctorAppointment)
# class DoctorAppointmentAdmin(admin.ModelAdmin):
#     list_display = ("user", "pet_name", "preferred_date", "status", "created_at")
#     list_filter = ("status", "preferred_date")
#     search_fields = ("user__username", "pet_name")
#     ordering = ("-created_at",)

from .models import DoctorAppointment

@admin.register(DoctorAppointment)
class DoctorAppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "pet_name",
        "appointment_date",
        "appointment_time",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "appointment_date",
    )

    search_fields = (
        "pet_name",
        "user__username",
    )

    ordering = ("-created_at",)





























from .models import PetCareBooking


@admin.register(PetCareBooking)
class PetCareBookingAdmin(admin.ModelAdmin):
    list_display = (
        "pet_name",
        "user",
        "total_days",
        "total_price",
        "status",
        "start_datetime",
        "end_datetime",
        "created_at",
    )

    list_filter = ("status", "start_datetime")

    search_fields = ("pet_name", "user__username")

    ordering = ("-created_at",)






@admin.register(GroomingBooking)
class GroomingBookingAdmin(admin.ModelAdmin):
    list_display = (
        "pet_name",
        "user",
        "package_type",
        "pet_size",
        "visit_type",
        "total_price",
        "status",
        "appointment_datetime",
    )

    list_filter = ("status", "package_type", "pet_size")

    search_fields = ("pet_name", "user__username")

    ordering = ("-created_at",)







@admin.register(Accessory)
class AccessoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "pet_type", "price", "stock", "date_added")
    list_filter = ("category", "pet_type")
    search_fields = ("name", "brand")
    ordering = ("-date_added",)



























# =========================
# PET ADMIN (WITH HEALTH)
# =========================

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    inlines = [PetHealthInline]


admin.site.register(PetHealthProfile)
admin.site.register(Food)
admin.site.register(CartItem)
admin.site.register(products)
admin.site.register(UserProfile)
