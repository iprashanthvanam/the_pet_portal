










from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import timedelta, time
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator





from django.utils import timezone

# =========================
# PRODUCT MODELS
# =========================

class Pet(models.Model):
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # Pricing Metrics
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Maximum Retail Price", default=0.00)
    
    # Badges & Stock Metrics
    stock = models.PositiveIntegerField(default=1)
    is_prime_eligible = models.BooleanField(default=True, verbose_name="Eligible for Prime Fast Delivery")
    bought_past_month_count = models.PositiveIntegerField(default=0, verbose_name="Estimated units bought last month")
    
    date_added = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='pets/', blank=True, null=True)
    image2 = models.ImageField(upload_to='pets/', blank=True, null=True)
    video = models.FileField(upload_to='pets/videos/', blank=True, null=True)
    vendor = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='vendor_pets')

    def __str__(self):
        return f"{self.name} ({self.species})"

    @property
    def discount_percentage(self):
        if self.mrp > self.price:
            discount = ((self.mrp - self.price) / self.mrp) * 100
            return int(round(discount))
        return 0

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
    name = models.CharField(max_length=250) # Extended length for descriptive Amazon-style titles
    food_type = models.CharField(max_length=50) # e.g., Dry Kibble, Wet Food
    description = models.TextField(blank=True)
    
    # Pricing Metrics
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Maximum Retail Price", default=0.00)
    
    # Specifications & Logistics
    brand = models.CharField(max_length=100, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    is_prime_eligible = models.BooleanField(default=True)
    bought_past_month_count = models.PositiveIntegerField(default=0)
    
    mfg_date = models.DateField()
    expire_date = models.DateField()
    image = models.ImageField(upload_to='foods/', blank=True, null=True)
    image2 = models.ImageField(upload_to='foods/', blank=True, null=True)
    video = models.FileField(upload_to='foods/videos/', blank=True, null=True)
    vendor = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='vendor_foods')

    def __str__(self):
        return self.name

    @property
    def discount_percentage(self):
        if self.mrp > self.price:
            discount = ((self.mrp - self.price) / self.mrp) * 100
            return int(round(discount))
        return 0


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
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

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
    ROLE_CHOICES = (
        ('customer', 'Normal Customer'),
        ('pet_care', 'Pet Care Provider'),
        ('pet_grooming', 'Pet Grooming Provider'),
        ('doctor', 'Doctor/Veterinary Consultant'),
        ('pet_seller', 'Pet Center/Adoption Seller'),
        ('product_seller', 'Product Seller'),
        ('accessory_seller', 'Accessories Seller'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)

    phone = models.CharField(max_length=15, blank=True)
    address = models.CharField(max_length=250, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')

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
        ("COMPLETED", "Completed"),
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

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)




class PetCareBooking(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="pet_care_bookings")

    pet_name = models.CharField(max_length=100)
    pet_species = models.CharField(max_length=50)
    pet_age = models.PositiveIntegerField()
    pet_gender = models.CharField(max_length=20, blank=True)

    health_notes = models.TextField(blank=True)
    vaccinated = models.BooleanField(default=False)

    special_diet = models.BooleanField(default=False)
    injection_required = models.BooleanField(default=False)
    vaccine_required = models.BooleanField(default=False)
    extra_care = models.BooleanField(default=False)

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

    def save(self, *args, **kwargs):
        self.clean()
        self.calculate_price()
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

    name = models.CharField(max_length=250) # Long title structure
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    pet_type = models.CharField(max_length=10, choices=PET_TYPE_CHOICES, default="BOTH")
    description = models.TextField(blank=True)
    
    # Pricing Metrics
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Maximum Retail Price", default=0.00)
    
    # Specifications & Logistics
    brand = models.CharField(max_length=100, blank=True)
    stock = models.PositiveIntegerField(default=0)
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    is_prime_eligible = models.BooleanField(default=True)
    bought_past_month_count = models.PositiveIntegerField(default=0)

    image = models.ImageField(upload_to="accessories/", blank=True, null=True)
    image2 = models.ImageField(upload_to="accessories/", blank=True, null=True)
    video = models.FileField(upload_to="accessories/videos/", blank=True, null=True)
    date_added = models.DateTimeField(auto_now_add=True)
    vendor = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='vendor_accessories')

    def __str__(self):
        return self.name

    @property
    def discount_percentage(self):
        if self.mrp > self.price:
            discount = ((self.mrp - self.price) / self.mrp) * 100
            return int(round(discount))
        return 0









# rest fremework serializers

class products (models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    date_added = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    vendor = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='vendor_products')

    def __str__(self):
        return self.name

class PendingRegistration(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=50, default='customer')
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pending {self.username} ({self.email})"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_petportal_reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=150, blank=True)
    comment = models.TextField(blank=True)
    image = models.ImageField(upload_to='reviews/', blank=True, null=True)
    video = models.FileField(upload_to='reviews/videos/', blank=True, null=True)
    is_reported = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Relationships across all types
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    product = models.ForeignKey(products, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    food = models.ForeignKey(Food, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    accessory = models.ForeignKey(Accessory, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    
    # Keep service reviews general/flexible by checking if they relate to specific service category strings instead of strict DB IDs
    service_type = models.CharField(max_length=50, blank=True, null=True) # "DOCTOR", "PET_CARE", "GROOMING"

    def __str__(self):
        return f"{self.user.username} - {self.rating} Stars"

class ReviewMedia(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='media_files')
    file = models.FileField(upload_to='reviews/media/')
    is_video = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Media for Review #{self.review.id} ({'Video' if self.is_video else 'Image'})"

class ReviewReply(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reply_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reply by {self.user.username} on Review #{self.review.id}"

class AICachedReport(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    report_data = models.JSONField()

    def __str__(self):
        return f"AI Report {self.created_at}"

class PasswordReset(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Reset OTP for {self.email}"

class CheckoutSetting(models.Model):
    name = models.CharField(max_length=100, default="Default Settings")
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Fixed tax fee in INR")
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Delivery fee in INR")
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="GST Percentage")
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Platform fee in INR")

    def __str__(self):
        return self.name
    



