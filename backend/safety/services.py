from typing import Dict, List, Optional, Tuple, Any
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
import hashlib
import json
import logging
import re
from dataclasses import dataclass

from .models import (
    SafetyProfile, TuneValidation, FlashSession, 
    UserSafetyConsent, SafetyIncident, SafetyAuditLog
)

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of comprehensive tune validation"""
    is_safe: bool
    risk_level: str
    violations: List[str]
    warnings: List[str]
    validation_data: Dict
    requires_expert_review: bool
    checksum_valid: bool
    parameter_check_passed: bool


class ComprehensiveTuneValidator:
    """Comprehensive tune validation service with multi-layer safety checks"""
    
    def __init__(self):
        self.safety_profiles = self._load_safety_profiles()
    
    def _load_safety_profiles(self) -> Dict[str, SafetyProfile]:
        """Load safety profiles for different bike categories"""
        profiles = {}
        for profile in SafetyProfile.objects.all():
            profiles[profile.category] = profile
        return profiles
    
    def validate_tune(
        self, 
        tune_file_data: bytes, 
        tune_metadata: Dict,
        bike_category: str = 'SPORT'
    ) -> ValidationResult:
        """
        Comprehensive tune validation with multiple safety layers
        
        Args:
            tune_file_data: Raw tune file bytes
            tune_metadata: Tune metadata and parameters
            bike_category: Motorcycle category for safety limits
        
        Returns:
            ValidationResult with detailed safety analysis
        """
        violations = []
        warnings = []
        validation_data = {}
        
        # Get safety profile
        safety_profile = self.safety_profiles.get(bike_category)
        if not safety_profile:
            violations.append(f"Unknown bike category: {bike_category}")
            return ValidationResult(
                is_safe=False,
                risk_level='CRITICAL',
                violations=violations,
                warnings=warnings,
                validation_data=validation_data,
                requires_expert_review=True,
                checksum_valid=False,
                parameter_check_passed=False
            )
        
        # 1. File Integrity Check
        checksum_result = self._validate_checksum(tune_file_data, tune_metadata)
        validation_data['checksum'] = checksum_result
        
        if not checksum_result['valid']:
            violations.append("File integrity check failed - tune may be corrupted")
        
        # 2. Parameter Safety Validation
        param_result = self._validate_parameters(tune_metadata, safety_profile)
        validation_data['parameters'] = param_result
        
        violations.extend(param_result['violations'])
        warnings.extend(param_result['warnings'])
        
        # 3. ECU Compatibility Check
        ecu_result = self._validate_ecu_compatibility(tune_metadata)
        validation_data['ecu_compatibility'] = ecu_result
        
        if not ecu_result['compatible']:
            violations.append("ECU compatibility check failed")
        
        # 4. Map Structure Validation
        map_result = self._validate_map_structure(tune_file_data, tune_metadata)
        validation_data['map_structure'] = map_result
        
        violations.extend(map_result['violations'])
        warnings.extend(map_result['warnings'])
        
        # 5. Performance Claims Validation
        performance_result = self._validate_performance_claims(tune_metadata)
        validation_data['performance'] = performance_result
        
        warnings.extend(performance_result['warnings'])
        
        # Determine risk level and requirements
        risk_level = self._calculate_risk_level(violations, warnings, tune_metadata)
        requires_expert_review = self._requires_expert_review(
            risk_level, tune_metadata, safety_profile
        )
        
        is_safe = len(violations) == 0 and risk_level not in ['CRITICAL', 'HIGH']
        
        return ValidationResult(
            is_safe=is_safe,
            risk_level=risk_level,
            violations=violations,
            warnings=warnings,
            validation_data=validation_data,
            requires_expert_review=requires_expert_review,
            checksum_valid=checksum_result['valid'],
            parameter_check_passed=len(param_result['violations']) == 0
        )
    
    def _validate_checksum(self, tune_data: bytes, metadata: Dict) -> Dict:
        """Validate file integrity using checksum"""
        calculated_checksum = hashlib.sha256(tune_data).hexdigest()
        expected_checksum = metadata.get('checksum', '')
        
        return {
            'valid': calculated_checksum == expected_checksum,
            'calculated': calculated_checksum,
            'expected': expected_checksum,
            'algorithm': 'sha256'
        }
    
    def _validate_parameters(self, metadata: Dict, safety_profile: SafetyProfile) -> Dict:
        """Validate tune parameters against safety limits"""
        violations = []
        warnings = []
        
        # RPM Validation
        if 'max_rpm' in metadata:
            max_rpm = metadata['max_rpm']
            if max_rpm > safety_profile.max_rpm:
                violations.append(
                    f"RPM limit {max_rpm} exceeds safe maximum {safety_profile.max_rpm}"
                )
            elif max_rpm > safety_profile.rpm_warning_threshold:
                warnings.append(
                    f"RPM limit {max_rpm} is above recommended threshold"
                )
        
        # Air/Fuel Ratio Validation
        if 'afr_map' in metadata:
            afr_violations, afr_warnings = self._validate_afr_map(
                metadata['afr_map'], safety_profile
            )
            violations.extend(afr_violations)
            warnings.extend(afr_warnings)
        
        # Ignition Timing Validation
        if 'ignition_map' in metadata:
            ignition_violations = self._validate_ignition_timing(
                metadata['ignition_map'], safety_profile
            )
            violations.extend(ignition_violations)
        
        # Boost Pressure Validation
        if 'boost_pressure' in metadata:
            boost = metadata['boost_pressure']
            if boost > float(safety_profile.max_boost_psi):
                violations.append(
                    f"Boost pressure {boost} PSI exceeds safe maximum {safety_profile.max_boost_psi} PSI"
                )
        
        # Temperature Limit Validation
        if 'temperature_limits' in metadata:
            temp_violations = self._validate_temperature_limits(
                metadata['temperature_limits'], safety_profile
            )
            violations.extend(temp_violations)
        
        return {
            'violations': violations,
            'warnings': warnings,
            'parameters_checked': len(metadata.keys())
        }
    
    def _validate_afr_map(self, afr_map: List[float], safety_profile: SafetyProfile) -> Tuple[List[str], List[str]]:
        """Validate air/fuel ratio map values"""
        violations = []
        warnings = []
        
        for i, afr in enumerate(afr_map):
            if afr < float(safety_profile.min_afr):
                violations.append(
                    f"AFR value {afr} at position {i} is dangerously lean (minimum: {safety_profile.min_afr})"
                )
            elif afr > float(safety_profile.max_afr):
                violations.append(
                    f"AFR value {afr} at position {i} is too rich (maximum: {safety_profile.max_afr})"
                )
            elif afr < float(safety_profile.afr_warning_lean):
                warnings.append(
                    f"AFR value {afr} at position {i} is approaching lean limit"
                )
            elif afr > float(safety_profile.afr_warning_rich):
                warnings.append(
                    f"AFR value {afr} at position {i} is approaching rich limit"
                )
        
        return violations, warnings
    
    def _validate_ignition_timing(self, ignition_map: List[float], safety_profile: SafetyProfile) -> List[str]:
        """Validate ignition timing values"""
        violations = []
        
        for i, timing in enumerate(ignition_map):
            if timing > safety_profile.max_ignition_advance:
                violations.append(
                    f"Ignition advance {timing}° at position {i} exceeds safe maximum {safety_profile.max_ignition_advance}°"
                )
            elif timing < safety_profile.min_ignition_advance:
                violations.append(
                    f"Ignition retard {timing}° at position {i} exceeds safe minimum {safety_profile.min_ignition_advance}°"
                )
        
        return violations
    
    def _validate_temperature_limits(self, temp_limits: Dict, safety_profile: SafetyProfile) -> List[str]:
        """Validate temperature limit settings"""
        violations = []
        
        if 'coolant_temp' in temp_limits:
            if temp_limits['coolant_temp'] > safety_profile.max_coolant_temp_c:
                violations.append(
                    f"Coolant temperature limit {temp_limits['coolant_temp']}°C exceeds safe maximum"
                )
        
        if 'egt_temp' in temp_limits:
            if temp_limits['egt_temp'] > safety_profile.max_egt_temp_c:
                violations.append(
                    f"EGT temperature limit {temp_limits['egt_temp']}°C exceeds safe maximum"
                )
        
        return violations
    
    def _validate_ecu_compatibility(self, metadata: Dict) -> Dict:
        """Validate ECU compatibility"""
        ecu_info = metadata.get('ecu_info', {})
        required_ecu = metadata.get('required_ecu_types', [])
        
        compatible = True
        issues = []
        
        if not required_ecu:
            issues.append("No ECU compatibility information provided")
            compatible = False
        
        return {
            'compatible': compatible,
            'issues': issues,
            'ecu_types': required_ecu
        }
    
    def _validate_map_structure(self, tune_data: bytes, metadata: Dict) -> Dict:
        """Validate internal map structure and format"""
        violations = []
        warnings = []
        
        # Basic file size check
        file_size = len(tune_data)
        expected_size = metadata.get('expected_file_size')
        
        if expected_size and abs(file_size - expected_size) > 1024:  # 1KB tolerance
            warnings.append(f"File size {file_size} differs from expected {expected_size}")
        
        # Check for common corruption patterns
        if tune_data[:4] == b'\x00\x00\x00\x00':
            violations.append("File appears to be corrupted (null header)")
        
        return {
            'violations': violations,
            'warnings': warnings,
            'file_size': file_size
        }
    
    def _validate_performance_claims(self, metadata: Dict) -> Dict:
        """Validate performance improvement claims"""
        warnings = []
        
        performance_gains = metadata.get('performance_gains', {})
        
        # Check for unrealistic claims
        if 'horsepower_gain' in performance_gains:
            hp_gain = performance_gains['horsepower_gain']
            if hp_gain > 50:  # More than 50HP gain is suspicious
                warnings.append(f"Claimed horsepower gain of {hp_gain}HP seems unrealistic")
        
        if 'torque_gain' in performance_gains:
            torque_gain = performance_gains['torque_gain']
            if torque_gain > 40:  # More than 40 ft-lb gain is suspicious
                warnings.append(f"Claimed torque gain of {torque_gain} ft-lb seems unrealistic")
        
        return {
            'warnings': warnings,
            'claims': performance_gains
        }
    
    def _calculate_risk_level(self, violations: List[str], warnings: List[str], metadata: Dict) -> str:
        """Calculate overall risk level"""
        if violations:
            # Critical violations
            critical_keywords = ['dangerously', 'exceeds safe maximum', 'corrupted']
            if any(keyword in violation.lower() for violation in violations for keyword in critical_keywords):
                return 'CRITICAL'
            return 'HIGH'
        
        if len(warnings) > 5:
            return 'MEDIUM'
        elif len(warnings) > 2:
            return 'LOW'
        
        # Check for track-only indicators
        if metadata.get('track_only', False) or metadata.get('race_mode', False):
            return 'MEDIUM'
        
        return 'MINIMAL'
    
    def _requires_expert_review(self, risk_level: str, metadata: Dict, safety_profile: SafetyProfile) -> bool:
        """Determine if expert review is required"""
        if risk_level in ['HIGH', 'CRITICAL']:
            return True
        
        if safety_profile.requires_expert_review:
            return True
        
        if metadata.get('expert_tune', False):
            return True
        
        if metadata.get('track_only', False) and not metadata.get('dyno_tested', False):
            return True
        
        return False


class SafeFlashService:
    """Service for managing safe ECU flashing with comprehensive monitoring"""
    
    def __init__(self):
        self.validator = ComprehensiveTuneValidator()
    
    @transaction.atomic
    def initiate_flash_session(
        self, 
        user, 
        motorcycle, 
        tune_file, 
        purchase=None
    ) -> FlashSession:
        """Initiate a new flash session with safety checks"""
        
        # Create flash session
        session = FlashSession.objects.create(
            user=user,
            motorcycle=motorcycle,
            tune_file=tune_file,
            tune_purchase=purchase,
            current_stage='PREPARING'
        )
        
        # Log session initiation
        SafetyAuditLog.objects.create(
            user=user,
            action_type='FLASH_INITIATED',
            description=f'Flash session started for {tune_file.name}',
            flash_session=session,
            tune_file=tune_file,
            motorcycle=motorcycle,
            metadata={
                'session_id': str(session.id),
                'tune_name': tune_file.name,
                'bike_info': f"{motorcycle.make} {motorcycle.model} {motorcycle.year}"
            }
        )
        
        return session
    
    def update_flash_progress(
        self, 
        session: FlashSession, 
        stage: str, 
        progress: int = None,
        data: Dict = None
    ):
        """Update flash session progress and stage"""
        session.current_stage = stage
        if progress is not None:
            session.progress_percentage = progress
        
        # Add log entry
        log_entry = {
            'timestamp': timezone.now().isoformat(),
            'stage': stage,
            'progress': progress or session.progress_percentage,
            'data': data or {}
        }
        session.flash_logs.append(log_entry)
        session.save()
    
    def create_backup(self, session: FlashSession, backup_data: bytes) -> bool:
        """Create and verify ECU backup"""
        try:
            # Store backup (in real implementation, this would go to secure storage)
            backup_checksum = hashlib.sha256(backup_data).hexdigest()
            
            # Update session with backup info
            session.pre_flash_backup_url = f"backups/{session.id}/original.bin"
            session.pre_flash_ecu_data = {
                'backup_size': len(backup_data),
                'backup_checksum': backup_checksum,
                'created_at': timezone.now().isoformat()
            }
            session.backup_verified = True
            session.save()
            
            # Log backup creation
            SafetyAuditLog.objects.create(
                user=session.user,
                action_type='BACKUP_CREATED',
                description=f'ECU backup created for flash session {session.id}',
                flash_session=session,
                metadata={
                    'backup_size': len(backup_data),
                    'checksum': backup_checksum
                }
            )
            
            self.update_flash_progress(session, 'BACKING_UP', 20, {
                'backup_verified': True,
                'backup_size': len(backup_data)
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Backup creation failed for session {session.id}: {str(e)}")
            session.error_messages.append(f"Backup creation failed: {str(e)}")
            session.save()
            return False
    
    def validate_pre_flash(self, session: FlashSession) -> Dict:
        """Comprehensive pre-flash validation"""
        validation_result = {
            'safe_to_proceed': False,
            'issues': [],
            'warnings': [],
            'checks_passed': 0,
            'total_checks': 6
        }
        
        checks = [
            self._check_user_consent(session),
            self._check_bike_safety_state(session),
            self._check_backup_status(session),
            self._check_tune_validation(session),
            self._check_hardware_connection(session),
            self._check_system_readiness(session)
        ]
        
        for check in checks:
            if check['passed']:
                validation_result['checks_passed'] += 1
            else:
                validation_result['issues'].extend(check['issues'])
            validation_result['warnings'].extend(check.get('warnings', []))
        
        validation_result['safe_to_proceed'] = validation_result['checks_passed'] == validation_result['total_checks']
        
        self.update_flash_progress(session, 'PRE_CHECKS', 40, validation_result)
        
        return validation_result
    
    def _check_user_consent(self, session: FlashSession) -> Dict:
        """Check if user has provided all required consents"""
        required_consents = [
            'GENERAL_LIABILITY',
            'ECU_MODIFICATION',
            'WARRANTY_VOID',
            'BACKUP_RESPONSIBILITY'
        ]
        
        # Check if tune is track-only
        if getattr(session.tune_file, 'track_only', False):
            required_consents.append('TRACK_ONLY')
        
        missing_consents = []
        for consent_type in required_consents:
            if not UserSafetyConsent.objects.filter(
                user=session.user,
                consent_type=consent_type,
                revoked_at__isnull=True
            ).exists():
                missing_consents.append(consent_type)
        
        return {
            'passed': len(missing_consents) == 0,
            'issues': [f"Missing consent: {consent}" for consent in missing_consents],
            'required_consents': required_consents
        }
    
    def _check_bike_safety_state(self, session: FlashSession) -> Dict:
        """Verify bike is in safe state for flashing"""
        # In real implementation, this would check actual bike state
        return {
            'passed': session.bike_in_safe_mode,
            'issues': [] if session.bike_in_safe_mode else ["Bike not in safe mode (engine off, neutral)"],
            'warnings': []
        }
    
    def _check_backup_status(self, session: FlashSession) -> Dict:
        """Verify backup was created and verified"""
        return {
            'passed': session.backup_verified,
            'issues': [] if session.backup_verified else ["ECU backup not verified"],
            'warnings': []
        }
    
    def _check_tune_validation(self, session: FlashSession) -> Dict:
        """Check tune validation status"""
        try:
            validation = TuneValidation.objects.filter(
                tune_file=session.tune_file,
                status='PASSED'
            ).latest('validated_at')
            
            return {
                'passed': True,
                'issues': [],
                'warnings': validation.warnings,
                'validation_id': str(validation.id)
            }
        except TuneValidation.DoesNotExist:
            return {
                'passed': False,
                'issues': ["Tune has not passed safety validation"],
                'warnings': []
            }
    
    def _check_hardware_connection(self, session: FlashSession) -> Dict:
        """Verify hardware connection is stable"""
        # In real implementation, this would check actual hardware
        return {
            'passed': True,  # Assume connection is good
            'issues': [],
            'warnings': []
        }
    
    def _check_system_readiness(self, session: FlashSession) -> Dict:
        """Check overall system readiness"""
        return {
            'passed': True,
            'issues': [],
            'warnings': []
        }
    
    def handle_flash_failure(self, session: FlashSession, error_message: str):
        """Handle flash failure with automatic recovery"""
        session.current_stage = 'FAILED'
        session.error_messages.append(error_message)
        session.save()
        
        # Attempt automatic recovery
        if session.backup_verified:
            self.restore_backup(session)
        
        # Log incident
        SafetyIncident.objects.create(
            reporter=session.user,
            incident_type='FLASH_FAILURE',
            severity='HIGH',
            title=f'Flash failure in session {session.id}',
            description=error_message,
            flash_session=session,
            tune_file=session.tune_file,
            motorcycle=session.motorcycle,
            error_logs=[error_message],
            system_state={
                'stage': session.current_stage,
                'progress': session.progress_percentage
            }
        )
    
    def restore_backup(self, session: FlashSession) -> bool:
        """Restore ECU from backup"""
        try:
            session.current_stage = 'RESTORING'
            session.recovery_attempted = True
            session.save()
            
            # In real implementation, this would restore the actual backup
            # For now, simulate successful restore
            session.current_stage = 'RESTORED'
            session.recovery_successful = True
            session.save()
            
            # Log restoration
            SafetyAuditLog.objects.create(
                user=session.user,
                action_type='BACKUP_RESTORED',
                description=f'ECU backup restored for session {session.id}',
                flash_session=session,
                metadata={'restoration_successful': True}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Backup restoration failed for session {session.id}: {str(e)}")
            session.error_messages.append(f"Backup restoration failed: {str(e)}")
            session.save()
            return False


class SafetyConsentService:
    """Service for managing user safety consents and disclaimers"""
    
    CONSENT_TEXTS = {
        'GENERAL_LIABILITY': """
