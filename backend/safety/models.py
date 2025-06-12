from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import json

class SafetyProfile(models.Model):
    """Safety profile for different motorcycle categories"""
    
    BIKE_CATEGORIES = [
        ('SPORT', 'Sport'),
        ('CRUISER', 'Cruiser'), 
        ('TOURING', 'Touring'),
        ('ADVENTURE', 'Adventure'),
        ('NAKED', 'Naked/Standard'),
        ('SUPERMOTO', 'Supermoto'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=BIKE_CATEGORIES)
    
    # RPM Safety Limits
    max_rpm = models.IntegerField(default=15000)
    rpm_warning_threshold = models.IntegerField(default=13000)
    
    # Air/Fuel Ratio Limits
    min_afr = models.DecimalField(max_digits=4, decimal_places=2, default=11.5)
    max_afr = models.DecimalField(max_digits=4, decimal_places=2, default=16.0)
    afr_warning_lean = models.DecimalField(max_digits=4, decimal_places=2, default=12.0)
    afr_warning_rich = models.DecimalField(max_digits=4, decimal_places=2, default=15.0)
    
    # Ignition Timing Limits
    max_ignition_advance = models.IntegerField(default=45)  # degrees
    min_ignition_advance = models.IntegerField(default=-10)  # degrees
    
    # Boost/Pressure Limits
    max_boost_psi = models.DecimalField(max_digits=4, decimal_places=1, default=15.0)
    max_fuel_pressure_psi = models.DecimalField(max_digits=4, decimal_places=1, default=60.0)
    
    # Temperature Limits
    max_coolant_temp_c = models.IntegerField(default=110)
    max_egt_temp_c = models.IntegerField(default=900)  # Exhaust Gas Temperature
    max_intake_temp_c = models.IntegerField(default=60)
    
    # Load/Throttle Limits
    max_engine_load_percent = models.IntegerField(default=100)
    
    # Safety flags
    requires_expert_review = models.BooleanField(default=False)
    track_only_category = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class TuneValidation(models.Model):
    """Comprehensive validation record for each tune"""
    
    VALIDATION_LEVELS = [
        ('BASIC', 'Basic Automated Check'),
        ('STANDARD', 'Standard Safety Validation'),
        ('EXPERT', 'Expert Manual Review'),
        ('DYNO', 'Dyno Validated'),
        ('TRACK', 'Track Tested'),
    ]
    
    RISK_LEVELS = [
        ('MINIMAL', 'Minimal Risk'),
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Risk - Unsafe'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Validation'),
        ('PASSED', 'Validation Passed'),
        ('FAILED', 'Validation Failed'),
        ('CONDITIONAL', 'Conditional Pass'),
        ('REQUIRES_REVIEW', 'Requires Manual Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tune_file = models.ForeignKey('tunes.TuneFile', on_delete=models.CASCADE)
    safety_profile = models.ForeignKey(SafetyProfile, on_delete=models.CASCADE)
    validator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Validation details
    validation_level = models.CharField(max_length=20, choices=VALIDATION_LEVELS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS, default='LOW')
    
    # Validation results
    checksum_valid = models.BooleanField(default=False)
    parameter_check_passed = models.BooleanField(default=False)
    compatibility_verified = models.BooleanField(default=False)
    dyno_tested = models.BooleanField(default=False)
    track_tested = models.BooleanField(default=False)
    
    # Validation data
    validation_data = models.JSONField(default=dict)  # Detailed validation results
    safety_violations = models.JSONField(default=list)  # List of safety issues
    warnings = models.JSONField(default=list)  # Non-critical warnings
    performance_metrics = models.JSONField(default=dict)  # Dyno results, etc.
    
    # Test data
    dyno_chart_url = models.URLField(blank=True)
    test_logs_url = models.URLField(blank=True)
    validator_notes = models.TextField(blank=True)
    
    # Timestamps
    validated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # Validation expiry
    
    class Meta:
        ordering = ['-validated_at']
    
    def __str__(self):
        return f"Validation for {self.tune_file.name} - {self.status}"


class FlashSession(models.Model):
    """Comprehensive flash session tracking with safety monitoring"""
    
    FLASH_STAGES = [
        ('PREPARING', 'Preparing Flash'),
        ('BACKING_UP', 'Creating Backup'),
        ('VALIDATING', 'Validating Tune'),
        ('PRE_CHECKS', 'Pre-Flash Safety Checks'),
        ('FLASHING', 'Flashing ECU'),
        ('VERIFYING', 'Verifying Flash'),
        ('POST_CHECKS', 'Post-Flash Verification'),
        ('COMPLETED', 'Flash Completed'),
        ('FAILED', 'Flash Failed'),
        ('RESTORING', 'Restoring Backup'),
        ('RESTORED', 'Backup Restored'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    motorcycle = models.ForeignKey('motorcycles.Motorcycle', on_delete=models.CASCADE)
    tune_purchase = models.ForeignKey('marketplace.TunePurchase', on_delete=models.CASCADE, null=True)
    tune_file = models.ForeignKey('tunes.TuneFile', on_delete=models.CASCADE)
    
    # Flash process tracking
    current_stage = models.CharField(max_length=20, choices=FLASH_STAGES, default='PREPARING')
    progress_percentage = models.IntegerField(default=0)
    
    # Safety data
    pre_flash_backup_url = models.URLField(blank=True)
    pre_flash_ecu_data = models.JSONField(default=dict)
    post_flash_ecu_data = models.JSONField(default=dict)
    
    # Process details
    flash_logs = models.JSONField(default=list)
    error_messages = models.JSONField(default=list)
    warnings = models.JSONField(default=list)
    
    # Safety checks
    user_confirmed_safety = models.BooleanField(default=False)
    bike_in_safe_mode = models.BooleanField(default=False)  # Engine off, neutral
    backup_verified = models.BooleanField(default=False)
    post_flash_verified = models.BooleanField(default=False)
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    
    # Recovery
    recovery_attempted = models.BooleanField(default=False)
    recovery_successful = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Flash Session {self.id} - {self.current_stage}"


class UserSafetyConsent(models.Model):
    """Track user consent for safety disclaimers and liability"""
    
    CONSENT_TYPES = [
        ('GENERAL_LIABILITY', 'General Liability Waiver'),
        ('ECU_MODIFICATION', 'ECU Modification Consent'),
        ('WARRANTY_VOID', 'Warranty Void Acknowledgment'),
        ('EMISSIONS_COMPLIANCE', 'Emissions Compliance Warning'),
        ('TRACK_ONLY', 'Track Only Use Agreement'),
        ('EXPERT_TUNE', 'Expert Level Tune Warning'),
        ('BACKUP_RESPONSIBILITY', 'Backup Responsibility Agreement'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    consent_type = models.CharField(max_length=30, choices=CONSENT_TYPES)
    
    # Consent details
    consent_text = models.TextField()  # Full disclaimer text shown to user
    user_ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    # Legal tracking
    consent_version = models.CharField(max_length=10, default='1.0')
    consented_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    
    # Associated data
    motorcycle = models.ForeignKey('motorcycles.Motorcycle', on_delete=models.CASCADE, null=True)
    tune_file = models.ForeignKey('tunes.TuneFile', on_delete=models.CASCADE, null=True)
    flash_session = models.ForeignKey(FlashSession, on_delete=models.CASCADE, null=True)
    
    class Meta:
        unique_together = ['user', 'consent_type', 'consent_version']
        ordering = ['-consented_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.consent_type}"


class SafetyIncident(models.Model):
    """Track safety incidents and issues for continuous improvement"""
    
    INCIDENT_TYPES = [
        ('FLASH_FAILURE', 'Flash Process Failure'),
        ('PARAMETER_VIOLATION', 'Safety Parameter Violation'),
        ('ECU_DAMAGE', 'ECU Damage Reported'),
        ('ENGINE_DAMAGE', 'Engine Damage Reported'),
        ('USER_ERROR', 'User Error'),
        ('TUNE_DEFECT', 'Tune File Defect'),
        ('HARDWARE_ISSUE', 'Hardware Communication Issue'),
        ('SOFTWARE_BUG', 'Software Bug'),
    ]
    
    SEVERITY_LEVELS = [
        ('LOW', 'Low - Minor Issue'),
        ('MEDIUM', 'Medium - Moderate Impact'),
        ('HIGH', 'High - Significant Issue'),
        ('CRITICAL', 'Critical - Safety Risk'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(User, on_delete=models.CASCADE)
    incident_type = models.CharField(max_length=30, choices=INCIDENT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    
    # Incident details
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Associated data
    flash_session = models.ForeignKey(FlashSession, on_delete=models.CASCADE, null=True)
    tune_file = models.ForeignKey('tunes.TuneFile', on_delete=models.CASCADE, null=True)
    motorcycle = models.ForeignKey('motorcycles.Motorcycle', on_delete=models.CASCADE, null=True)
    
    # Technical data
    error_logs = models.JSONField(default=list)
    system_state = models.JSONField(default=dict)
    user_actions = models.JSONField(default=list)
    
    # Resolution
    investigated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, 
        related_name='investigated_incidents'
    )
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Prevention
    preventive_measures = models.TextField(blank=True)
    tune_flagged = models.BooleanField(default=False)
    tune_suspended = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.incident_type} - {self.severity} - {self.title}"


class SafetyAuditLog(models.Model):
    """Comprehensive audit log for all safety-related actions"""
    
    ACTION_TYPES = [
        ('TUNE_VALIDATION', 'Tune Validation'),
        ('FLASH_INITIATED', 'Flash Process Started'),
        ('FLASH_COMPLETED', 'Flash Process Completed'),
        ('BACKUP_CREATED', 'Backup Created'),
        ('BACKUP_RESTORED', 'Backup Restored'),
        ('CONSENT_GRANTED', 'User Consent Granted'),
        ('INCIDENT_REPORTED', 'Safety Incident Reported'),
        ('TUNE_SUSPENDED', 'Tune Suspended'),
        ('PARAMETER_VIOLATION', 'Safety Parameter Violation'),
        ('EXPERT_REVIEW', 'Expert Review Conducted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    
    # Action details
    description = models.TextField()
    metadata = models.JSONField(default=dict)
    
    # Associated objects
    tune_file = models.ForeignKey('tunes.TuneFile', on_delete=models.CASCADE, null=True)
    motorcycle = models.ForeignKey('motorcycles.Motorcycle', on_delete=models.CASCADE, null=True)
    flash_session = models.ForeignKey(FlashSession, on_delete=models.CASCADE, null=True)
    
    # System info
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action_type', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.action_type} - {self.timestamp}" 