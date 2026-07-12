from rest_framework import serializers
from django.contrib.auth.models import User
from myapp.models import (
    Pet, Food, Accessory, UserProfile, PendingRegistration,
    Review, ReviewReply, Order, OrderItem, DoctorAppointment, PetCareBooking, GroomingBooking, products,
    CartItem, PetHealthProfile
)

# =========================
# USER / PROFILE SERIALIZERS
# =========================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'phone', 'address', 'city', 'postal_code', 'role', 'profile_image']

# =========================
# CATALOG SERIALIZERS
# =========================

class PetSerializer(serializers.ModelSerializer):
    age = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    vaccinated = serializers.BooleanField(required=False, default=False)
    adoption_ready = serializers.BooleanField(required=False, default=False)
    activity_level = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    image2 = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Pet
        fields = [
            'id', 'name', 'species', 'description', 'price', 'mrp', 'discount_percentage',
            'stock', 'is_prime_eligible', 'bought_past_month_count', 'image', 'image2', 'video',
            'age', 'vaccinated', 'adoption_ready', 'activity_level', 'vendor'
        ]

    def create(self, validated_data):
        age = validated_data.pop('age', None)
        vaccinated = validated_data.pop('vaccinated', False)
        adoption_ready = validated_data.pop('adoption_ready', False)
        activity_level = validated_data.pop('activity_level', None)

        pet = Pet.objects.create(**validated_data)

        # Create associated health profile. Since age is calculated from birth_date,
        # we parse/estimate birth_date if age integer or string is supplied.
        from myapp.models import PetHealthProfile
        from django.utils import timezone
        birth_date = None
        if age:
            try:
                # Extract number of years from age input, e.g., "2 years" -> 2 or "2" -> 2
                years = int(''.join(filter(str.isdigit, str(age))))
                birth_date = timezone.now().date() - timezone.timedelta(days=years * 365)
            except ValueError:
                pass

        PetHealthProfile.objects.create(
            pet=pet,
            birth_date=birth_date,
            vaccinated=vaccinated,
            adoption_ready=adoption_ready,
            activity_level=activity_level or ''
        )
        return pet

    def update(self, instance, validated_data):
        age = validated_data.pop('age', None)
        vaccinated = validated_data.pop('vaccinated', None)
        adoption_ready = validated_data.pop('adoption_ready', None)
        activity_level = validated_data.pop('activity_level', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        from myapp.models import PetHealthProfile
        from django.utils import timezone
        health_profile, created = PetHealthProfile.objects.get_or_create(pet=instance)
        if age is not None:
            try:
                years = int(''.join(filter(str.isdigit, str(age))))
                health_profile.birth_date = timezone.now().date() - timezone.timedelta(days=years * 365)
            except ValueError:
                pass
        if vaccinated is not None:
            health_profile.vaccinated = vaccinated
        if adoption_ready is not None:
            health_profile.adoption_ready = adoption_ready
        if activity_level is not None:
            health_profile.activity_level = activity_level
        health_profile.save()

        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        # Map values from related health profile
        if hasattr(instance, 'health_profile') and instance.health_profile:
            ret['age'] = instance.health_profile.age
            ret['vaccinated'] = instance.health_profile.vaccinated
            ret['adoption_ready'] = instance.health_profile.adoption_ready
            ret['activity_level'] = instance.health_profile.activity_level
            ret['microchip_id'] = instance.health_profile.microchip_id
        else:
            ret['age'] = None
            ret['vaccinated'] = False
            ret['adoption_ready'] = False
            ret['activity_level'] = None
            ret['microchip_id'] = None

        if instance.image:
            if request:
                ret['image'] = request.build_absolute_uri(instance.image.url)
            else:
                ret['image'] = instance.image.url
        else:
            ret['image'] = None

        if instance.image2:
            if request:
                ret['image2'] = request.build_absolute_uri(instance.image2.url)
            else:
                ret['image2'] = instance.image2.url
        else:
            ret['image2'] = None

        if instance.video:
            if request:
                ret['video'] = request.build_absolute_uri(instance.video.url)
            else:
                ret['video'] = instance.video.url
        else:
            ret['video'] = None

        from django.db.models import Avg
        reviews = instance.reviews.all()
        total_ratings = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
        ret['rating_avg'] = round(float(avg_rating), 1)
        ret['rating_count'] = total_ratings
        return ret


class FoodSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image2 = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Food
        fields = [
            'id', 'name', 'food_type', 'description', 'price', 'mrp', 'discount_percentage',
            'brand', 'weight_kg', 'stock', 'is_prime_eligible', 'bought_past_month_count',
            'mfg_date', 'expire_date', 'image', 'image2', 'video', 'vendor'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image:
            if request:
                ret['image'] = request.build_absolute_uri(instance.image.url)
            else:
                ret['image'] = instance.image.url
        else:
            ret['image'] = None

        if instance.image2:
            if request:
                ret['image2'] = request.build_absolute_uri(instance.image2.url)
            else:
                ret['image2'] = instance.image2.url
        else:
            ret['image2'] = None

        if instance.video:
            if request:
                ret['video'] = request.build_absolute_uri(instance.video.url)
            else:
                ret['video'] = instance.video.url
        else:
            ret['video'] = None

        from django.db.models import Avg
        reviews = instance.reviews.all()
        total_ratings = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
        ret['rating_avg'] = round(float(avg_rating), 1)
        ret['rating_count'] = total_ratings
        return ret


class AccessorySerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image2 = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Accessory
        fields = [
            "id", "name", "category", "pet_type", "description", "price", "mrp", "discount_percentage",
            "brand", "stock", "size", "color", "is_prime_eligible", "bought_past_month_count", "image", "image2", "video", "vendor"
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image:
            if request:
                ret['image'] = request.build_absolute_uri(instance.image.url)
            else:
                ret['image'] = instance.image.url
        else:
            ret['image'] = None

        if instance.image2:
            if request:
                ret['image2'] = request.build_absolute_uri(instance.image2.url)
            else:
                ret['image2'] = instance.image2.url
        else:
            ret['image2'] = None

        if instance.video:
            if request:
                ret['video'] = request.build_absolute_uri(instance.video.url)
            else:
                ret['video'] = instance.video.url
        else:
            ret['video'] = None

        from django.db.models import Avg
        reviews = instance.reviews.all()
        total_ratings = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0
        ret['rating_avg'] = round(float(avg_rating), 1)
        ret['rating_count'] = total_ratings
        return ret


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = products
        fields = ['id', 'name', 'description', 'price', 'image', 'date_added', 'vendor']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image:
            if request:
                ret['image'] = request.build_absolute_uri(instance.image.url)
            else:
                ret['image'] = instance.image.url
        else:
            ret['image'] = None
        return ret

# =========================
# REVIEWS SERIALIZER
# =========================

class ReviewReplySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.profile.role', read_only=True)
    is_master_admin = serializers.SerializerMethodField()

    class Meta:
        model = ReviewReply
        fields = ['id', 'username', 'user_role', 'reply_text', 'created_at', 'is_master_admin']
        read_only_fields = ['user']

    def get_is_master_admin(self, obj):
        return obj.user.is_superuser or (hasattr(obj.user, 'profile') and obj.user.profile.role == 'master_admin')

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.profile.role', read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)
    replies = ReviewReplySerializer(many=True, read_only=True)

    user_profile_id = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'username', 'user_role', 'user_profile_id', 'rating', 'title', 'comment', 'image', 'video',
            'is_reported', 'created_at', 'pet', 'product', 'food', 'accessory', 'service_type', 'replies'
        ]
        read_only_fields = ['user', 'is_reported']

    def get_user_profile_id(self, obj):
        return obj.user.profile.id if hasattr(obj.user, 'profile') else None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image:
            if request:
                ret['image'] = request.build_absolute_uri(instance.image.url)
            else:
                ret['image'] = instance.image.url
        else:
            ret['image'] = None

        if instance.video:
            if request:
                ret['video'] = request.build_absolute_uri(instance.video.url)
            else:
                ret['video'] = instance.video.url
        else:
            ret['video'] = None
        return ret

# =========================
# ORDER SERIALIZERS
# =========================

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'price', 'quantity', 'get_cost']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'user', 'full_name', 'email', 'mobile_number',
            'address', 'city', 'postal_code', 'created_at', 'status',
            'payment_method', 'payment_status', 'total_cost', 'razorpay_order_id',
            'razorpay_payment_id', 'razorpay_refund_id', 'confirmed_at', 'processing_at', 'shipped_at',
            'delivered_at', 'cancelled_at', 'items'
        ]

