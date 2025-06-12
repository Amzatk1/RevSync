from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import (
    Manufacturer, EngineType, BikeCategory, Motorcycle, ECUType, 
    MotorcycleECU, BikeSpecification, BikeImage, BikeReview
)


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ['name', 'country', 'founded_year', 'motorcycle_count', 'is_active']
    list_filter = ['country', 'is_active', 'founded_year']
    search_fields = ['name', 'country']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 50
    
    def motorcycle_count(self, obj):
        return obj.motorcycles.count()
    motorcycle_count.short_description = 'Motorcycles'


@admin.register(EngineType)
class EngineTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'configuration', 'cooling_system', 'fuel_system']
    list_filter = ['configuration', 'cooling_system', 'fuel_system']
    search_fields = ['name']
    readonly_fields = ['created_at']


@admin.register(BikeCategory)
class BikeCategoryAdmin(admin.ModelAdmin):
    list_display = ['get_name_display', 'description']
    search_fields = ['name']
    readonly_fields = ['created_at']


class MotorcycleECUInline(admin.TabularInline):
    model = MotorcycleECU
    extra = 1
    fields = ['ecu_type', 'part_number', 'is_primary', 'is_verified', 'market_region']


class BikeImageInline(admin.TabularInline):
    model = BikeImage
    extra = 1
    fields = ['image_url', 'image_type', 'caption', 'order', 'is_active']


@admin.register(Motorcycle)
class MotorcycleAdmin(admin.ModelAdmin):
    list_display = [
        'full_name_display', 'year', 'category', 'displacement_cc', 
        'max_power_hp', 'price_display', 'is_active'
    ]
    list_filter = [
        'manufacturer', 'category', 'year', 'abs', 'traction_control',
        'is_discontinued', 'is_active', 'transmission_type'
    ]
    search_fields = ['manufacturer__name', 'model_name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'power_to_weight_ratio']
    list_per_page = 50
    
    fieldsets = [
        ('Basic Information', {
            'fields': ['manufacturer', 'model_name', 'year', 'category', 'engine_type', 'description']
        }),
        ('Engine Specifications', {
            'fields': [
                'displacement_cc', 'cylinders', 'bore_mm', 'stroke_mm', 
                'compression_ratio', 'max_power_hp', 'max_power_rpm',
                'max_torque_nm', 'max_torque_rpm'
            ]
        }),
        ('Physical Specifications', {
            'fields': [
                'dry_weight_kg', 'wet_weight_kg', 'seat_height_mm',
                'wheelbase_mm', 'fuel_capacity_liters'
            ]
        }),
        ('Performance', {
            'fields': [
                'top_speed_kmh', 'acceleration_0_100_seconds',
                'fuel_consumption_l100km', 'power_to_weight_ratio'
            ]
        }),
        ('Transmission & Electronics', {
            'fields': [
                'transmission_type', 'gears', 'abs', 'traction_control',
                'riding_modes', 'quickshifter', 'cruise_control', 'electronic_suspension'
            ]
        }),
        ('Pricing & Availability', {
            'fields': [
                'msrp_usd', 'production_start_year', 'production_end_year', 'is_discontinued'
            ]
        }),
        ('Media', {
            'fields': ['primary_image_url', 'gallery_images']
        }),
        ('Status', {
            'fields': ['is_active', 'created_at', 'updated_at']
        })
    ]
    
    inlines = [MotorcycleECUInline, BikeImageInline]
    
    def full_name_display(self, obj):
        return f"{obj.manufacturer.name} {obj.model_name}"
    full_name_display.short_description = 'Motorcycle'
    full_name_display.admin_order_field = 'manufacturer__name'
    
    def price_display(self, obj):
        if obj.msrp_usd:
            return f"${obj.msrp_usd:,.0f}"
        return "-"
    price_display.short_description = 'MSRP'
    price_display.admin_order_field = 'msrp_usd'


@admin.register(ECUType)
class ECUTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'manufacturer', 'version', 'communication_protocol',
        'is_tunable', 'is_active', 'motorcycle_count'
    ]
    list_filter = [
        'manufacturer', 'communication_protocol', 'is_tunable',
        'supports_obd', 'supports_can_bus', 'is_active'
    ]
    search_fields = ['name', 'manufacturer', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Basic Information', {
            'fields': ['name', 'manufacturer', 'version', 'description']
        }),
        ('Technical Specifications', {
            'fields': ['processor', 'memory_kb', 'flash_memory_kb']
        }),
        ('Tuning Capabilities', {
            'fields': [
                'is_tunable', 'requires_cable', 'supports_obd', 'supports_can_bus'
            ]
        }),
        ('Communication', {
            'fields': ['communication_protocol', 'baud_rate']
        }),
        ('File Formats & Safety', {
            'fields': [
                'supported_formats', 'backup_format', 'requires_immobilizer_bypass',
                'checksum_validation'
            ]
        }),
        ('Documentation', {
            'fields': ['documentation_url']
        }),
        ('Status', {
            'fields': ['is_active', 'created_at', 'updated_at']
        })
    ]
    
    def motorcycle_count(self, obj):
        return obj.motorcycleecu_set.count()
    motorcycle_count.short_description = 'Compatible Bikes'


@admin.register(MotorcycleECU)
class MotorcycleECUAdmin(admin.ModelAdmin):
    list_display = [
        'motorcycle', 'ecu_type', 'part_number', 'market_region',
        'is_primary', 'is_verified'
    ]
    list_filter = [
        'ecu_type__manufacturer', 'market_region', 'emissions_standard',
        'is_primary', 'is_verified'
    ]
    search_fields = [
        'motorcycle__manufacturer__name', 'motorcycle__model_name',
        'ecu_type__name', 'part_number'
    ]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BikeSpecification)
class BikeSpecificationAdmin(admin.ModelAdmin):
    list_display = ['motorcycle', 'frame_type', 'valve_configuration']
    search_fields = ['motorcycle__manufacturer__name', 'motorcycle__model_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BikeImage)
class BikeImageAdmin(admin.ModelAdmin):
    list_display = ['motorcycle', 'image_type', 'caption', 'order', 'is_active']
    list_filter = ['image_type', 'is_active']
    search_fields = ['motorcycle__manufacturer__name', 'motorcycle__model_name', 'caption']
    readonly_fields = ['created_at']


@admin.register(BikeReview)
class BikeReviewAdmin(admin.ModelAdmin):
    list_display = [
        'motorcycle', 'review_type', 'source', 'rating', 'is_featured', 'published_date'
    ]
    list_filter = ['review_type', 'is_featured', 'published_date']
    search_fields = [
        'motorcycle__manufacturer__name', 'motorcycle__model_name',
        'title', 'source', 'author'
    ]
    readonly_fields = ['created_at']
    
    def rating_display(self, obj):
        if obj.rating:
            stars = '★' * int(obj.rating) + '☆' * (5 - int(obj.rating))
            return format_html(f'{stars} ({obj.rating})')
        return '-'
    rating_display.short_description = 'Rating'
