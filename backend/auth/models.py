"""
Authentication Models for RevSync

Integrates Django models with Supabase Auth for comprehensive user management,
including profiles, sessions, and security features.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone
import uuid
import json


class User(AbstractUser):
    """
    Extended User model that syncs with Supabase Auth
    """
    # Supabase Integration
    supabase_id = models.UUIDField(unique=True, null=True, blank=True, 
                                  help_text="Supabase Auth User ID")
    
    # Enhanced Profile Fields
    phone_number = models.CharField(
        max_length=20, 
        null=True, 
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', 
                                 message="Enter a valid phone number")]
    )
    date_of_birth = models.DateField(null=True, blank=True)
    avatar_url = models.URLField(null=True, blank=True)
    
    # Verification Status
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    
    # Security Settings
    two_factor_enabled = models.BooleanField(default=False)
    backup_codes_generated = models.BooleanField(default=False)
    
    # Preferences
    preferred_language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Privacy Settings
    profile_visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('friends', 'Friends Only'),
            ('private', 'Private'),
        ],
        default='public'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_active = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'auth_users'
        indexes = [
            models.Index(fields=['supabase_id']),
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    @property
    def display_name(self):
        """Return the best available display name"""
        return self.get_full_name() or self.username or self.email.split('@')[0]
    
    @property
    def is_fully_verified(self):
        """Check if user has completed all verification steps"""
        return self.email_verified and (not self.phone_number or self.phone_verified)


class UserProfile(models.Model):
    """
    Extended user profile for motorcycle-specific information
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Riding Information
    riding_experience = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner (< 1 year)'),
            ('intermediate', 'Intermediate (1-5 years)'),
            ('advanced', 'Advanced (5+ years)'),
            ('expert', 'Expert (10+ years)'),
        ],
        null=True,
        blank=True
    )
    
    preferred_riding_style = models.CharField(
        max_length=20,
        choices=[
            ('casual', 'Casual/Commuting'),
            ('sport', 'Sport Riding'),
            ('touring', 'Touring'),
            ('track', 'Track Days'),
            ('off_road', 'Off-Road'),
        ],
        null=True,
        blank=True
    )
    
    safety_tolerance = models.CharField(
        max_length=20,
        choices=[
            ('conservative', 'Conservative'),
            ('moderate', 'Moderate'),
            ('aggressive', 'Aggressive'),
        ],
        default='conservative'
    )
    
    # Performance Preferences
    performance_goals = models.JSONField(default=list, blank=True,
                                       help_text="List of performance goals")
    
    # Community Settings
    show_in_leaderboards = models.BooleanField(default=True)
    allow_friend_requests = models.BooleanField(default=True)
    share_ride_data = models.BooleanField(default=False)
    
    # Notifications Preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    marketing_emails = models.BooleanField(default=False)
    
    # Safety Acknowledgments
    safety_disclaimer_accepted = models.BooleanField(default=False)
    safety_disclaimer_date = models.DateTimeField(null=True, blank=True)
    terms_accepted = models.BooleanField(default=False)
    terms_accepted_date = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_tunes_applied = models.PositiveIntegerField(default=0)
    total_miles_logged = models.PositiveIntegerField(default=0)
    safety_score = models.FloatField(default=100.0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profile for {self.user.username}"


class AuthSession(models.Model):
    """
    Track user authentication sessions
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_sessions')
    
    # Session Information
    access_token_hash = models.CharField(max_length=128)
    refresh_token_hash = models.CharField(max_length=128)
    session_id = models.UUIDField(unique=True)
    
    # Device Information
    device_type = models.CharField(max_length=50, null=True, blank=True)
    device_name = models.CharField(max_length=100, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Location (optional)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    
    # Session Status
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    last_used = models.DateTimeField(auto_now=True)
    
    # Security
    requires_2fa = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'auth_sessions'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_id']),
            models.Index(fields=['expires_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Session for {self.user.username} on {self.device_name or 'Unknown Device'}"
    
    @property
    def is_expired(self):
        """Check if session is expired"""
        return timezone.now() > self.expires_at
    
    def invalidate(self):
        """Mark session as inactive"""
        self.is_active = False
        self.save(update_fields=['is_active'])


class OTPCode(models.Model):
    """
    One-Time Password codes for 2FA and verification
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    
    # OTP Information
    code = models.CharField(max_length=10)
    code_type = models.CharField(
        max_length=20,
        choices=[
            ('login', 'Login Verification'),
            ('email', 'Email Verification'),
            ('phone', 'Phone Verification'),
            ('password_reset', 'Password Reset'),
            ('account_recovery', 'Account Recovery'),
        ]
    )
    
    # Delivery Method
    delivery_method = models.CharField(
        max_length=10,
        choices=[
            ('email', 'Email'),
            ('sms', 'SMS'),
            ('app', 'Authenticator App'),
        ]
    )
    
    # Status
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=3)
    
    # Timing
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'otp_codes'
        indexes = [
            models.Index(fields=['user', 'code_type', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"OTP for {self.user.username} ({self.code_type})"
    
    @property
    def is_expired(self):
        """Check if OTP is expired"""
        return timezone.now() > self.expires_at
    
    @property
    def attempts_remaining(self):
        """Get remaining attempts"""
        return max(0, self.max_attempts - self.attempts)
    
    def increment_attempts(self):
        """Increment attempt counter"""
        self.attempts += 1
        self.save(update_fields=['attempts'])
        return self.attempts_remaining > 0


class SocialAuthProvider(models.Model):
    """
    Track social authentication providers linked to user accounts
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_providers')
    
    # Provider Information
    provider = models.CharField(
        max_length=20,
        choices=[
            ('google', 'Google'),
            ('apple', 'Apple'),
            ('facebook', 'Facebook'),
            ('github', 'GitHub'),
        ]
    )
    provider_id = models.CharField(max_length=255)
    provider_email = models.EmailField(null=True, blank=True)
    
    # Metadata from Provider
    provider_data = models.JSONField(default=dict, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'social_auth_providers'
        unique_together = [['provider', 'provider_id']]
        indexes = [
            models.Index(fields=['user', 'provider']),
            models.Index(fields=['provider', 'provider_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.provider.title()}"


class SecurityEvent(models.Model):
    """
    Log security-related events for auditing
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_events')
    
    # Event Information
    event_type = models.CharField(
        max_length=30,
        choices=[
            ('login_success', 'Successful Login'),
            ('login_failed', 'Failed Login'),
            ('password_changed', 'Password Changed'),
            ('email_changed', 'Email Changed'),
            ('phone_changed', 'Phone Changed'),
            ('2fa_enabled', '2FA Enabled'),
            ('2fa_disabled', '2FA Disabled'),
            ('account_locked', 'Account Locked'),
            ('account_unlocked', 'Account Unlocked'),
            ('suspicious_activity', 'Suspicious Activity'),
            ('data_export', 'Data Export Requested'),
            ('account_deletion', 'Account Deletion Requested'),
        ]
    )
    
    description = models.TextField(null=True, blank=True)
    
    # Context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    device_info = models.JSONField(default=dict, blank=True)
    
    # Risk Assessment
    risk_level = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        default='low'
    )
    
    # Actions Taken
    action_taken = models.TextField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'security_events'
        indexes = [
            models.Index(fields=['user', 'event_type']),
            models.Index(fields=['risk_level', 'resolved']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_event_type_display()}" 