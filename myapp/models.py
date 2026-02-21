










from django.db import models
from django.contrib.auth.models import User
import uuid
import uuid
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import time





from django.utils import timezone

# =========================
# PRODUCT MODELS
# =========================

class Pet(models.Model):
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    date_added = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='pets/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.species})"

# =========================
# PET HEALTH PROFILE MODEL
# =========================

class PetHealthProfile(models.Model):

    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
    )

    ACTIVITY_LEVELS = (
        ('Low', 'Low'),
        ('Moderate', 'Moderate'),
        ('High', 'High'),
    )

    pet = models.OneToOneField(
        Pet,
        on_delete=models.CASCADE,
        related_name='health_profile'
    )

    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    vaccinated = models.BooleanField(default=False)
    last_vaccination_date = models.DateField(null=True, blank=True)

    dewormed = models.BooleanField(default=False)
    neutered_spayed = models.BooleanField(default=False)

    medical_conditions = models.TextField(blank=True)
    allergies = models.TextField(blank=True)

    microchip_id = models.CharField(max_length=100, blank=True)

    vet_name = models.CharField(max_length=100, blank=True)
    vet_contact = models.CharField(max_length=20, blank=True)

    diet_type = models.CharField(max_length=100, blank=True)
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_LEVELS, blank=True)

    temperament = models.CharField(max_length=100, blank=True)

    adoption_ready = models.BooleanField(default=True)

    def __str__(self):
        return f"Health Profile - {self.pet.name}"

    @property
    def age(self):
        if not self.birth_date:
            return None
        today = timezone.now().date()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )



class Food(models.Model):
    name = models.CharField(max_length=100)
    food_type = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mfg_date = models.DateField()
    expire_date = models.DateField()
    image = models.ImageField(upload_to='foods/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.food_type})"


# =========================
# ORDER MODELS
# =========================

class Order(models.Model):
    STATUS_CHOICES = (
        ('CONFIRMED', 'Order Confirmed'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    )

    PAYMENT_METHODS = (
        ('COD', 'Cash On Delivery'),
        ('RAZORPAY', 'Razorpay'),
    )

    PAYMENT_STATUS = (
        ('UNPAID', 'Unpaid'),
        ('PAID', 'Paid'),
        ('REFUNDED', 'Refunded'),
    )

    order_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    mobile_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.CharField(max_length=250)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)

    # ✅ DEFAULT STATUS = ORDER CONFIRMED
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CONFIRMED'
    )

    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='COD')
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default='UNPAID')

    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_refund_id = models.CharField(max_length=100, blank=True, null=True)



    confirmed_at = models.DateTimeField(null=True, blank=True)
    processing_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)


    def __str__(self):
        return f"Order {self.order_id}"

    @property
    def paid(self):
        return self.payment_status == 'PAID'
    

    @property
    def refund_rrn(self):
        return self.razorpay_refund_id
    

    
    
    # def timeline(self):
    #     base = self.created_at
    #     return {
    #         'CONFIRMED': base,
    #         'PROCESSING': base + timedelta(days=1),
    #         'SHIPPED': base + timedelta(days=2),
    #         'DELIVERED': base + timedelta(days=3),
    #         'CANCELLED': None
            
    #     }







    def timeline(self):
        base = self.created_at
        return {
            'CONFIRMED': base,
            'PROCESSING': base + timedelta(days=1),
            'SHIPPED': base + timedelta(days=2),
            'DELIVERED': base + timedelta(days=3),
            'CANCELLED': None
        }
    





    def can_cancel(self):
        return self.status in ['CONFIRMED', 'PROCESSING']
    






    def mark_paid(self, payment_id):
        if self.payment_status == "PAID":
            return False
        self.payment_status = "PAID"
        self.payment_method = "RAZORPAY"
        self.razorpay_payment_id = payment_id
        self.save(update_fields=["payment_status", "payment_method", "razorpay_payment_id"])
        return True
    

    def mark_refunded(self, refund_id):
        if self.payment_status == "REFUNDED":
            return False
        self.payment_status = "REFUNDED"
        self.status = "CANCELLED"
        self.razorpay_refund_id = refund_id
        self.save(update_fields=["payment_status", "status", "razorpay_refund_id"])
        return True



