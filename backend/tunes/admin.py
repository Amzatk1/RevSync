from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Avg
from .models import (
    TuneCategory, TuneType, SafetyRating, TuneCreator, Tune,
    TuneCompatibility, TuneReview, TunePurchase, TuneDownload,
    TuneCollection, TuneCollectionItem
)


@admin.register(TuneCategory)
class TuneCategoryAdmin(admin.ModelAdmin):
    list_display = ['get_name_display', 'description', 'color_display', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    readonly_fields = ['created_at']
    
    def color_display(self, obj):
        return format_html(
            '<span style="color: {}; font-weight: bold;">● {}</span>',
            obj.color_code, obj.color_code
        )
    color_display.short_description = 'Color'


@admin.register(TuneType)
class TuneTypeAdmin(admin.ModelAdmin):
    list_display = ['get_name_display', 'skill_level_required', 'reversible', 'requires_hardware']
    list_filter = ['skill_level_required', 'reversible', 'requires_hardware']
    search_fields = ['name']
    readonly_fields = ['created_at']


@admin.register(SafetyRating)
class SafetyRatingAdmin(admin.ModelAdmin):
    list_display = ['get_level_display', 'color_display', 'requires_consent', 'requires_backup', 'max_downloads']
    list_filter = ['level', 'requires_consent', 'requires_backup']
    readonly_fields = ['created_at']
    
    def color_display(self, obj):
        return format_html(
            '<span style="color: {}; font-weight: bold;">● {}</span>',
            obj.color_code, obj.color_code
        )
    color_display.short_description = 'Color'


@admin.register(TuneCreator)
class TuneCreatorAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'business_name', 'verification_display', 'total_tunes',
        'total_downloads', 'average_rating', 'total_earnings'
    ]
    list_filter = ['is_verified', 'verification_level', 'public_profile']
    search_fields = ['user__username', 'business_name', 'bio']
    readonly_fields = [
        'created_at', 'updated_at', 'total_tunes', 'total_downloads',
        'average_rating', 'total_earnings'
    ]
    
    fieldsets = [
        ('Basic Information', {
            'fields': ['user', 'business_name', 'bio', 'specialties', 'experience_years', 'certifications']
        }),
        ('Contact & Social', {
            'fields': ['website', 'instagram', 'youtube', 'facebook']
        }),
        ('Verification', {
            'fields': ['is_verified', 'verification_level', 'verification_date']
        }),
        ('Statistics', {
            'fields': ['total_tunes', 'total_downloads', 'average_rating', 'total_earnings']
        }),
        ('Settings', {
            'fields': ['auto_approve_updates', 'allow_reviews', 'public_profile']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at']
        })
    ]
    
    def verification_display(self, obj):
        if obj.is_verified:
            return format_html(
                '<span style="color: green;">✓ {}</span>',
                obj.get_verification_level_display()
            )
        return format_html('<span style="color: red;">✗ Not Verified</span>')
    verification_display.short_description = 'Verification'


class TuneCompatibilityInline(admin.TabularInline):
    model = TuneCompatibility
    extra = 1
    fields = ['motorcycle', 'is_verified', 'testing_status', 'minimum_octane_rating']