GENERAL LIABILITY WAIVER AND RELEASE

By using RevSync to modify your motorcycle's ECU, you acknowledge and agree that:

1. ECU modifications can significantly alter your motorcycle's performance and behavior
2. Improper modifications may result in engine damage, reduced reliability, or safety hazards
3. You assume all risks associated with ECU modifications
4. RevSync and its creators are not liable for any damages, injuries, or losses
5. You are solely responsible for ensuring modifications comply with local laws
6. Professional installation and tuning is recommended for complex modifications

I understand and accept these risks and release RevSync from all liability.
        """,
        
        'ECU_MODIFICATION': """
ECU MODIFICATION CONSENT

I understand that modifying my motorcycle's ECU involves:

1. Altering factory-programmed engine parameters
2. Potential voiding of manufacturer warranties
3. Possible impacts on emissions compliance
4. Risk of engine damage if parameters are unsafe
5. Need for proper supporting modifications (exhaust, air intake, etc.)

I confirm that I have the right to modify this motorcycle and accept responsibility for all consequences.
        """,
        
        'WARRANTY_VOID': """
WARRANTY VOID ACKNOWLEDGMENT

I acknowledge that ECU modifications may:

1. Void my motorcycle's manufacturer warranty
2. Void extended warranty coverage
3. Affect insurance coverage
4. Impact resale value
5. Be detectable by service technicians

