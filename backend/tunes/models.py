from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class TuneCategory(models.Model):
    """Categories for tune classification"""
    CATEGORY_CHOICES = [
        ('performance', 'Performance'),
        ('economy', 'Economy'),
        ('racing', 'Racing'),
        ('track', 'Track Day'),
        ('street', 'Street'),
        ('touring', 'Touring'),
        ('emission_delete', 'Emission Delete'),
        ('custom', 'Custom'),
        ('diagnostic', 'Diagnostic'),
        ('stock_replacement', 'Stock Replacement'),
    ]

    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True, db_index=True)
    description = models.TextField(blank=True)
    color_code = models.CharField(max_length=7, default='#007bff')  # Hex color
    icon_name = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tune_categories'
        verbose_name_plural = 'Tune Categories'

    def __str__(self):
        return self.get_name_display()


class TuneType(models.Model):
    """Different types of tunes based on modification level"""
    TYPE_CHOICES = [
        ('flash', 'Flash Tune'),
        ('piggyback', 'Piggyback Module'),
        ('standalone', 'Standalone ECU'),
        ('fuel_controller', 'Fuel Controller'),
        ('ignition_map', 'Ignition Map'),
        ('full_system', 'Full System Tune'),
    ]

    name = models.CharField(max_length=50, choices=TYPE_CHOICES, unique=True, db_index=True)
    description = models.TextField(blank=True)
    technical_details = models.TextField(blank=True)
    skill_level_required = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('expert', 'Expert Only'),
        ],
        default='intermediate'
    )
    reversible = models.BooleanField(default=True)
    requires_hardware = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tune_types'

    def __str__(self):
        return self.get_name_display()


class SafetyRating(models.Model):
    """Safety ratings for tunes"""
    RATING_CHOICES = [
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Risk'),
    ]

    level = models.CharField(max_length=10, choices=RATING_CHOICES, unique=True, db_index=True)
    description = models.TextField()
    color_code = models.CharField(max_length=7)  # Hex color
    warning_text = models.TextField()
    requires_consent = models.BooleanField(default=True)
    requires_backup = models.BooleanField(default=True)
    max_downloads = models.PositiveIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'safety_ratings'

    def __str__(self):
        return f"{self.get_level_display()}"


