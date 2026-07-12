
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
    fields = ("name", "category", "pet_type", "description", "price", "mrp", "brand", "stock", "size", "color", "is_prime_eligible", "bought_past_month_count", "image", "image2", "video", "vendor")



























# =========================
# PET ADMIN (WITH HEALTH)
# =========================

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("name", "species", "price", "stock", "date_added")
    fields = ("name", "species", "description", "price", "mrp", "stock", "is_prime_eligible", "bought_past_month_count", "image", "image2", "video", "vendor")
    inlines = [PetHealthInline]

@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ("name", "food_type", "price", "stock", "expire_date")
    fields = ("name", "food_type", "description", "price", "mrp", "brand", "weight_kg", "stock", "is_prime_eligible", "bought_past_month_count", "mfg_date", "expire_date", "image", "image2", "video", "vendor")

admin.site.register(PetHealthProfile)
admin.site.register(CartItem)
admin.site.register(products)

from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

# Inline UserProfile editor inside User details screen
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'User Profile Details'

# Custom UserAdmin to show Role column in User list
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = BaseUserAdmin.list_display + ('get_role',)

    def get_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return '-'
    get_role.short_description = 'Role'

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
from .models import PasswordReset, CheckoutSetting
admin.site.register(PasswordReset)
admin.site.register(CheckoutSetting)

from .models import Review, ReviewReply, ReviewMedia

class ReviewMediaInline(admin.TabularInline):
    model = ReviewMedia
    extra = 1

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "rating", "title", "is_reported", "created_at")
    list_filter = ("rating", "is_reported")
    inlines = [ReviewMediaInline]

admin.site.register(ReviewReply)
admin.site.register(ReviewMedia)
