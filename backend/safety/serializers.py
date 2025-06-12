from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    SafetyProfile, TuneValidation, FlashSession, 
    UserSafetyConsent, SafetyIncident, SafetyAuditLog
)
from .services import ValidationResult


class SafetyProfileSerializer(serializers.ModelSerializer):
    """Serializer for safety profiles"""
    
    class Meta:
        model = SafetyProfile
        fields = [
            'id', 'name', 'category', 'max_rpm', 'rpm_warning_threshold',
            'min_afr', 'max_afr', 'afr_warning_lean', 'afr_warning_rich',
            'max_ignition_advance', 'min_ignition_advance',
            'max_boost_psi', 'max_fuel_pressure_psi',
            'max_coolant_temp_c', 'max_egt_temp_c', 'max_intake_temp_c',
            'max_engine_load_percent', 'requires_expert_review', 
            'track_only_category', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TuneValidationSerializer(serializers.ModelSerializer):
    """Serializer for tune validations"""
    
    validator_username = serializers.CharField(source='validator.username', read_only=True)
    safety_profile_name = serializers.CharField(source='safety_profile.name', read_only=True)
    tune_file_name = serializers.CharField(source='tune_file.name', read_only=True)
    
    class Meta:
        model = TuneValidation
        fields = [
            'id', 'tune_file', 'tune_file_name', 'safety_profile', 
            'safety_profile_name', 'validator', 'validator_username',
            'validation_level', 'status', 'risk_level',
            'checksum_valid', 'parameter_check_passed', 
            'compatibility_verified', 'dyno_tested', 'track_tested',
            'validation_data', 'safety_violations', 'warnings',
            'performance_metrics', 'dyno_chart_url', 'test_logs_url',
            'validator_notes', 'validated_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'validator', 'validated_at', 'tune_file_name',
            'validator_username', 'safety_profile_name'
        ]


class FlashSessionSerializer(serializers.ModelSerializer):
    """Serializer for flash sessions"""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    motorcycle_info = serializers.SerializerMethodField()
    tune_file_info = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashSession
        fields = [
            'id', 'user', 'user_username', 'motorcycle', 'motorcycle_info',
            'tune_purchase', 'tune_file', 'tune_file_info',
            'current_stage', 'progress_percentage',
            'pre_flash_backup_url', 'pre_flash_ecu_data', 'post_flash_ecu_data',
            'flash_logs', 'error_messages', 'warnings',
            'user_confirmed_safety', 'bike_in_safe_mode', 
            'backup_verified', 'post_flash_verified',
            'started_at', 'completed_at', 'duration_seconds', 'duration_minutes',
            'recovery_attempted', 'recovery_successful'
        ]
        read_only_fields = [
            'id', 'user', 'user_username', 'motorcycle_info', 'tune_file_info',
            'duration_minutes', 'started_at'
        ]
    
    def get_motorcycle_info(self, obj):
        """Get motorcycle information"""
        return {
            'make': obj.motorcycle.make,
            'model': obj.motorcycle.model,
            'year': obj.motorcycle.year,
            'display_name': f"{obj.motorcycle.make} {obj.motorcycle.model} {obj.motorcycle.year}"
        }
    
    def get_tune_file_info(self, obj):
        """Get tune file information"""
        return {
            'name': obj.tune_file.name,
            'version': getattr(obj.tune_file, 'version', '1.0'),
            'file_size': getattr(obj.tune_file, 'file_size', 0),
        }
    
    def get_duration_minutes(self, obj):
        """Get session duration in minutes"""
        if obj.duration_seconds:
            return round(obj.duration_seconds / 60, 1)
        return None


class SafetyConsentSerializer(serializers.ModelSerializer):
    """Serializer for safety consents"""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    consent_type_display = serializers.CharField(source='get_consent_type_display', read_only=True)
    
    class Meta:
        model = UserSafetyConsent
        fields = [
            'id', 'user', 'user_username', 'consent_type', 'consent_type_display',
            'consent_text', 'user_ip_address', 'user_agent',
            'consent_version', 'consented_at', 'expires_at', 'revoked_at',
            'motorcycle', 'tune_file', 'flash_session'
        ]
        read_only_fields = [
            'id', 'user', 'user_username', 'consent_type_display',
            'consented_at', 'user_ip_address', 'user_agent'
        ]


class SafetyIncidentSerializer(serializers.ModelSerializer):
    """Serializer for safety incidents"""
    
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    investigator_username = serializers.CharField(source='investigated_by.username', read_only=True)
    incident_type_display = serializers.CharField(source='get_incident_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = SafetyIncident
        fields = [
            'id', 'reporter', 'reporter_username', 'incident_type', 
            'incident_type_display', 'severity', 'severity_display',
            'title', 'description', 'flash_session', 'tune_file', 'motorcycle',
            'error_logs', 'system_state', 'user_actions',
            'investigated_by', 'investigator_username', 'resolution_notes',
            'resolved_at', 'preventive_measures', 'tune_flagged', 'tune_suspended',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'reporter', 'reporter_username', 'incident_type_display',
            'severity_display', 'investigated_by', 'investigator_username',
            'created_at', 'updated_at'
        ]


class SafetyAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for safety audit logs"""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = SafetyAuditLog
        fields = [
            'id', 'user', 'user_username', 'action_type', 'action_type_display',
            'description', 'metadata', 'tune_file', 'motorcycle', 'flash_session',
            'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'user_username', 'action_type_display', 'timestamp']


class ValidationResultSerializer(serializers.Serializer):
    """Serializer for validation results"""
    
    is_safe = serializers.BooleanField()
    risk_level = serializers.CharField()
    violations = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    validation_data = serializers.DictField()
    requires_expert_review = serializers.BooleanField()
    checksum_valid = serializers.BooleanField()
    parameter_check_passed = serializers.BooleanField()


class FlashPreValidationSerializer(serializers.Serializer):
    """Serializer for pre-flash validation results"""
    
    safe_to_proceed = serializers.BooleanField()
    issues = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    checks_passed = serializers.IntegerField()
    total_checks = serializers.IntegerField()


class ConsentStatusSerializer(serializers.Serializer):
    """Serializer for consent status"""
    
    has_all_consents = serializers.BooleanField()
    missing = serializers.ListField(child=serializers.CharField())
    expired = serializers.ListField(child=serializers.CharField())
    required = serializers.ListField(child=serializers.CharField())


class SafetyDashboardMetricsSerializer(serializers.Serializer):
    """Serializer for safety dashboard metrics"""
    
    flash_sessions = serializers.DictField()
    validations = serializers.DictField()
    incidents = serializers.DictField()


class CriticalEventSerializer(serializers.Serializer):
    """Serializer for critical safety events"""
    
    type = serializers.CharField()
    title = serializers.CharField()
    severity = serializers.CharField()
    timestamp = serializers.DateTimeField()
    id = serializers.CharField()


class SafetyDashboardSerializer(serializers.Serializer):
    """Serializer for complete safety dashboard"""
    
    metrics = SafetyDashboardMetricsSerializer()
    incident_types = serializers.ListField(child=serializers.DictField())
    critical_events = CriticalEventSerializer(many=True)
    generated_at = serializers.DateTimeField()


class TuneCompatibilityCheckSerializer(serializers.Serializer):
    """Serializer for tune compatibility check requests"""
    
    tune_id = serializers.UUIDField()
    motorcycle_id = serializers.UUIDField()
    force_recheck = serializers.BooleanField(default=False)


class TuneCompatibilityResultSerializer(serializers.Serializer):
    """Serializer for tune compatibility results"""
    
    compatible = serializers.BooleanField()
    confidence_score = serializers.FloatField()
    compatibility_issues = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    required_hardware = serializers.ListField(child=serializers.CharField())
    ecu_compatibility = serializers.DictField()
    safety_notes = serializers.ListField(child=serializers.CharField())


class EmergencyStopSerializer(serializers.Serializer):
    """Serializer for emergency stop requests"""
    
    error_message = serializers.CharField(required=False)
    user_initiated = serializers.BooleanField(default=True)
    force_stop = serializers.BooleanField(default=False)


class BackupCreationSerializer(serializers.Serializer):
    """Serializer for backup creation requests"""
    
    backup_data = serializers.CharField()  # Base64 encoded backup data
    verify_backup = serializers.BooleanField(default=True)
    backup_metadata = serializers.DictField(required=False)


class FlashProgressUpdateSerializer(serializers.Serializer):
    """Serializer for flash progress updates"""
    
    stage = serializers.ChoiceField(choices=[
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
    ])
    progress = serializers.IntegerField(min_value=0, max_value=100, required=False)
    data = serializers.DictField(required=False)


class IncidentInvestigationSerializer(serializers.Serializer):
    """Serializer for incident investigation updates"""
    
    resolution_notes = serializers.CharField()
    preventive_measures = serializers.CharField(required=False)
    tune_action = serializers.ChoiceField(
        choices=[('flag', 'Flag Tune'), ('suspend', 'Suspend Tune')],
        required=False
    )
    additional_data = serializers.DictField(required=False) 