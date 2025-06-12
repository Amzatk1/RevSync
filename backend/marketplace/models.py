from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid

class TuneMarketplaceListing(models.Model):
    """Marketplace listing for a tune that can be purchased"""
    
    LISTING_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_REVIEW', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
        ('ARCHIVED', 'Archived'),
    ]
    
    PRICING_TYPE_CHOICES = [
        ('FREE', 'Free'),
        ('PAID', 'Paid'),
        ('RENTAL', 'Rental'),
        ('SUBSCRIPTION', 'Subscription'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tune_file = models.ForeignKey('tunes.TuneFile', on_delete=models.CASCADE)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='marketplace_listings')
    
    # Marketplace specific fields
    title = models.CharField(max_length=200)
    description = models.TextField()
    short_description = models.CharField(max_length=500)
    
    # Pricing
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES, default='PAID')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    rental_duration_days = models.IntegerField(null=True, blank=True)  # For rental tunes
    
    # Metadata
    performance_gains = models.JSONField(default=dict)  # e.g., {"hp": "+15", "torque": "+20Nm"}
    dyno_chart_url = models.URLField(blank=True)
    sample_logs_url = models.URLField(blank=True)
    
    # Compatibility (enhanced)
    compatible_bikes = models.ManyToManyField('motorcycles.Motorcycle', through='TuneCompatibility')
    required_hardware = models.CharField(max_length=200, blank=True)
    connection_method = models.CharField(max_length=100, blank=True)  # e.g., "OBD-II", "Ducati 3-pin"
    
    # Track/Racing specific
    track_mode = models.BooleanField(default=False)
    race_mode = models.BooleanField(default=False)
    track_tested_venues = models.CharField(max_length=500, blank=True)
    
    # Status and review
    status = models.CharField(max_length=20, choices=LISTING_STATUS_CHOICES, default='DRAFT')
    featured = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True)
    
    # Sales metrics
    total_sales = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'featured']),
            models.Index(fields=['pricing_type', 'price']),
            models.Index(fields=['creator', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.creator.username}"
    
    @property
    def is_free(self):
        return self.pricing_type == 'FREE' or self.price == 0


class TuneCompatibility(models.Model):
    """Through model for listing-bike compatibility"""
    listing = models.ForeignKey(TuneMarketplaceListing, on_delete=models.CASCADE)
    bike_model = models.ForeignKey('motorcycles.BikeModel', on_delete=models.CASCADE)
    year_start = models.IntegerField()
    year_end = models.IntegerField()
    ecu_type = models.CharField(max_length=100)
    verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['listing', 'bike_model', 'year_start', 'year_end']


class TunePurchase(models.Model):
    """Record of a tune purchase"""
    
    PURCHASE_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tune_purchases')
    listing = models.ForeignKey(TuneMarketplaceListing, on_delete=models.CASCADE)
    motorcycle = models.ForeignKey('motorcycles.Motorcycle', on_delete=models.CASCADE)
    
    # Purchase details
    price_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    payment_id = models.CharField(max_length=200, unique=True)
    
    # Rental specific
    rental_start_date = models.DateTimeField(null=True, blank=True)
    rental_end_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=PURCHASE_STATUS_CHOICES, default='PENDING')
    download_count = models.IntegerField(default=0)
    max_downloads = models.IntegerField(default=3)  # Limit downloads for security
    
    # Timestamps
    purchased_at = models.DateTimeField(auto_now_add=True)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['buyer', 'listing']  # Prevent duplicate purchases
        ordering = ['-purchased_at']
    
    def __str__(self):
        return f"{self.buyer.username} - {self.listing.title}"
    
    @property
    def is_rental_active(self):
        if not self.rental_end_date:
            return False
        from django.utils import timezone
        return timezone.now() <= self.rental_end_date


class CreatorProfile(models.Model):
    """Enhanced profile for tune creators"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='creator_profile')
    
    # Creator info
    display_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    website = models.URLField(blank=True)
    social_links = models.JSONField(default=dict)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_level = models.CharField(max_length=20, default='NONE')  # NONE, BASIC, PROFESSIONAL, EXPERT
    credentials = models.TextField(blank=True)
    
    # Revenue sharing
    revenue_share_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('70.00'),
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Payout info
    payout_method = models.CharField(max_length=50, default='STRIPE')
    payout_details = models.JSONField(default=dict)  # Encrypted payout info
    
    # Statistics
    total_sales = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    
    # Settings
    auto_approve_reviews = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Creator: {self.display_name}"


class RevenuePayout(models.Model):
    """Track payouts to creators"""
    
    PAYOUT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(CreatorProfile, on_delete=models.CASCADE)
    
    # Payout details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Payment processing
    status = models.CharField(max_length=20, choices=PAYOUT_STATUS_CHOICES, default='PENDING')
    payment_processor = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=200, blank=True)
    
    # Related sales
    included_purchases = models.ManyToManyField(TunePurchase)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payout {self.amount} to {self.creator.display_name}"


class TuneReview(models.Model):
    """User reviews for purchased tunes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    purchase = models.OneToOneField(TunePurchase, on_delete=models.CASCADE)
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE)
    listing = models.ForeignKey(TuneMarketplaceListing, on_delete=models.CASCADE)
    
    # Review content
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    # Performance feedback
    performance_improvement = models.JSONField(default=dict)  # {"hp": "+12", "torque": "+18Nm"}
    installation_difficulty = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1=Very Easy, 5=Very Difficult"
    )
    
    # Verification
    verified_purchase = models.BooleanField(default=True)
    helpful_votes = models.IntegerField(default=0)
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    moderator_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review by {self.reviewer.username} - {self.rating}★"


class SafetyValidation(models.Model):
    """Safety validation records for tunes"""
    
    VALIDATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PASSED', 'Passed'),
        ('FAILED', 'Failed'),
        ('NEEDS_REVIEW', 'Needs Review'),
    ]
    
    listing = models.ForeignKey(TuneMarketplaceListing, on_delete=models.CASCADE)
    validator = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    # Validation results
    status = models.CharField(max_length=20, choices=VALIDATION_STATUS_CHOICES, default='PENDING')
    checksum_valid = models.BooleanField(default=False)
    safety_limits_check = models.JSONField(default=dict)
    compatibility_verified = models.BooleanField(default=False)
    
    # Issues found
    issues_found = models.JSONField(default=list)
    risk_level = models.CharField(max_length=20, default='LOW')  # LOW, MEDIUM, HIGH, CRITICAL
    
    # Notes
    validation_notes = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    
    validated_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Validation for {self.listing.title} - {self.status}" 