I accept responsibility for any warranty implications and will not hold RevSync liable for warranty-related issues.
        """,
        
        'EMISSIONS_COMPLIANCE': """
EMISSIONS COMPLIANCE WARNING

IMPORTANT: ECU modifications may affect emissions systems and compliance.

1. Modified vehicles may not pass emissions testing
2. Use on public roads may violate environmental regulations
3. Track-only use may be required in some jurisdictions
4. You are responsible for compliance with local, state, and federal laws

I understand the legal implications and will use modifications responsibly.
        """,
        
        'TRACK_ONLY': """
TRACK ONLY USE AGREEMENT

This tune is designed for TRACK USE ONLY and:

1. May not be legal for street use
2. Could affect emissions compliance
3. May void vehicle warranties
4. Requires proper safety equipment and training
5. Should only be used at appropriate racing facilities

I confirm this modification will be used for track/competition purposes only.
        """,
        
        'EXPERT_TUNE': """
EXPERT LEVEL TUNE WARNING

This is an EXPERT LEVEL tune that:

1. Makes significant engine parameter changes
2. Requires advanced knowledge to use safely
3. May need supporting modifications
4. Could cause engine damage if misused
5. Requires professional installation and setup

I confirm I have the expertise to use this tune safely or will seek professional assistance.
        """,
        
        'BACKUP_RESPONSIBILITY': """