@admin.register(Tune)
class TuneAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'creator', 'category', 'pricing_display', 'status_display',
        'safety_rating', 'download_count', 'rating_display', 'is_featured'
    ]
    list_filter = [
        'category', 'tune_type', 'safety_rating', 'status', 'pricing_type',
        'is_featured', 'is_track_only', 'dyno_tested', 'street_legal'
    ]
    search_fields = ['name', 'creator__user__username', 'creator__business_name', 'description']
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'published_at', 'last_downloaded_at',
        'download_count', 'view_count', 'like_count', 'review_count',
        'average_rating', 'total_revenue', 'commission_amount', 'creator_revenue'
    ]
    list_per_page = 50
    
    fieldsets = [
        ('Basic Information', {
            'fields': ['id', 'name', 'version', 'description', 'short_description']
        }),
        ('Relationships', {
            'fields': ['creator', 'category', 'tune_type', 'safety_rating']
        }),
        ('Compatibility', {
            'fields': ['required_modifications', 'exhaust_systems', 'air_intake_systems']
        }),
        ('Performance Claims', {
            'fields': [
                'power_gain_hp', 'power_gain_percentage', 'torque_gain_nm',
                'torque_gain_percentage', 'fuel_economy_change_percentage'
            ]
        }),
        ('Technical Details', {
            'fields': [
                'fuel_map_changes', 'ignition_timing_changes', 'rev_limit_change',
                'speed_limiter_removed'
            ]
        }),
        ('Files & Media', {
            'fields': [
                'tune_file', 'backup_file', 'dyno_chart', 'installation_video',
                'preview_images'
            ]
        }),
        ('Pricing', {
            'fields': [
                'pricing_type', 'price', 'rental_price_per_day',
                'subscription_price_monthly', 'commission_amount', 'creator_revenue'
            ]
        }),
        ('Distribution', {
            'fields': [
                'is_open_source', 'allow_modifications', 'requires_license_agreement',
                'max_downloads_per_purchase'
            ]
        }),
        ('Status & Moderation', {
            'fields': [
                'status', 'approval_date', 'rejection_reason', 'moderator_notes'
            ]
        }),
        ('Features', {
            'fields': [
                'is_featured', 'is_track_only', 'is_race_fuel_required',
                'requires_premium_fuel', 'dyno_tested', 'street_legal'
            ]
        }),
        ('Statistics', {
            'fields': [
                'download_count', 'view_count', 'like_count', 'review_count',
                'average_rating', 'total_revenue'
            ]
        }),
        ('Metadata', {
            'fields': [
                'tags', 'changelog', 'installation_instructions',
                'warranty_info', 'support_contact'
            ]
        }),
        ('Timestamps', {
            'fields': [
                'created_at', 'updated_at', 'published_at', 'last_downloaded_at'
            ]
        })
    ]
    
    inlines = [TuneCompatibilityInline]
    
    def pricing_display(self, obj):
        if obj.pricing_type == 'free':
            return 'Free'
        elif obj.pricing_type == 'paid':
            return f"${obj.price}"
        elif obj.pricing_type == 'rental':
            return f"${obj.rental_price_per_day}/day"
        elif obj.pricing_type == 'subscription':
            return f"${obj.subscription_price_monthly}/month"
        return obj.get_pricing_type_display()
    pricing_display.short_description = 'Price'
    
    def status_display(self, obj):
        colors = {
            'draft': 'gray',
            'pending_review': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'suspended': 'purple',
            'archived': 'darkgray'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    def rating_display(self, obj):
        if obj.average_rating > 0:
            stars = '★' * int(obj.average_rating) + '☆' * (5 - int(obj.average_rating))
            return format_html(f'{stars} ({obj.average_rating:.1f})')
        return '-'
    rating_display.short_description = 'Rating'


@admin.register(TuneCompatibility)
class TuneCompatibilityAdmin(admin.ModelAdmin):
    list_display = [
        'tune', 'motorcycle', 'is_verified', 'testing_status',
        'minimum_octane_rating', 'test_date'
    ]
    list_filter = [
        'is_verified', 'testing_status', 'requires_exhaust_modification',
        'requires_air_intake_modification', 'minimum_octane_rating'
    ]
    search_fields = [
        'tune__name', 'motorcycle__manufacturer__name', 'motorcycle__model_name'
    ]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TuneReview)
class TuneReviewAdmin(admin.ModelAdmin):
    list_display = [
        'tune', 'user', 'overall_rating', 'is_verified_purchase',
        'helpful_count', 'is_approved', 'created_at'
    ]
    list_filter = [
        'overall_rating', 'is_verified_purchase', 'is_approved', 'is_featured'
    ]
    search_fields = ['tune__name', 'user__username', 'title', 'review_text']
    readonly_fields = ['created_at', 'updated_at', 'helpful_count', 'reported_count']


@admin.register(TunePurchase)
class TunePurchaseAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'tune', 'purchase_type', 'amount_paid',
        'payment_status', 'download_count', 'downloads_remaining', 'created_at'
    ]
    list_filter = ['purchase_type', 'payment_status', 'payment_processor']
    search_fields = [
        'user__username', 'tune__name', 'transaction_id'
    ]
    readonly_fields = ['created_at', 'updated_at', 'is_active', 'can_download']


@admin.register(TuneDownload)
class TuneDownloadAdmin(admin.ModelAdmin):
    list_display = [
        'purchase', 'download_type', 'status', 'file_size_display',
        'download_duration_seconds', 'created_at'
    ]
    list_filter = ['download_type', 'status', 'download_method']
    search_fields = ['purchase__user__username', 'purchase__tune__name']
    readonly_fields = ['created_at', 'completed_at']
    
    def file_size_display(self, obj):
        if obj.file_size_bytes:
            size_mb = obj.file_size_bytes / (1024 * 1024)
            return f"{size_mb:.1f} MB"
        return "-"
    file_size_display.short_description = 'File Size'


class TuneCollectionItemInline(admin.TabularInline):
    model = TuneCollectionItem
    extra = 1
    fields = ['tune', 'order', 'featured_note']


@admin.register(TuneCollection)
class TuneCollectionAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'collection_type', 'tune_count', 'is_featured',
        'is_active', 'created_by', 'created_at'
    ]
    list_filter = ['collection_type', 'is_featured', 'is_active']
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'tune_count']
    
    inlines = [TuneCollectionItemInline]
    
    def tune_count(self, obj):
        return obj.tunes.count()
    tune_count.short_description = 'Tunes'


# Custom admin site modifications
admin.site.site_header = "RevSync Administration"
admin.site.site_title = "RevSync Admin"
admin.site.index_title = "Welcome to RevSync Administration"
