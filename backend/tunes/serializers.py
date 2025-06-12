from rest_framework import serializers
from .models import (
    TuneCategory, TuneType, SafetyRating, TuneCreator, 
    Tune, TuneCompatibility, TuneReview
)
from bikes.models import Motorcycle


class TuneCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TuneCategory
        fields = ['name', 'description', 'color_code', 'icon_name']


class TuneTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TuneType
        fields = ['name', 'description', 'skill_level_required', 'reversible']


class SafetyRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyRating
        fields = ['level', 'description', 'color_code', 'warning_text']


class TuneCreatorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = TuneCreator
        fields = [
            'id', 'username', 'email', 'business_name', 'bio', 
            'specialties', 'experience_years', 'is_verified', 
            'verification_level', 'website', 'total_tunes',
            'total_downloads', 'average_rating'
        ]


class MotorcycleSimpleSerializer(serializers.ModelSerializer):
    manufacturer_name = serializers.CharField(source='manufacturer.name', read_only=True)
    
    class Meta:
        model = Motorcycle
        fields = [
            'id', 'manufacturer_name', 'model_name', 'year',
            'displacement_cc', 'max_power_hp', 'max_torque_nm'
        ]


class TuneCompatibilitySerializer(serializers.ModelSerializer):
    motorcycle = MotorcycleSimpleSerializer(read_only=True)
    
    class Meta:
        model = TuneCompatibility
        fields = [
            'motorcycle', 'is_verified', 'testing_status',
            'installation_notes', 'compatibility_notes'
        ]


class TuneListSerializer(serializers.ModelSerializer):
    """Simplified serializer for tune listings"""
    creator = TuneCreatorSerializer(read_only=True)
    category = TuneCategorySerializer(read_only=True)
    tune_type = TuneTypeSerializer(read_only=True)
    safety_rating = SafetyRatingSerializer(read_only=True)
    
    class Meta:
        model = Tune
        fields = [
            'id', 'name', 'version', 'short_description',
            'creator', 'category', 'tune_type', 'safety_rating',
            'power_gain_hp', 'power_gain_percentage',
            'fuel_economy_change_percentage', 'price',
            'is_open_source', 'dyno_tested', 'street_legal',
            'download_count', 'average_rating', 'tags',
            'published_at', 'is_featured'
        ]


class TuneDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual tune views"""
    creator = TuneCreatorSerializer(read_only=True)
    category = TuneCategorySerializer(read_only=True)
    tune_type = TuneTypeSerializer(read_only=True)
    safety_rating = SafetyRatingSerializer(read_only=True)
    compatible_motorcycles = TuneCompatibilitySerializer(
        source='tunecompatibility_set', many=True, read_only=True
    )
    
    class Meta:
        model = Tune
        fields = [
            'id', 'name', 'version', 'description', 'short_description',
            'creator', 'category', 'tune_type', 'safety_rating',
            'power_gain_hp', 'power_gain_percentage',
            'torque_gain_nm', 'torque_gain_percentage',
            'fuel_economy_change_percentage', 'price',
            'is_open_source', 'dyno_tested', 'street_legal',
            'is_track_only', 'requires_premium_fuel',
            'download_count', 'view_count', 'average_rating',
            'tags', 'installation_instructions',
            'published_at', 'is_featured',
            'compatible_motorcycles'
        ]


class TuneReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    motorcycle_name = serializers.CharField(source='motorcycle.model_name', read_only=True)
    
    class Meta:
        model = TuneReview
        fields = [
            'id', 'username', 'motorcycle_name', 'overall_rating',
            'performance_rating', 'installation_ease', 'value_for_money',
            'title', 'review_text', 'pros', 'cons',
            'is_verified_purchase', 'helpful_count', 'created_at'
        ] 