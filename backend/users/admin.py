from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, RidingProfile, UserGarage, RideSession, 
    UserAchievement, UserStats
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Enhanced user admin with RevSync-specific fields"""
    list_display = [
        'username', 'email', 'full_name', 'country', 'is_verified', 
        'is_premium', 'login_count', 'join_date', 'is_active'
    ]
    list_filter = [
        'is_verified', 'is_premium', 'is_active', 'is_staff', 'country',
        'profile_visibility', 'join_date'
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-join_date']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': (
                'phone_number', 'date_of_birth', 'country', 'state_province', 
                'city', 'timezone', 'avatar_url', 'bio', 'website'
            )
        }),
        ('Privacy Settings', {
            'fields': (
                'profile_visibility', 'show_riding_stats', 'show_garage'
            )
        }),
        ('Platform Preferences', {
            'fields': (
                'metric_units', 'email_notifications', 'push_notifications', 
                'marketing_emails'
            )
        }),
        ('Account Status', {
            'fields': (
                'is_verified', 'verification_token', 'is_premium', 
                'premium_expires_at'
            )
        }),
        ('Activity Tracking', {
            'fields': ('last_active', 'login_count')
        }),
    )
    
    readonly_fields = ['verification_token', 'last_active', 'join_date']


@admin.register(RidingProfile)
class RidingProfileAdmin(admin.ModelAdmin):
    """Riding profile admin"""
    list_display = [
        'user', 'experience_level', 'years_riding', 'primary_riding_style',
        'preferred_power_range', 'safety_priority', 'tuning_interest'
    ]
    list_filter = [
        'experience_level', 'primary_riding_style', 'preferred_power_range',
        'track_experience', 'racing_experience', 'diy_maintenance'
    ]
    search_fields = ['user__username', 'user__email']
    
    fieldsets = (
        ('Experience', {
            'fields': ('user', 'experience_level', 'years_riding', 'license_date')
        }),
        ('Riding Preferences', {
            'fields': (
                'primary_riding_style', 'secondary_riding_styles',
                'favorite_riding_conditions', 'preferred_power_range'
            )
        }),
        ('Performance & Safety', {
            'fields': (
                'comfort_vs_performance', 'safety_priority', 'track_experience',
                'racing_experience'
            )
        }),
        ('Maintenance & Tuning', {
            'fields': ('diy_maintenance', 'tuning_interest')
        }),
    )


@admin.register(UserGarage)
class UserGarageAdmin(admin.ModelAdmin):
    """User garage admin"""
    list_display = [
        'user', 'motorcycle', 'ownership_status', 'purchase_date',
        'is_tuned', 'overall_rating', 'is_public'
    ]
    list_filter = [
        'ownership_status', 'is_tuned', 'is_public', 'overall_rating',
        'motorcycle__manufacturer', 'motorcycle__category'
    ]
    search_fields = [
        'user__username', 'motorcycle__model_name', 
        'motorcycle__manufacturer__name', 'nickname'
    ]
    date_hierarchy = 'purchase_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'motorcycle', 'ownership_status', 'nickname')
        }),
        ('Ownership Details', {
            'fields': ('purchase_date', 'purchase_price', 'current_mileage_km')
        }),
        ('Customizations', {
            'fields': ('modifications', 'tune_count', 'is_tuned')
        }),
        ('User Experience', {
            'fields': ('overall_rating', 'pros', 'cons')
        }),
        ('Settings', {
            'fields': ('is_public', 'notes')
        }),
    )


@admin.register(RideSession)
class RideSessionAdmin(admin.ModelAdmin):
    """Ride session admin"""
    list_display = [
        'user', 'motorcycle', 'ride_type', 'start_time', 'duration_hours',
        'distance_km', 'avg_speed_kmh', 'enjoyment_rating'
    ]
    list_filter = [
        'ride_type', 'weather_condition', 'is_public', 'enjoyment_rating',
        'safety_rating', 'start_time'
    ]
    search_fields = [
        'user__username', 'motorcycle__model_name', 'start_location', 'end_location'
    ]
    date_hierarchy = 'start_time'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'motorcycle', 'garage_bike', 'ride_type')
        }),
        ('Time & Duration', {
            'fields': ('start_time', 'end_time', 'duration_minutes')
        }),
        ('Location & Route', {
            'fields': (
                'start_location', 'end_location', 'route_description',
                'start_latitude', 'start_longitude', 'end_latitude', 'end_longitude'
            )
        }),
        ('Performance Data', {
            'fields': (
                'distance_km', 'avg_speed_kmh', 'max_speed_kmh', 'fuel_consumed_liters'
            )
        }),
        ('Environmental Conditions', {
            'fields': ('weather_condition', 'temperature_celsius')
        }),
        ('User Experience', {
            'fields': ('enjoyment_rating', 'safety_rating', 'notes')
        }),
        ('Social Settings', {
            'fields': ('is_public', 'share_route')
        }),
    )
    
    def duration_hours(self, obj):
        return obj.duration_hours
    duration_hours.short_description = 'Duration (hours)'


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    """User achievement admin"""
    list_display = [
        'user', 'name', 'achievement_type', 'progress_percentage',
        'is_completed', 'badge_level', 'points_awarded'
    ]
    list_filter = [
        'achievement_type', 'is_completed', 'badge_level', 'created_at'
    ]
    search_fields = ['user__username', 'name', 'description']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'achievement_type', 'name', 'description', 'icon_url')
        }),
        ('Progress', {
            'fields': ('target_value', 'current_value', 'is_completed', 'completed_at')
        }),
        ('Rewards', {
            'fields': ('points_awarded', 'badge_level')
        }),
    )
    
    def progress_percentage(self, obj):
        if obj.target_value and obj.target_value > 0:
            percentage = min(100, (float(obj.current_value) / float(obj.target_value)) * 100)
            return f"{percentage:.1f}%"
        return "N/A"
    progress_percentage.short_description = 'Progress'


@admin.register(UserStats)
class UserStatsAdmin(admin.ModelAdmin):
    """User statistics admin"""
    list_display = [
        'user', 'total_rides', 'total_distance_km', 'total_ride_time_hours',
        'total_points', 'achievements_unlocked', 'distance_rank'
    ]
    list_filter = ['updated_at']
    search_fields = ['user__username']
    readonly_fields = [
        'total_rides', 'total_distance_km', 'total_ride_time_minutes',
        'avg_ride_distance_km', 'avg_ride_duration_minutes', 'max_speed_achieved_kmh',
        'avg_speed_overall_kmh', 'total_fuel_consumed_liters', 'achievements_unlocked'
    ]
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Riding Statistics', {
            'fields': (
                'total_rides', 'total_distance_km', 'total_ride_time_minutes',
                'avg_ride_distance_km', 'avg_ride_duration_minutes'
            )
        }),
        ('Performance', {
            'fields': (
                'max_speed_achieved_kmh', 'avg_speed_overall_kmh', 'total_fuel_consumed_liters'
            )
        }),
        ('Platform Activity', {
            'fields': (
                'total_points', 'achievements_unlocked', 'tunes_downloaded',
                'tunes_uploaded', 'community_posts'
            )
        }),
        ('Rankings', {
            'fields': ('distance_rank', 'points_rank', 'safety_rank')
        }),
        ('Streaks', {
            'fields': (
                'current_ride_streak_days', 'longest_ride_streak_days', 'last_ride_date'
            )
        }),
    )
    
    def total_ride_time_hours(self, obj):
        return obj.total_ride_time_hours
    total_ride_time_hours.short_description = 'Total Time (hours)'


# Customize admin site
admin.site.site_header = "RevSync Administration"
admin.site.site_title = "RevSync Admin"
admin.site.index_title = "Welcome to RevSync Administration" 