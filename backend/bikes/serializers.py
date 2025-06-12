from rest_framework import serializers
from .models import (
    Manufacturer, EngineType, BikeCategory, Motorcycle, ECUType,
    MotorcycleECU, BikeSpecification, BikeImage, BikeReview
)


class ManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = ['id', 'name', 'country', 'founded_year', 'logo_url', 'website']


class EngineTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineType
        fields = ['id', 'name', 'configuration', 'cooling_system', 'fuel_system']


class BikeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeCategory
        fields = ['id', 'name', 'description']


class ECUTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ECUType
        fields = [
            'id', 'name', 'manufacturer', 'version', 
            'communication_protocol', 'supported_formats', 
            'is_tunable', 'requires_cable'
        ]


class MotorcycleListSerializer(serializers.ModelSerializer):
    """Simplified serializer for motorcycle listings"""
    manufacturer = ManufacturerSerializer(read_only=True)
    category = BikeCategorySerializer(read_only=True)
    engine_type = EngineTypeSerializer(read_only=True)
    
    class Meta:
        model = Motorcycle
        fields = [
            'id', 'manufacturer', 'model_name', 'year', 'category',
            'engine_type', 'displacement_cc', 'cylinders',
            'max_power_hp', 'max_torque_nm', 'dry_weight_kg',
            'msrp_usd', 'primary_image_url'
        ]


class MotorcycleDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual motorcycle views"""
    manufacturer = ManufacturerSerializer(read_only=True)
    category = BikeCategorySerializer(read_only=True)
    engine_type = EngineTypeSerializer(read_only=True)
    
    class Meta:
        model = Motorcycle
        fields = [
            'id', 'manufacturer', 'model_name', 'year', 'category',
            'engine_type', 'displacement_cc', 'cylinders',
            'max_power_hp', 'max_torque_nm', 'dry_weight_kg',
            'seat_height_mm', 'fuel_capacity_liters', 'top_speed_kmh',
            'msrp_usd', 'abs', 'traction_control', 'riding_modes',
            'quickshifter', 'cruise_control', 'electronic_suspension',
            'description', 'primary_image_url', 'created_at'
        ]


class BikeSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeSpecification
        fields = [
            'specification_type', 'value', 'unit', 'notes'
        ]


class BikeImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeImage
        fields = [
            'id', 'image_url', 'caption', 'is_primary', 'order'
        ]


class BikeReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = BikeReview
        fields = [
            'id', 'username', 'rating', 'title', 'review_text',
            'pros', 'cons', 'recommended', 'verified_owner',
            'miles_owned', 'ownership_duration', 'created_at'
        ]


class MotorcycleECUSerializer(serializers.ModelSerializer):
    ecu_type = ECUTypeSerializer(read_only=True)
    
    class Meta:
        model = MotorcycleECU
        fields = [
            'ecu_type', 'is_primary', 'installation_year',
            'part_number', 'is_tunable', 'requires_hardware_modification'
        ] 