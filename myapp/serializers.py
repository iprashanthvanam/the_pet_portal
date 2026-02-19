# from rest_framework import serializers
# from.models import products

# class pr





# from rest_framework import serializers
# from .models import Pet, Food


# class PetSerializer(serializers.ModelSerializer):
#     image = serializers.SerializerMethodField()

#     class Meta:
#         model = Pet
#         fields = ['id', 'name', 'species', 'description', 'price', 'image']

#     def get_image(self, obj):
#         request = self.context.get('request')
#         if obj.image:
#             return request.build_absolute_uri(obj.image.url)
#         return None


# class FoodSerializer(serializers.ModelSerializer):
#     image = serializers.SerializerMethodField()

#     class Meta:
#         model = Food
#         fields = ['id', 'name', 'food_type', 'description', 'price', 'image']

#     def get_image(self, obj):
#         request = self.context.get('request')
#         if obj.image:
#             return request.build_absolute_uri(obj.image.url)
#         return None










from rest_framework import serializers
from .models import Pet, Food, Accessory


# =========================
# PET SERIALIZER
# =========================

class PetSerializer(serializers.ModelSerializer):

    age = serializers.SerializerMethodField()
    vaccinated = serializers.SerializerMethodField()
    adoption_ready = serializers.SerializerMethodField()
    activity_level = serializers.SerializerMethodField()

    class Meta:
        model = Pet
        fields = [
            'id',
            'name',
            'species',
            'description',
            'price',
            'image',
            'age',
            'vaccinated',
            'adoption_ready',
            'activity_level',
        ]

    def get_age(self, obj):
        if hasattr(obj, 'health_profile') and obj.health_profile:
            return obj.health_profile.age
        return None

    def get_vaccinated(self, obj):
        if hasattr(obj, 'health_profile') and obj.health_profile:
            return obj.health_profile.vaccinated
        return False

    def get_adoption_ready(self, obj):
        if hasattr(obj, 'health_profile') and obj.health_profile:
            return obj.health_profile.adoption_ready
        return False

    def get_activity_level(self, obj):
        if hasattr(obj, 'health_profile') and obj.health_profile:
            return obj.health_profile.activity_level
        return None


# =========================
# FOOD SERIALIZER
# =========================

class FoodSerializer(serializers.ModelSerializer):

    image = serializers.SerializerMethodField()

    class Meta:
        model = Food
        fields = [
            'id',
            'name',
            'food_type',
            'description',
            'price',
            'mfg_date',
            'expire_date',
            'image',
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


# =========================
# ACCESSORY SERIALIZER
# =========================

class AccessorySerializer(serializers.ModelSerializer):

    image = serializers.SerializerMethodField()

    class Meta:
        model = Accessory
        fields = [
            "id",
            "name",
            "category",
            "pet_type",
            "description",
            "price",
            "brand",
            "size",
            "color",
            "rating",
            "image",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None