class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    

    def get_cost(self):
        return self.price * self.quantity


# =========================
# CART MODEL
# =========================

class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    item_type = models.CharField(max_length=10)
    item_id = models.PositiveIntegerField()
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('user', 'item_type', 'item_id')

    def __str__(self):
        return f"{self.user.username} - {self.name}"





# =========================
# USER PROFILE MODEL
# =========================

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)

    phone = models.CharField(max_length=15, blank=True)
    address = models.CharField(max_length=250, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"



# =========================
# AUTO CREATE PROFILE
# =========================

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, "profile"):
        instance.profile.save()






# =========================
# VETERINARY APPOINTMENT MODEL
# =========================





class DoctorAppointment(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("CANCELLED", "Cancelled"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    pet_name = models.CharField(max_length=100)
    pet_type = models.CharField(max_length=50)

    appointment_date = models.DateField()
    appointment_time = models.TimeField()

    symptoms = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        today = timezone.now().date()

        if not self.appointment_date:
            raise ValidationError("Appointment date is required.")

        if not self.appointment_time:
            raise ValidationError("Appointment time is required.")

        # ❌ Prevent past dates
        if self.appointment_date < today:
            raise ValidationError("You cannot book an appointment in the past.")

        # ⏰ Working hours
        if not (time(9, 0) <= self.appointment_time <= time(18, 0)):
            raise ValidationError("Appointments allowed only between 9AM and 6PM.")

        # ⏱ 30-minute slots only
        if self.appointment_time.minute not in [0, 30]:
            raise ValidationError("Use 30-minute slots (10:00 or 10:30).")





# =========================
# PET CARE BOARDING MODEL
# =========================

class PetCareBooking(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pet_care_bookings")

    # Pet Details (Owner's own pet)
    pet_name = models.CharField(max_length=100)
    pet_species = models.CharField(max_length=50)
    pet_age = models.PositiveIntegerField()
    pet_gender = models.CharField(max_length=20, blank=True)

    health_notes = models.TextField(blank=True)
    vaccinated = models.BooleanField(default=False)

    # Care Options
    special_diet = models.BooleanField(default=False)
    injection_required = models.BooleanField(default=False)
    vaccine_required = models.BooleanField(default=False)
    extra_care = models.BooleanField(default=False)

    # Stay Duration
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()

    total_days = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not self.start_datetime or not self.end_datetime:
            raise ValidationError("Start and End date/time required.")

        if self.start_datetime < timezone.now():
            raise ValidationError("Start date cannot be in the past.")

        if self.end_datetime <= self.start_datetime:
            raise ValidationError("End date must be after start date.")

    def calculate_price(self):
        duration = self.end_datetime - self.start_datetime
        days = duration.days
        if duration.seconds > 0:
            days += 1

        if days < 1:
            days = 1

        self.total_days = days

        # Pricing Engine
        base_price = 0

        if days == 1:
            base_price = 500
        elif days == 2:
            base_price = 950
        else:
            base_price = 950 + (days - 2) * 450

        extra = 0
        if self.special_diet:
            extra += 250
        if self.injection_required:
            extra += 200
        if self.vaccine_required:
            extra += 300
        if self.extra_care:
            extra += 400

        self.total_price = base_price + extra

    # def save(self, *args, **kwargs):
    #     self.clean()
    #     self.calculate_price()
    #     super().save(*args, **kwargs)




    def save(self, *args, **kwargs):
    # Auto-set confirmed time when order first created
        if not self.confirmed_at:
            self.confirmed_at = self.created_at or timezone.now()

        # When status changes → set timestamp
        if self.status == "PROCESSING" and not self.processing_at:
            self.processing_at = timezone.now()

        if self.status == "SHIPPED" and not self.shipped_at:
            self.shipped_at = timezone.now()

        if self.status == "DELIVERED" and not self.delivered_at:
            self.delivered_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.pet_name} - {self.user.username} ({self.status})"








# =========================
# PET GROOMING BOOKING MODEL
# =========================

class GroomingBooking(models.Model):

    PACKAGE_CHOICES = (
        ("BASIC_BATH", "Basic Bath"),
        ("HAIRCUT", "Hair Cut & Styling"),
        ("NAIL_CLIP", "Nail Clipping"),
        ("EAR_CLEAN", "Ear Cleaning"),
        ("TICK_TREATMENT", "Tick Treatment"),
        ("FULL_GROOM", "Full Grooming Package"),
    )

    PET_SIZE_CHOICES = (
        ("SMALL", "Small"),
        ("MEDIUM", "Medium"),
        ("LARGE", "Large"),
    )

    VISIT_TYPE_CHOICES = (
        ("CENTER", "Center Visit"),
        ("HOME", "Home Visit"),
    )

    STATUS_CHOICES = (
        ("PENDING", "Pending Approval"),
        ("APPROVED", "Approved"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="grooming_bookings")

    pet_name = models.CharField(max_length=100)
    pet_type = models.CharField(max_length=50)
    pet_size = models.CharField(max_length=10, choices=PET_SIZE_CHOICES)

    package_type = models.CharField(max_length=20, choices=PACKAGE_CHOICES)
    visit_type = models.CharField(max_length=10, choices=VISIT_TYPE_CHOICES)

    preferred_groomer = models.CharField(max_length=100, blank=True)

    appointment_datetime = models.DateTimeField()

    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)

    # ------------------------
    # VALIDATION
    # ------------------------
    def clean(self):
        if self.appointment_datetime < timezone.now():
            raise ValidationError("Cannot book grooming in the past.")

    # ------------------------
    # PRICING ENGINE
    # ------------------------
    def calculate_price(self):

        base_prices = {
            "BASIC_BATH": 500,
            "HAIRCUT": 800,
            "NAIL_CLIP": 300,
            "EAR_CLEAN": 250,
            "TICK_TREATMENT": 700,
            "FULL_GROOM": 1500,
        }

        size_multiplier = {
            "SMALL": 1.0,
            "MEDIUM": 1.3,
            "LARGE": 1.6,
        }

        home_charge = 300 if self.visit_type == "HOME" else 0

        base = base_prices.get(self.package_type, 0)
        multiplier = size_multiplier.get(self.pet_size, 1)

        self.total_price = (base * multiplier) + home_charge

    def save(self, *args, **kwargs):
        self.clean()
        self.calculate_price()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.pet_name} - {self.user.username} ({self.status})"






# =========================
# PET ACCESSORY MODEL
# =========================

class Accessory(models.Model):

    CATEGORY_CHOICES = (
        ("TOY", "Toys"),
        ("BED", "Beds"),
        ("LEASH", "Leashes"),
        ("CLOTHING", "Clothing"),
        ("COLLAR", "Collars"),
        ("SUPPLEMENT", "Supplements"),
    )

    PET_TYPE_CHOICES = (
        ("DOG", "Dog"),
        ("CAT", "Cat"),
        ("BOTH", "Both"),
    )

    name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    pet_type = models.CharField(max_length=10, choices=PET_TYPE_CHOICES, default="BOTH")

    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    brand = models.CharField(max_length=100, blank=True)
    stock = models.PositiveIntegerField(default=0)

    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)

    rating = models.DecimalField(max_digits=2, decimal_places=1, default=4.5)

    image = models.ImageField(upload_to="accessories/", blank=True, null=True)

    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category})"









# rest fremework serializers

class products (models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    date_added = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)

    def __str__(self):
        return self.name
    