class TuneCreator(models.Model):
    """Extended profile for tune creators"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='creator_profile')
    business_name = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    specialties = models.JSONField(default=list)  # ['Sport bikes', 'Harley Davidson', etc.]
    experience_years = models.PositiveIntegerField(default=0)
    certifications = models.JSONField(default=list)
    
    # Contact & Social
    website = models.URLField(blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    youtube = models.CharField(max_length=100, blank=True)
    facebook = models.CharField(max_length=100, blank=True)
    
    # Verification & Status
    is_verified = models.BooleanField(default=False, db_index=True)
    verification_level = models.CharField(
        max_length=20,
        choices=[
            ('basic', 'Basic Verified'),
            ('professional', 'Professional'),
            ('expert', 'Expert Tuner'),
            ('oem_partner', 'OEM Partner'),
        ],
        default='basic'
    )
    verification_date = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_tunes = models.PositiveIntegerField(default=0)
    total_downloads = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Settings
    auto_approve_updates = models.BooleanField(default=False)
    allow_reviews = models.BooleanField(default=True)
    public_profile = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tune_creators'
        indexes = [
            models.Index(fields=['is_verified']),
            models.Index(fields=['verification_level']),
            models.Index(fields=['average_rating']),
            models.Index(fields=['total_downloads']),
        ]

    def __str__(self):
        return f"{self.user.username} ({self.business_name or 'Individual'})"


class Tune(models.Model):
    """Main tune model with comprehensive metadata"""
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, db_index=True)
    version = models.CharField(max_length=20, default='1.0')
    description = models.TextField()
    short_description = models.CharField(max_length=300)
    
    # Relationships
    creator = models.ForeignKey(TuneCreator, on_delete=models.CASCADE, related_name='tunes')
    category = models.ForeignKey(TuneCategory, on_delete=models.CASCADE, db_index=True)
    tune_type = models.ForeignKey(TuneType, on_delete=models.CASCADE, db_index=True)
    safety_rating = models.ForeignKey(SafetyRating, on_delete=models.CASCADE, db_index=True)
    
    # Compatibility
    compatible_motorcycles = models.ManyToManyField(
        'bikes.Motorcycle', 
        through='TuneCompatibility',
        related_name='compatible_tunes'
    )
    required_modifications = models.TextField(blank=True)
    exhaust_systems = models.JSONField(default=list)  # Compatible exhaust systems
    air_intake_systems = models.JSONField(default=list)
    
    # Performance Claims
    power_gain_hp = models.PositiveIntegerField(null=True, blank=True)
    power_gain_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    torque_gain_nm = models.PositiveIntegerField(null=True, blank=True)
    torque_gain_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fuel_economy_change_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Technical Details
    fuel_map_changes = models.TextField(blank=True)
    ignition_timing_changes = models.TextField(blank=True)
    rev_limit_change = models.IntegerField(null=True, blank=True)
    speed_limiter_removed = models.BooleanField(default=False)
    
    # Files & Media
    tune_file = models.FileField(
        upload_to='tunes/files/',
        validators=[FileExtensionValidator(allowed_extensions=['bin', 'hex', 'ecu', 'map'])],
        null=True, blank=True
    )
    backup_file = models.FileField(upload_to='tunes/backups/', null=True, blank=True)
    dyno_chart = models.ImageField(upload_to='tunes/dyno_charts/', null=True, blank=True)
    installation_video = models.URLField(blank=True)
    preview_images = models.JSONField(default=list)
    
    # Pricing & Distribution
    PRICING_CHOICES = [
        ('free', 'Free'),
        ('paid', 'Paid'),
        ('subscription', 'Subscription'),
        ('rental', 'Rental'),
    ]
    pricing_type = models.CharField(max_length=20, choices=PRICING_CHOICES, default='paid', db_index=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    rental_price_per_day = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    subscription_price_monthly = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Distribution Settings
    is_open_source = models.BooleanField(default=False, db_index=True)
    allow_modifications = models.BooleanField(default=False)
    requires_license_agreement = models.BooleanField(default=True)
    max_downloads_per_purchase = models.PositiveIntegerField(default=3)
    
    # Status & Moderation
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    approval_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    moderator_notes = models.TextField(blank=True)
    
    # Features & Tags
    is_featured = models.BooleanField(default=False, db_index=True)
    is_track_only = models.BooleanField(default=False, db_index=True)
    is_race_fuel_required = models.BooleanField(default=False)
    requires_premium_fuel = models.BooleanField(default=False)
    dyno_tested = models.BooleanField(default=False, db_index=True)
    street_legal = models.BooleanField(default=True, db_index=True)
    
    # Statistics
    download_count = models.PositiveIntegerField(default=0, db_index=True)
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    review_count = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, db_index=True)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Metadata
    tags = models.JSONField(default=list)  # ['sportbike', 'track', 'high-octane']
    changelog = models.TextField(blank=True)
    installation_instructions = models.TextField(blank=True)
    warranty_info = models.TextField(blank=True)
    support_contact = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_downloaded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tunes'
        indexes = [
            models.Index(fields=['creator', 'status']),
            models.Index(fields=['category', 'pricing_type']),
            models.Index(fields=['safety_rating', 'is_featured']),
            models.Index(fields=['download_count']),
            models.Index(fields=['average_rating']),
            models.Index(fields=['published_at']),
            models.Index(fields=['price']),
            models.Index(fields=['is_track_only']),
            models.Index(fields=['dyno_tested']),
            models.Index(fields=['street_legal']),
        ]
        ordering = ['-published_at', '-download_count']

    def __str__(self):
        return f"{self.name} v{self.version} by {self.creator.user.username}"

    @property
    def is_published(self):
        return self.status == 'approved' and self.published_at is not None

    @property
    def commission_amount(self):
        """Calculate platform commission (30%)"""
        if self.pricing_type == 'paid':
            return round(self.price * Decimal('0.30'), 2)
        return Decimal('0.00')

    @property
    def creator_revenue(self):
        """Calculate creator revenue (70%)"""
        if self.pricing_type == 'paid':
            return round(self.price * Decimal('0.70'), 2)
        return Decimal('0.00')


class TuneCompatibility(models.Model):
    """Detailed compatibility information between tunes and motorcycles"""
    tune = models.ForeignKey(Tune, on_delete=models.CASCADE)
    motorcycle = models.ForeignKey('bikes.Motorcycle', on_delete=models.CASCADE)
    
    # Compatibility Details
    is_verified = models.BooleanField(default=False, db_index=True)
    testing_status = models.CharField(
        max_length=20,
        choices=[
            ('untested', 'Untested'),
            ('bench_tested', 'Bench Tested'),
            ('road_tested', 'Road Tested'),
            ('dyno_tested', 'Dyno Tested'),
            ('track_tested', 'Track Tested'),
        ],
        default='untested'
    )
    
    # Requirements
    requires_exhaust_modification = models.BooleanField(default=False)
    requires_air_intake_modification = models.BooleanField(default=False)
    requires_fuel_system_modification = models.BooleanField(default=False)
    minimum_octane_rating = models.PositiveIntegerField(default=91)
    
    # Performance Results
    tested_power_gain_hp = models.PositiveIntegerField(null=True, blank=True)
    tested_torque_gain_nm = models.PositiveIntegerField(null=True, blank=True)
    tested_fuel_economy_change = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Test Data
    test_date = models.DateField(null=True, blank=True)
    test_location = models.CharField(max_length=200, blank=True)
    test_conditions = models.TextField(blank=True)
    dyno_sheet_url = models.URLField(blank=True)
    
    # Notes
    compatibility_notes = models.TextField(blank=True)
    installation_notes = models.TextField(blank=True)
    known_issues = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tune_compatibility'
        unique_together = ['tune', 'motorcycle']
        indexes = [
            models.Index(fields=['tune', 'is_verified']),
            models.Index(fields=['motorcycle', 'testing_status']),
            models.Index(fields=['testing_status']),
        ]

    def __str__(self):
        return f"{self.tune.name} → {self.motorcycle}"


class TuneReview(models.Model):
    """User reviews and ratings for tunes"""
    tune = models.ForeignKey(Tune, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    motorcycle = models.ForeignKey('bikes.Motorcycle', on_delete=models.CASCADE)
    
    # Rating Components
    overall_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    performance_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    installation_ease = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    value_for_money = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Review Content
    title = models.CharField(max_length=200)
    review_text = models.TextField()
    pros = models.TextField(blank=True)
    cons = models.TextField(blank=True)
    
    # Verification
    is_verified_purchase = models.BooleanField(default=False, db_index=True)
    is_verified_installation = models.BooleanField(default=False)
    
    # Engagement
    helpful_count = models.PositiveIntegerField(default=0)
    reported_count = models.PositiveIntegerField(default=0)
    
    # Status
    is_approved = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tune_reviews'
        unique_together = ['tune', 'user']
        indexes = [
            models.Index(fields=['tune', 'is_approved']),
            models.Index(fields=['overall_rating']),
            models.Index(fields=['is_verified_purchase']),
            models.Index(fields=['helpful_count']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.tune.name} - {self.overall_rating}★ by {self.user.username}"


class TunePurchase(models.Model):
    """Track tune purchases and downloads"""
    tune = models.ForeignKey(Tune, on_delete=models.CASCADE, related_name='purchases')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tune_purchases')
    
    # Purchase Details
    purchase_type = models.CharField(
        max_length=20,
        choices=[
            ('purchase', 'One-time Purchase'),
            ('rental', 'Rental'),
            ('subscription', 'Subscription'),
            ('free_download', 'Free Download'),
        ],
        default='purchase'
    )
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='USD')
    
    # Payment Processing
    payment_processor = models.CharField(max_length=50, blank=True)  # stripe, paypal, etc.
    transaction_id = models.CharField(max_length=200, blank=True, db_index=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
            ('disputed', 'Disputed'),
        ],
        default='pending',
        db_index=True
    )
    
    # Download Management
    download_count = models.PositiveIntegerField(default=0)
    max_downloads = models.PositiveIntegerField(default=3)
    downloads_remaining = models.PositiveIntegerField(default=3)
    
    # Rental/Subscription
    expires_at = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=False)
    
    # Metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    purchase_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tune_purchases'
        unique_together = ['tune', 'user', 'purchase_type']
        indexes = [
            models.Index(fields=['user', 'payment_status']),
            models.Index(fields=['tune', 'created_at']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['payment_status']),
        ]

    def __str__(self):
        return f"{self.user.username} → {self.tune.name} ({self.purchase_type})"

    @property
    def is_active(self):
        """Check if purchase is still active"""
        if self.payment_status != 'completed':
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True

    @property
    def can_download(self):
        """Check if user can still download"""
        return self.is_active and self.downloads_remaining > 0


class TuneDownload(models.Model):
    """Track individual tune downloads"""
    purchase = models.ForeignKey(TunePurchase, on_delete=models.CASCADE, related_name='downloads')
    
    # Download Details
    download_type = models.CharField(
        max_length=20,
        choices=[
            ('tune_file', 'Tune File'),
            ('backup_file', 'Backup File'),
            ('documentation', 'Documentation'),
            ('dyno_chart', 'Dyno Chart'),
        ],
        default='tune_file'
    )
    file_size_bytes = models.PositiveIntegerField(default=0)
    download_duration_seconds = models.PositiveIntegerField(default=0)
    
    # Technical Details
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField()
    download_method = models.CharField(max_length=50, blank=True)  # web, api, mobile_app
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('started', 'Download Started'),
            ('completed', 'Download Completed'),
            ('failed', 'Download Failed'),
            ('cancelled', 'Download Cancelled'),
        ],
        default='started'
    )
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tune_downloads'
        indexes = [
            models.Index(fields=['purchase', 'download_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['ip_address']),
        ]

    def __str__(self):
        return f"{self.purchase.user.username} downloaded {self.purchase.tune.name}"


class TuneCollection(models.Model):
    """Curated collections of tunes"""
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField()
    cover_image = models.URLField(blank=True)
    
    # Collection Type
    COLLECTION_TYPES = [
        ('featured', 'Featured Collection'),
        ('editorial', 'Editorial Pick'),
        ('seasonal', 'Seasonal Collection'),
        ('category', 'Category Collection'),
        ('creator', 'Creator Spotlight'),
        ('performance', 'Performance Focus'),
    ]
    collection_type = models.CharField(max_length=20, choices=COLLECTION_TYPES, default='featured')
    
    # Content
    tunes = models.ManyToManyField(Tune, through='TuneCollectionItem')
    
    # Display Settings
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    display_order = models.PositiveIntegerField(default=0)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_collections')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tune_collections'
        indexes = [
            models.Index(fields=['collection_type', 'is_active']),
            models.Index(fields=['is_featured', 'display_order']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return self.name


class TuneCollectionItem(models.Model):
    """Items within a tune collection"""
    collection = models.ForeignKey(TuneCollection, on_delete=models.CASCADE)
    tune = models.ForeignKey(Tune, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    featured_note = models.CharField(max_length=200, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tune_collection_items'
        unique_together = ['collection', 'tune']
        ordering = ['order', 'added_at']

    def __str__(self):
        return f"{self.collection.name} → {self.tune.name}"
