from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import (
    User, RidingProfile, UserGarage, RideSession, 
    UserAchievement, UserStats
)
from bikes.models import Motorcycle
from bikes.serializers import MotorcycleListSerializer


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration with validation"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'country', 'state_province', 'city'
        ]
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create related profile objects
        RidingProfile.objects.create(user=user)
        UserStats.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """User login serializer"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Find user by email
            try:
                user = User.objects.get(email=email)
                username = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
            
            user = authenticate(request=self.context.get('request'),
                              username=username, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
                
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile with privacy controls"""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'date_of_birth', 'country', 'state_province', 'city',
            'timezone', 'avatar_url', 'bio', 'website', 'profile_visibility',
            'show_riding_stats', 'show_garage', 'metric_units', 
            'email_notifications', 'push_notifications', 'marketing_emails',
            'is_verified', 'is_premium', 'last_active', 'join_date'
        ]
        read_only_fields = [
            'id', 'is_verified', 'is_premium', 'last_active', 'join_date'
        ]
        extra_kwargs = {
            'email': {'read_only': True},  # Email changes require verification
        }


class RidingProfileSerializer(serializers.ModelSerializer):
    """Riding profile and preferences"""
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)
    primary_riding_style_display = serializers.CharField(source='get_primary_riding_style_display', read_only=True)
    preferred_power_range_display = serializers.CharField(source='get_preferred_power_range_display', read_only=True)
    
    class Meta:
        model = RidingProfile
        fields = [
            'experience_level', 'experience_level_display', 'years_riding', 'license_date',
            'primary_riding_style', 'primary_riding_style_display', 'secondary_riding_styles',
            'favorite_riding_conditions', 'preferred_power_range', 'preferred_power_range_display',
            'comfort_vs_performance', 'safety_priority', 'track_experience', 'racing_experience',
            'diy_maintenance', 'tuning_interest', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserGarageSerializer(serializers.ModelSerializer):
    """User garage with motorcycle details"""
    motorcycle = MotorcycleListSerializer(read_only=True)
    motorcycle_id = serializers.IntegerField(write_only=True)
    ownership_status_display = serializers.CharField(source='get_ownership_status_display', read_only=True)
    
    class Meta:
        model = UserGarage
        fields = [
            'id', 'motorcycle', 'motorcycle_id', 'ownership_status', 'ownership_status_display',
            'purchase_date', 'purchase_price', 'current_mileage_km', 'modifications',
            'tune_count', 'is_tuned', 'overall_rating', 'pros', 'cons', 'is_public',
            'nickname', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_motorcycle_id(self, value):
        try:
            motorcycle = Motorcycle.objects.get(id=value)
            return value
        except Motorcycle.DoesNotExist:
            raise serializers.ValidationError("Motorcycle not found")


class RideSessionSerializer(serializers.ModelSerializer):
    """Ride session tracking"""
    motorcycle = MotorcycleListSerializer(read_only=True)
    motorcycle_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    garage_bike_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    ride_type_display = serializers.CharField(source='get_ride_type_display', read_only=True)
    weather_condition_display = serializers.CharField(source='get_weather_condition_display', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = RideSession
        fields = [
            'id', 'motorcycle', 'motorcycle_id', 'garage_bike_id', 'ride_type', 'ride_type_display',
            'start_time', 'end_time', 'duration_minutes', 'duration_hours',
            'start_location', 'end_location', 'route_description',
            'start_latitude', 'start_longitude', 'end_latitude', 'end_longitude',
            'distance_km', 'avg_speed_kmh', 'max_speed_kmh', 'fuel_consumed_liters',
            'weather_condition', 'weather_condition_display', 'temperature_celsius',
            'enjoyment_rating', 'safety_rating', 'notes', 'is_public', 'share_route',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, attrs):
        # Ensure either motorcycle_id or garage_bike_id is provided
        if not attrs.get('motorcycle_id') and not attrs.get('garage_bike_id'):
            raise serializers.ValidationError("Either motorcycle_id or garage_bike_id must be provided")
        return attrs


class UserAchievementSerializer(serializers.ModelSerializer):
    """User achievements and progress"""
    achievement_type_display = serializers.CharField(source='get_achievement_type_display', read_only=True)
    badge_level_display = serializers.CharField(source='get_badge_level_display', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserAchievement
        fields = [
            'id', 'achievement_type', 'achievement_type_display', 'name', 'description',
            'icon_url', 'target_value', 'current_value', 'progress_percentage',
            'is_completed', 'completed_at', 'points_awarded', 'badge_level',
            'badge_level_display', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_progress_percentage(self, obj):
        if obj.target_value and obj.target_value > 0:
            return min(100, (float(obj.current_value) / float(obj.target_value)) * 100)
        return 0


class UserStatsSerializer(serializers.ModelSerializer):
    """User statistics and rankings"""
    total_ride_time_hours = serializers.ReadOnlyField()
    avg_fuel_efficiency = serializers.ReadOnlyField()
    
    class Meta:
        model = UserStats
        fields = [
            'total_rides', 'total_distance_km', 'total_ride_time_minutes', 'total_ride_time_hours',
            'avg_ride_distance_km', 'avg_ride_duration_minutes', 'max_speed_achieved_kmh',
            'avg_speed_overall_kmh', 'total_fuel_consumed_liters', 'avg_fuel_efficiency',
            'total_points', 'achievements_unlocked', 'tunes_downloaded', 'tunes_uploaded',
            'community_posts', 'distance_rank', 'points_rank', 'safety_rank',
            'current_ride_streak_days', 'longest_ride_streak_days', 'last_ride_date',
            'updated_at'
        ]
        read_only_fields = ['updated_at']


class UserPublicProfileSerializer(serializers.ModelSerializer):
    """Public user profile (limited fields)"""
    full_name = serializers.ReadOnlyField()
    riding_profile = RidingProfileSerializer(read_only=True)
    stats = UserStatsSerializer(read_only=True)
    total_garage_bikes = serializers.SerializerMethodField()
    total_achievements = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'avatar_url', 'bio', 'website',
            'country', 'state_province', 'city', 'is_verified', 'is_premium',
            'join_date', 'riding_profile', 'stats', 'total_garage_bikes', 'total_achievements'
        ]
    
    def get_total_garage_bikes(self, obj):
        return obj.garage.filter(ownership_status='owned').count()
    
    def get_total_achievements(self, obj):
        return obj.achievements.filter(is_completed=True).count()


class PasswordChangeSerializer(serializers.Serializer):
    """Password change serializer"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value


class EmailChangeSerializer(serializers.Serializer):
    """Email change serializer with verification"""
    new_email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate_new_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use")
        return value
    
    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Password is incorrect")
        return value


class UserDashboardSerializer(serializers.ModelSerializer):
    """User dashboard with comprehensive data"""
    riding_profile = RidingProfileSerializer(read_only=True)
    stats = UserStatsSerializer(read_only=True)
    recent_rides = serializers.SerializerMethodField()
    recent_achievements = serializers.SerializerMethodField()
    garage_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'avatar_url', 'is_verified', 'is_premium',
            'riding_profile', 'stats', 'recent_rides', 'recent_achievements', 'garage_summary'
        ]
    
    def get_recent_rides(self, obj):
        recent_rides = obj.ride_sessions.order_by('-start_time')[:5]
        return RideSessionSerializer(recent_rides, many=True).data
    
    def get_recent_achievements(self, obj):
        recent_achievements = obj.achievements.filter(is_completed=True).order_by('-completed_at')[:5]
        return UserAchievementSerializer(recent_achievements, many=True).data
    
    def get_garage_summary(self, obj):
        garage = obj.garage.filter(ownership_status='owned').select_related('motorcycle__manufacturer')
        return {
            'total_bikes': garage.count(),
            'bikes': UserGarageSerializer(garage, many=True).data
        } 