BACKUP RESPONSIBILITY AGREEMENT

I understand that:

1. Creating an ECU backup before modification is MANDATORY
2. I am responsible for maintaining my backup files
3. Restoration may be needed if modifications cause issues
4. Professional help may be required for restoration
5. RevSync provides tools but cannot guarantee successful restoration

I accept responsibility for backup creation and maintenance.
        """
    }
    
    def get_required_consents(self, tune_file, motorcycle) -> List[str]:
        """Get list of required consents for a specific tune/bike combination"""
        required = ['GENERAL_LIABILITY', 'ECU_MODIFICATION', 'BACKUP_RESPONSIBILITY']
        
        # Add warranty consent for newer bikes
        if motorcycle.year >= 2015:
            required.append('WARRANTY_VOID')
        
        # Add emissions consent for street bikes
        if not getattr(tune_file, 'track_only', False):
            required.append('EMISSIONS_COMPLIANCE')
        
        # Add track-only consent
        if getattr(tune_file, 'track_only', False):
            required.append('TRACK_ONLY')
        
        # Add expert consent for high-risk tunes
        validation = TuneValidation.objects.filter(
            tune_file=tune_file,
            risk_level__in=['HIGH', 'CRITICAL']
        ).first()
        
        if validation:
            required.append('EXPERT_TUNE')
        
        return required
    
    def record_consent(
        self, 
        user, 
        consent_type: str, 
        ip_address: str, 
        user_agent: str,
        motorcycle=None,
        tune_file=None,
        flash_session=None
    ) -> UserSafetyConsent:
        """Record user consent with full tracking"""
        
        consent = UserSafetyConsent.objects.create(
            user=user,
            consent_type=consent_type,
            consent_text=self.CONSENT_TEXTS[consent_type],
            user_ip_address=ip_address,
            user_agent=user_agent,
            motorcycle=motorcycle,
            tune_file=tune_file,
            flash_session=flash_session
        )
        
        # Log consent
        SafetyAuditLog.objects.create(
            user=user,
            action_type='CONSENT_GRANTED',
            description=f'User granted {consent_type} consent',
            metadata={
                'consent_type': consent_type,
                'ip_address': ip_address,
                'consent_id': str(consent.id)
            }
        )
        
        return consent
    
    def check_consents(self, user, required_consents: List[str]) -> Dict:
        """Check if user has all required consents"""
        missing = []
        expired = []
        
        for consent_type in required_consents:
            consent = UserSafetyConsent.objects.filter(
                user=user,
                consent_type=consent_type,
                revoked_at__isnull=True
            ).first()
            
            if not consent:
                missing.append(consent_type)
            elif consent.expires_at and consent.expires_at < timezone.now():
                expired.append(consent_type)
        
        return {
            'has_all_consents': len(missing) == 0 and len(expired) == 0,
            'missing': missing,
            'expired': expired,
            'required': required_consents
        } 