# =========================
# SERVICE BOOKING SERIALIZERS
# =========================

class DoctorAppointmentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = DoctorAppointment
        fields = [
            'id', 'user', 'username', 'pet_name', 'pet_type', 
            'appointment_date', 'appointment_time', 'symptoms', 'status', 'created_at'
        ]
        read_only_fields = ['user']

class PetCareBookingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = PetCareBooking
        fields = [
            'id', 'user', 'username', 'pet_name', 'pet_species', 'pet_age', 
            'pet_gender', 'health_notes', 'vaccinated', 'special_diet', 
            'injection_required', 'vaccine_required', 'extra_care', 
            'start_datetime', 'end_datetime', 'total_days', 'total_price', 'status', 'created_at'
        ]
        read_only_fields = ['user', 'total_days', 'total_price']

class GroomingBookingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = GroomingBooking
        fields = [
            'id', 'user', 'username', 'pet_name', 'pet_type', 'pet_size', 
            'package_type', 'visit_type', 'preferred_groomer', 'appointment_datetime', 
            'total_price', 'status', 'created_at'
        ]
        read_only_fields = ['user', 'total_price']

class CartItemSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = CartItem
        fields = ['id', 'user', 'username', 'item_type', 'item_id', 'name', 'price', 'quantity']
        read_only_fields = ['user']

class PetHealthProfileSerializer(serializers.ModelSerializer):
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    class Meta:
        model = PetHealthProfile
        fields = [
            'id', 'pet', 'pet_name', 'birth_date', 'gender', 'weight_kg', 
            'vaccinated', 'last_vaccination_date', 'dewormed', 'neutered_spayed', 
            'medical_conditions', 'allergies', 'microchip_id', 'vet_name', 
            'vet_contact', 'diet_type', 'activity_level', 'temperament', 'adoption_ready'
        ]

