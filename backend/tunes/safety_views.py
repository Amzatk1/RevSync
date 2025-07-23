"""
RevSync T-CLOCS Tune Safety Validation System
Comprehensive 8-layer safety validation inspired by T-CLOCS motorcycle safety methodology

Layer 1: Pre-Submission Validation (Creator Side)
Layer 2: Automated Safety Scoring & Analysis  
Layer 3: Real-World Validation
Layer 4: Human Review & Approval
Layer 5: In-App User Presentation
Layer 6: Pre-Flash Safeguards
Layer 7: Post-Installation Monitoring
Layer 8: Ongoing Quality Assurance
"""

from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Avg, Count, F
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
import logging
import json

from .models import Tune, TuneSubmission, UserFeedback, SafetyAudit
from .serializers import TuneSerializer
from ..ai.tune_review_service import TuneReviewService
from ..users.models import CreatorProfile

User = get_user_model()
logger = logging.getLogger(__name__)


class TuneSubmissionCreateView(APIView):
    """Layer 1 & 2: Pre-Submission Validation + AI Safety Analysis"""
    
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Submit tune for comprehensive T-CLOCS safety validation"""
        
        try:
            # Layer 1: Validate creator permissions
            creator_profile = getattr(request.user, 'creator_profile', None)
            if not creator_profile or creator_profile.verification_level == 'UNVERIFIED':
                return Response({
                    'error': '🚫 Creator verification required to upload tunes',
                    'help': 'Apply for creator verification in your profile settings',
                    'verification_levels': {
                        'BASIC': 'Email verification + Terms acceptance',
                        'PROFESSIONAL': 'Business verification + Insurance proof',  
                        'EXPERT': 'Track record + Professional references',
                        'PARTNER': 'Official partnership agreement'
                    }
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Layer 1: Pre-submission validation
            validation_errors = self._validate_submission_requirements(request.data, request.FILES)
            if validation_errors:
                return Response({
                    'error': '❌ Pre-submission validation failed',
                    'validation_errors': validation_errors,
                    'help': 'Please correct the errors and resubmit'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create tune submission with all T-CLOCS fields
            tune_submission = self._create_tune_submission(request.user, request.data, request.FILES)
            
            # Layer 2: Trigger comprehensive AI safety analysis
            self._trigger_ai_analysis(tune_submission)
            
            return Response({
                'id': tune_submission.id,
                'message': '🛡️ Tune submitted for T-CLOCS safety validation',
                'status': tune_submission.review_status,
                'compatibility': tune_submission.compatibility_string,
                'estimated_review_time': '5-15 minutes for AI + human review if needed',
                'validation_layers': [
                    '✅ Layer 1: Pre-submission validation complete',
                    '🤖 Layer 2: AI safety analysis in progress',
                    '📊 Layer 3: Real-world validation (if required)',
                    '👨‍🔧 Layer 4: Human review (if required)',
                    '📱 Layer 5: Safety presentation ready',
                    '⚠️ Layer 6: Pre-flash safeguards enabled',
                    '📈 Layer 7: Post-installation monitoring active',
                    '🔄 Layer 8: Quality assurance monitoring'
                ],
                'next_steps': [
                    'AI will analyze tune for safety parameters',
                    'Performance impact will be predicted',
                    'Risk factors will be identified',
                    'Human review if safety score requires it',
                    'Approval decision within 24 hours'
                ]
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error in T-CLOCS tune submission: {str(e)}")
            return Response({
                'error': 'Submission failed',
                'detail': str(e),
                'help': 'Please try again or contact support'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _validate_submission_requirements(self, data: dict, files: dict) -> list:
        """Layer 1: Comprehensive pre-submission validation"""
        
        errors = []
        
        # Required motorcycle information
        required_fields = {
            'name': 'Tune name',
            'description': 'Tune description', 
            'motorcycle_make': 'Motorcycle make (e.g., Yamaha, Honda)',
            'motorcycle_model': 'Motorcycle model (e.g., YZF-R6, CBR600RR)',
            'motorcycle_year': 'Motorcycle year',
            'engine_type': 'Engine type (e.g., 600cc Inline-4)',
            'ecu_type': 'ECU type (e.g., Yamaha ECU, Bosch ME7)',
            'tune_type': 'Tune type'
        }
        
        for field, description in required_fields.items():
            if not data.get(field):
                errors.append(f"'{description}' is required")
        
        # Motorcycle year validation
        year = data.get('motorcycle_year')
        if year:
            try:
                year_int = int(year)
                if year_int < 1990 or year_int > 2025:
                    errors.append("Motorcycle year must be between 1990 and 2025")
            except ValueError:
                errors.append("Motorcycle year must be a valid number")
        
        # Tune type validation
        valid_tune_types = ['ECU_FLASH', 'PIGGYBACK', 'MAP', 'FULL_SYSTEM']
        if data.get('tune_type') not in valid_tune_types:
            errors.append(f"Tune type must be one of: {', '.join(valid_tune_types)}")
        
        # File validation
        if 'file' not in files:
            errors.append("Tune file is required")
        else:
            file_errors = self._validate_tune_file(files['file'])
            errors.extend(file_errors)
        
        # Modification disclosure validation (important for safety)
        if data.get('tune_type') in ['ECU_FLASH', 'FULL_SYSTEM']:
            if not data.get('required_exhaust') and not data.get('required_air_filter'):
                errors.append("For ECU flash/full system tunes, specify required modifications or 'None'")
        
        return errors
    
    def _validate_tune_file(self, tune_file) -> list:
        """Comprehensive motorcycle ECU tune file validation"""
        
        errors = []
        
        # File size validation (max 50MB for large ECU dumps)
        if tune_file.size > 50 * 1024 * 1024:
            errors.append("File size must be less than 50MB")
        
        # Motorcycle ECU tuning file format validation
        motorcycle_ecu_extensions = [
            # Standard ECU formats
            '.bin',     # Most standard format - raw binary ECU firmware
            '.hex',     # Intel HEX format
            '.rom',     # ROM dump format
            
            # Proprietary ECU extensions (same binary data, different extensions)
            '.cod',     # Code/calibration file
            '.dtf',     # Data transfer file  
            '.map',     # Map file with lookup tables
            '.cal',     # Calibration file
            '.tune',    # Generic tune file
            '.ecu',     # ECU data file
            
            # BDM Format (Background Debug Mode - direct chip access)
            '.bdm',     # Binary dumps via BDM for protected ECUs
            
            # Advanced formats
            '.kef',     # Kawasaki ECU format
            '.ols',     # OpenECU format
            '.s19',     # Motorola S-record format
            '.a2l',     # ASAM-2 MC format (metadata)
            
            # Tuning tool container formats
            '.pcv',     # Power Commander file
            '.fmi',     # FTECU map import
            '.wrf',     # Woolich Racing format
            '.tec',     # TuneECU container
            '.dyno',    # Dynojet format
        ]
        
        file_name = tune_file.name.lower() if tune_file.name else ''
        file_ext = '.' + file_name.split('.')[-1] if '.' in file_name else ''
        
        if file_ext not in motorcycle_ecu_extensions:
            errors.append(
                f"File type '{file_ext}' not supported for motorcycle ECU tuning. "
                f"Supported formats: {', '.join(motorcycle_ecu_extensions[:10])}... "
                f"(total {len(motorcycle_ecu_extensions)} formats supported)"
            )
        
        # Minimum file size validation (ECU files should be substantial)
        min_sizes = {
            '.bin': 16 * 1024,      # 16KB minimum for binary ECU dumps
            '.bdm': 8 * 1024,       # 8KB minimum for BDM dumps
            '.rom': 16 * 1024,      # 16KB minimum for ROM dumps
            '.hex': 2 * 1024,       # 2KB minimum for HEX files (text format)
            '.map': 1 * 1024,       # 1KB minimum for map files
        }
        
        min_size = min_sizes.get(file_ext, 1024)  # Default 1KB minimum
        if tune_file.size < min_size:
            errors.append(f"File too small for {file_ext} format - expected at least {min_size//1024}KB")
        
        # Enhanced security validation for motorcycle ECU files
        security_issues = self._security_scan_motorcycle_ecu_file(tune_file, file_ext)
        if security_issues:
            errors.extend(security_issues)
        
        # ECU-specific format validation
        format_issues = self._validate_ecu_file_format(tune_file, file_ext)
        if format_issues:
            errors.extend(format_issues)
        
        return errors
    
    def _security_scan_motorcycle_ecu_file(self, tune_file, file_ext: str) -> list:
        """Enhanced security scan specifically for motorcycle ECU files"""
        
        issues = []
        
        try:
            # Read appropriate amount based on file type
            read_size = 4096 if file_ext in ['.bin', '.bdm', '.rom'] else 2048
            tune_file.seek(0)
            header = tune_file.read(read_size)
            tune_file.seek(0)
            
            # Check for executable signatures (should not be in ECU files)
            if header.startswith(b'MZ'):  # PE header (Windows executable)
                issues.append("⚠️ File appears to be a Windows executable - not a motorcycle ECU file")
            elif header.startswith(b'\x7fELF'):  # ELF header (Linux executable)
                issues.append("⚠️ File appears to be a Linux executable - not a motorcycle ECU file")
            elif header.startswith(b'\xca\xfe\xba\xbe'):  # Java class file
                issues.append("⚠️ File appears to be a Java class file - not a motorcycle ECU file")
            
            # Check for script content in binary files
            if file_ext in ['.bin', '.bdm', '.rom']:
                if b'<script' in header.lower():
                    issues.append("⚠️ Binary ECU file contains script tags - potential security risk")
                if b'eval(' in header or b'exec(' in header:
                    issues.append("⚠️ Binary ECU file contains executable code - potential security risk")
            
            # Validate HEX file format
            if file_ext == '.hex':
                if not self._validate_intel_hex_format(header):
                    issues.append("⚠️ Invalid Intel HEX format - file may be corrupted or malicious")
            
            # Check for suspicious file names
            suspicious_names = [
                'virus', 'trojan', 'malware', 'hack', 'crack', 'keygen',
                'exploit', 'backdoor', 'rootkit', 'worm'
            ]
            file_name_lower = tune_file.name.lower() if tune_file.name else ''
            detected_suspicious = [name for name in suspicious_names if name in file_name_lower]
            if detected_suspicious:
                issues.append(f"⚠️ File name contains suspicious terms: {', '.join(detected_suspicious)}")
            
            # ECU-specific binary pattern validation
            if file_ext in ['.bin', '.bdm', '.rom']:
                ecu_validation = self._validate_ecu_binary_patterns(header)
                if ecu_validation:
                    issues.extend(ecu_validation)
            
        except Exception as e:
            logger.warning(f"Enhanced security scan error for {file_ext}: {e}")
            issues.append("⚠️ Could not verify file security - upload blocked for safety")
        
        return issues
    
    def _validate_ecu_file_format(self, tune_file, file_ext: str) -> list:
        """Validate ECU-specific file format requirements"""
        
        format_issues = []
        
        try:
            tune_file.seek(0)
            
            if file_ext == '.hex':
                # Validate Intel HEX format
                content = tune_file.read(1024).decode('ascii', errors='ignore')
                if not content.startswith(':'):
                    format_issues.append("⚠️ Intel HEX file must start with ':' character")
                
                # Check for proper HEX record format
                lines = content.split('\n')[:5]  # Check first 5 lines
                for i, line in enumerate(lines):
                    if line.strip() and not line.strip().startswith(':'):
                        format_issues.append(f"⚠️ Invalid HEX record format at line {i+1}")
                        break
            
            elif file_ext in ['.bin', '.bdm', '.rom']:
                # Validate binary ECU format characteristics
                header = tune_file.read(512)
                
                # Check for all-zero or all-0xFF patterns (likely empty/erased)
                if header == b'\x00' * len(header):
                    format_issues.append("⚠️ File appears to be empty (all zeros) - not a valid ECU tune")
                elif header == b'\xff' * len(header):
                    format_issues.append("⚠️ File appears to be erased flash (all 0xFF) - not a valid ECU tune")
                
                # Check for reasonable binary entropy (not pure text or repetitive)
                if self._is_likely_text_file(header):
                    format_issues.append("⚠️ Binary ECU file appears to contain only text - may be incorrect format")
            
            elif file_ext == '.map':
                # Validate MAP file format (should contain calibration tables)
                content = tune_file.read(2048).decode('ascii', errors='ignore')
                map_indicators = ['map', 'table', 'axis', 'calibration', 'offset']
                if not any(indicator in content.lower() for indicator in map_indicators):
                    format_issues.append("⚠️ MAP file does not contain expected calibration table indicators")
            
            elif file_ext in ['.pcv', '.fmi', '.wrf', '.tec']:
                # Validate tuning tool container formats
                header = tune_file.read(256)
                
                # These should typically have specific headers or magic numbers
                tool_formats = {
                    '.pcv': [b'PCV', b'POWER'],
                    '.fmi': [b'FMI', b'FTECU'],
                    '.wrf': [b'WRF', b'WOOLICH'],
                    '.tec': [b'TEC', b'TUNEECU']
                }
                
                expected_headers = tool_formats.get(file_ext, [])
                if expected_headers:
                    if not any(header.startswith(h) or h in header for h in expected_headers):
                        format_issues.append(f"⚠️ {file_ext.upper()} file does not contain expected format signature")
            
            tune_file.seek(0)  # Reset file pointer
            
        except Exception as e:
            logger.warning(f"Format validation error for {file_ext}: {e}")
            format_issues.append(f"⚠️ Could not validate {file_ext} format - file may be corrupted")
        
        return format_issues
    
    def _validate_intel_hex_format(self, content: bytes) -> bool:
        """Validate Intel HEX format structure"""
        
        try:
            text_content = content.decode('ascii', errors='ignore')
            lines = text_content.split('\n')[:10]  # Check first 10 lines
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Intel HEX records start with ':'
                if not line.startswith(':'):
                    return False
                
                # Basic length check (minimum record is 11 characters)
                if len(line) < 11:
                    return False
                
                # Check if hex characters after ':'
                hex_part = line[1:]
                if not all(c in '0123456789ABCDEFabcdef' for c in hex_part):
                    return False
            
            return True
            
        except Exception:
            return False
    
    def _validate_ecu_binary_patterns(self, header: bytes) -> list:
        """Validate ECU binary for expected patterns"""
        
        issues = []
        
        # Check for common ECU signatures/patterns
        ecu_patterns = [
            b'ECU',
            b'BOSCH', 
            b'DENSO',
            b'YAMAHA',
            b'HONDA',
            b'KAWASAKI',
            b'SUZUKI',
            b'BMW',
            b'DUCATI'
        ]
        
        # Look for motorcycle/ECU manufacturer signatures
        has_ecu_signature = any(pattern in header.upper() for pattern in ecu_patterns)
        
        # Check for unrealistic patterns that suggest corruption
        if len(set(header)) < 10:  # Too few unique bytes
            issues.append("⚠️ Binary file has suspiciously low entropy - may be corrupted or invalid")
        
        # Very repetitive patterns
        if header.count(header[0:4]) > len(header) // 10:
            issues.append("⚠️ Binary file contains highly repetitive patterns - verify file integrity")
        
        return issues
    
    def _is_likely_text_file(self, content: bytes) -> bool:
        """Check if binary file is actually text"""
        
        try:
            # Try to decode as text
            text_content = content.decode('ascii')
            
            # If most characters are printable ASCII, it's likely text
            printable_ratio = sum(1 for c in text_content if c.isprintable() or c.isspace()) / len(text_content)
            return printable_ratio > 0.8
            
        except UnicodeDecodeError:
            return False
    
    def _create_tune_submission(self, user, data: dict, files: dict):
        """Create comprehensive tune submission with all T-CLOCS fields"""
        
        tune_submission = TuneSubmission.objects.create(
            # Basic information
            creator=user,
            name=data['name'],
            description=data['description'],
            file=files['file'],
            
            # Layer 1: Pre-submission validation data
            motorcycle_make=data['motorcycle_make'],
            motorcycle_model=data['motorcycle_model'],
            motorcycle_year=int(data['motorcycle_year']),
            engine_type=data['engine_type'],
            ecu_type=data['ecu_type'],
            tune_type=data['tune_type'],
            
            # Required modifications disclosure
            required_exhaust=data.get('required_exhaust', ''),
            required_air_filter=data.get('required_air_filter', ''),
            required_fuel_system=data.get('required_fuel_system', ''),
            other_required_mods=data.get('other_required_mods', ''),
            
            # Initial status
            review_status='AI_REVIEW'
        )
        
        logger.info(f"Created tune submission {tune_submission.id}: {tune_submission.compatibility_string}")
        return tune_submission
    
    def _trigger_ai_analysis(self, tune_submission):
        """Layer 2: Trigger comprehensive AI safety analysis"""
        
        try:
            # Prepare comprehensive data for AI analysis
            tune_data = {
                'id': tune_submission.id,
                'name': tune_submission.name,
                'description': tune_submission.description,
                'file_path': tune_submission.file.path if tune_submission.file else '',
                'motorcycle_make': tune_submission.motorcycle_make,
                'motorcycle_model': tune_submission.motorcycle_model,
                'motorcycle_year': tune_submission.motorcycle_year,
                'engine_type': tune_submission.engine_type,
                'ecu_type': tune_submission.ecu_type,
                'tune_type': tune_submission.tune_type,
                'required_exhaust': tune_submission.required_exhaust,
                'required_air_filter': tune_submission.required_air_filter,
                'required_fuel_system': tune_submission.required_fuel_system,
                'other_required_mods': tune_submission.other_required_mods,
                'creator_level': tune_submission.creator.creator_profile.verification_level if hasattr(tune_submission.creator, 'creator_profile') else 'BASIC'
            }
            
            # Run comprehensive T-CLOCS AI analysis
            review_service = TuneReviewService()
            analysis_result = review_service.analyze_tune_comprehensive(tune_data)
            
            # Update tune submission with comprehensive AI results
            self._update_tune_with_ai_results(tune_submission, analysis_result)
            
            logger.info(f"T-CLOCS AI analysis completed for tune {tune_submission.id}")
            
        except Exception as e:
            logger.error(f"T-CLOCS AI analysis failed for tune {tune_submission.id}: {str(e)}")
            tune_submission.review_status = 'HUMAN_REVIEW'
            tune_submission.review_notes = f"AI analysis failed: {str(e)} - Manual review required"
            tune_submission.save()
    
    def _update_tune_with_ai_results(self, tune_submission, analysis_result: dict):
        """Update tune submission with comprehensive AI analysis results"""
        
        # Layer 2: AI Safety Scoring & Analysis
        tune_submission.ai_safety_score = analysis_result.get('safety_score', 75)
        tune_submission.ai_confidence = analysis_result.get('ai_confidence', 0.8)
        tune_submission.skill_level_required = analysis_result.get('skill_level_required', 'INTERMEDIATE')
        
        # Risk indicators
        tune_submission.lean_afr_risk = analysis_result.get('lean_afr_risk', False)
        tune_submission.timing_risk = analysis_result.get('timing_risk', False) 
        tune_submission.emissions_impact = analysis_result.get('emissions_impact', False)
        tune_submission.ecu_brick_risk = analysis_result.get('ecu_brick_risk', False)
        
        # Performance predictions
        tune_submission.estimated_hp_gain = analysis_result.get('estimated_hp_gain', 10.0)
        tune_submission.estimated_torque_gain = analysis_result.get('estimated_torque_gain', 8.0)
        tune_submission.throttle_response_improvement = analysis_result.get('throttle_response_improvement', 'Moderate')
        tune_submission.fuel_efficiency_impact = analysis_result.get('fuel_efficiency_impact', 'Similar')
        
        # Layer 5: Safety presentation data
        tune_submission.safety_badge = analysis_result.get('safety_badge', 'MODERATE')
        tune_submission.risk_flags = analysis_result.get('risk_flags', [])
        tune_submission.performance_highlights = analysis_result.get('performance_highlights', [])
        tune_submission.warranty_implications = analysis_result.get('warranty_implications', 'ECU modifications may void warranty.')
        tune_submission.emissions_disclaimer = analysis_result.get('emissions_disclaimer', 'Check local emission regulations.')
        
        # Layer 6: Installation guidance
        tune_submission.installation_complexity = analysis_result.get('installation_complexity', 'MODERATE')
        tune_submission.special_tools_required = analysis_result.get('special_tools_required', 'Standard ECU interface')
        
        # CRITICAL: Check for LLM safety blocking
        if analysis_result.get('block_reason'):
            # LLM has flagged this tune as unsafe - FORCE REJECTION
            tune_submission.review_status = 'REJECTED'
            tune_submission.reviewed_at = timezone.now()
            tune_submission.review_notes = f"🚨 SAFETY BLOCKING ACTIVATED\n\nReason: {analysis_result['block_reason']}\n\nCritical Violations:\n"
            
            # Add violation details
            violations = analysis_result.get('critical_safety_violations', [])
            for violation in violations:
                tune_submission.review_notes += f"- {violation}\n"
            
            tune_submission.review_notes += f"\nAI Safety Analysis:\n"
            
            # Add fuel map analysis if available
            fuel_analysis = analysis_result.get('fuel_map_analysis', {})
            if fuel_analysis:
                tune_submission.review_notes += f"Fuel Map Safety: {fuel_analysis.get('overall_safety', 'Unknown')}\n"
                if fuel_analysis.get('leanest_afr'):
                    tune_submission.review_notes += f"Leanest AFR: {fuel_analysis['leanest_afr']} (Dangerous if >15.5)\n"
            
            # Add timing analysis if available
            timing_analysis = analysis_result.get('ignition_timing_analysis', {})
            if timing_analysis:
                tune_submission.review_notes += f"Timing Safety: {timing_analysis.get('overall_safety', 'Unknown')}\n"
                if timing_analysis.get('max_timing_advance'):
                    tune_submission.review_notes += f"Max Timing Advance: {timing_analysis['max_timing_advance']}° (Dangerous if >40°)\n"
            
            tune_submission.review_notes += f"\nThis tune has been automatically rejected for safety reasons and cannot be uploaded to the platform."
            
            logger.critical(f"TUNE UPLOAD BLOCKED - Safety violations detected for tune {tune_submission.id}: {analysis_result['block_reason']}")
            
        else:
            # No safety blocking - proceed with normal T-CLOCS decision logic
            safety_score = analysis_result.get('safety_score', 75)
            ai_confidence = analysis_result.get('ai_confidence', 0.8)
            creator_profile = getattr(tune_submission.creator, 'creator_profile', None)
            creator_level = creator_profile.verification_level if creator_profile else 'BASIC'
            
            # Enhanced T-CLOCS decision matrix with structured data considerations
            decision_result = self._make_enhanced_tclocs_decision(safety_score, ai_confidence, creator_level, analysis_result)
            
            tune_submission.review_status = decision_result['status']
            tune_submission.review_notes = decision_result['reasoning']
            if decision_result['status'] in ['APPROVED', 'REJECTED']:
                tune_submission.reviewed_at = timezone.now()
        
        tune_submission.save()
        
        logger.info(f"Enhanced T-CLOCS analysis complete for tune {tune_submission.id}: {tune_submission.review_status} (score: {tune_submission.ai_safety_score})")
    
    def _make_enhanced_tclocs_decision(self, safety_score: int, ai_confidence: float, creator_level: str, analysis: dict) -> dict:
        """Enhanced T-CLOCS decision making with structured ECU data considerations"""
        
        # Base thresholds inspired by T-CLOCS safety methodology
        auto_approve_threshold = 85
        auto_reject_threshold = 50
        confidence_threshold = 0.80
        
        # Enhanced creator level adjustments with structured data validation
        creator_adjustments = {
            'PARTNER': {'approve': -10, 'reject': -5},    
            'EXPERT': {'approve': -7, 'reject': -3},      
            'PROFESSIONAL': {'approve': -5, 'reject': -2}, 
            'BASIC': {'approve': 0, 'reject': 0}          
        }
        
        adjustments = creator_adjustments.get(creator_level, creator_adjustments['BASIC'])
        adjusted_approve = auto_approve_threshold + adjustments['approve']
        adjusted_reject = auto_reject_threshold + adjustments['reject']
        
        # Enhanced critical safety checks with structured data
        upload_decision = analysis.get('upload_decision', 'REVIEW')
        
        # Check for LLM BLOCK decision (should have been caught earlier, but double-check)
        if upload_decision == 'BLOCK':
            return {
                'status': 'REJECTED',
                'reasoning': f'LLM BLOCK DECISION: {analysis.get("block_reason", "Critical safety violations detected")}'
            }
        
        # Check for dangerous fuel mapping
        fuel_analysis = analysis.get('fuel_map_analysis', {})
        if fuel_analysis.get('overall_safety') == 'DANGEROUS':
            return {
                'status': 'REJECTED',
                'reasoning': f'DANGEROUS FUEL MAPPING: LLM detected unsafe AFR values that could cause engine damage'
            }
        
        # Check for dangerous timing
        timing_analysis = analysis.get('ignition_timing_analysis', {})
        if timing_analysis.get('overall_safety') == 'DANGEROUS':
            return {
                'status': 'REJECTED',
                'reasoning': f'DANGEROUS TIMING ADVANCE: LLM detected timing values that could cause knock/detonation'
            }
        
        # Auto-approval logic with enhanced considerations
        if (safety_score >= adjusted_approve and 
            ai_confidence >= confidence_threshold and
            safety_score >= 75 and  # Absolute minimum
            upload_decision in ['APPROVE', 'REVIEW']):  # LLM didn't flag for blocking
            
            return {
                'status': 'APPROVED', 
                'reasoning': f'ENHANCED T-CLOCS AUTO-APPROVAL: Score {safety_score}, confidence {ai_confidence:.2f}, creator {creator_level}, LLM decision: {upload_decision}'
            }
        
        # Auto-rejection logic with enhanced considerations
        if (safety_score <= adjusted_reject and ai_confidence >= confidence_threshold) or safety_score < 30:
            return {
                'status': 'REJECTED',
                'reasoning': f'ENHANCED T-CLOCS AUTO-REJECTION: Score {safety_score} below threshold, confidence {ai_confidence:.2f}'
            }
        
        # Manual review required
        review_reasoning = f'ENHANCED T-CLOCS MANUAL REVIEW: Score {safety_score}, confidence {ai_confidence:.2f}, LLM decision: {upload_decision}'
        
        # Add structured data context for human reviewer
        if fuel_analysis:
            review_reasoning += f'\nFuel Map Analysis: {fuel_analysis.get("overall_safety", "Unknown")}'
        if timing_analysis:
            review_reasoning += f'\nTiming Analysis: {timing_analysis.get("overall_safety", "Unknown")}'
        
        violations = analysis.get('critical_safety_violations', [])
        if violations:
            review_reasoning += f'\nAI Noted Concerns: {"; ".join(violations[:3])}'
        
        return {
            'status': 'HUMAN_REVIEW',
            'reasoning': review_reasoning
        }


class RealWorldValidationView(APIView):
    """Layer 3: Real-World Validation - Dyno charts and test data upload"""
    
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def post(self, request, tune_id):
        """Upload real-world validation data (dyno charts, road tests)"""
        
        try:
            tune_submission = get_object_or_404(
                TuneSubmission, 
                id=tune_id, 
                creator=request.user
            )
            
            # Validate submission is in correct state for real-world validation
            if tune_submission.review_status not in ['HUMAN_REVIEW', 'REVISION_REQUESTED']:
                return Response({
                    'error': '📊 Real-world validation not accepted at this stage',
                    'current_status': tune_submission.review_status,
                    'help': 'Real-world validation is only accepted when human review is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process uploaded validation data
            validation_data = self._process_validation_uploads(request.FILES, request.data)
            
            # Update tune submission with validation data
            self._update_tune_with_validation_data(tune_submission, validation_data, request.FILES)
            
            return Response({
                'message': '📊 Real-world validation data uploaded successfully',
                'validation_summary': validation_data['summary'],
                'uploaded_files': validation_data['files_uploaded'],
                'data_points': len(validation_data['data_points']),
                'next_steps': [
                    'Human reviewer will evaluate your real-world data',
                    'Dyno charts and test logs will be verified',
                    'Safety analysis will be updated based on real-world results',
                    'Decision expected within 24 hours'
                ],
                'tip': '💡 High-quality dyno data significantly improves approval chances'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error uploading real-world validation data: {str(e)}")
            return Response({
                'error': 'Validation upload failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _process_validation_uploads(self, files: dict, data: dict) -> dict:
        """Process uploaded validation files and extract data"""
        
        validation_data = {
            'files_uploaded': [],
            'data_points': {},
            'summary': []
        }
        
        # Process dyno charts
        if 'dyno_chart_before' in files:
            validation_data['files_uploaded'].append('📈 Baseline dyno chart')
        if 'dyno_chart_after' in files:
            validation_data['files_uploaded'].append('📈 Tuned dyno chart')
        
        # Process AFR monitoring data
        if 'afr_monitoring_data' in files:
            validation_data['files_uploaded'].append('🔬 AFR monitoring data')
        
        # Process numerical dyno results
        dyno_fields = {
            'baseline_hp': 'Baseline HP',
            'tuned_hp': 'Tuned HP', 
            'baseline_torque': 'Baseline Torque',
            'tuned_torque': 'Tuned Torque',
            'peak_afr': 'Peak AFR'
        }
        
        for field, description in dyno_fields.items():
            if field in data and data[field]:
                try:
                    value = float(data[field])
                    validation_data['data_points'][field] = value
                    validation_data['summary'].append(f"{description}: {value}")
                except (ValueError, TypeError):
                    logger.warning(f"Invalid {field} value: {data[field]}")
        
        # Process test logs
        if 'road_test_log' in data and data['road_test_log']:
            validation_data['data_points']['road_test_log'] = data['road_test_log']
            validation_data['summary'].append("📝 Road test log provided")
        
        if 'test_anomalies' in data and data['test_anomalies']:
            validation_data['data_points']['test_anomalies'] = data['test_anomalies']
            validation_data['summary'].append("⚠️ Test anomalies documented")
        
        # Generate performance summary
        if 'baseline_hp' in validation_data['data_points'] and 'tuned_hp' in validation_data['data_points']:
            hp_gain = validation_data['data_points']['tuned_hp'] - validation_data['data_points']['baseline_hp']
            validation_data['summary'].append(f"🚀 Measured HP gain: +{hp_gain:.1f} HP")
        
        if 'baseline_torque' in validation_data['data_points'] and 'tuned_torque' in validation_data['data_points']:
            torque_gain = validation_data['data_points']['tuned_torque'] - validation_data['data_points']['baseline_torque']
            validation_data['summary'].append(f"💪 Measured torque gain: +{torque_gain:.1f} lb-ft")
        
        if 'peak_afr' in validation_data['data_points']:
            afr = validation_data['data_points']['peak_afr']
            if 12.5 <= afr <= 14.7:
                validation_data['summary'].append(f"✅ Safe AFR: {afr:.1f}")
            else:
                validation_data['summary'].append(f"⚠️ AFR outside safe range: {afr:.1f}")
        
        return validation_data
    
    def _update_tune_with_validation_data(self, tune_submission, validation_data: dict, files: dict):
        """Update tune submission with real-world validation data"""
        
        # Update numerical data points
        for field, value in validation_data['data_points'].items():
            if hasattr(tune_submission, field):
                setattr(tune_submission, field, value)
        
        # Update file fields
        if 'dyno_chart_before' in files:
            tune_submission.dyno_chart_before = files['dyno_chart_before']
        if 'dyno_chart_after' in files:
            tune_submission.dyno_chart_after = files['dyno_chart_after']
        if 'afr_monitoring_data' in files:
            tune_submission.afr_monitoring_data = files['afr_monitoring_data']
        
        # Update review notes with validation summary
        existing_notes = tune_submission.review_notes or ""
        validation_summary = "\n\n📊 REAL-WORLD VALIDATION UPLOADED:\n" + "\n".join([
            f"- {item}" for item in validation_data['summary']
        ])
        tune_submission.review_notes = (existing_notes + validation_summary).strip()
        
        tune_submission.save()
        
        logger.info(f"Real-world validation data updated for tune {tune_submission.id}")


class HumanReviewDashboardView(APIView):
    """Layer 4: Human Review & Approval Dashboard"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get T-CLOCS review dashboard for human reviewers"""
        
        # Check reviewer permissions
        if not self._is_reviewer(request.user):
            return Response({
                'error': '🚫 Reviewer permissions required',
                'help': 'Contact administrator for reviewer access',
                'requirements': [
                    'Staff member, or',
                    'Member of tune_reviewers group, or', 
                    'Creator with EXPERT/PARTNER verification'
                ]
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get comprehensive review queue
        pending_reviews = TuneSubmission.objects.filter(
            review_status='HUMAN_REVIEW'
        ).select_related('creator').prefetch_related('creator__creator_profile').order_by('-created_at')
        
        # Build prioritized review queue
        review_queue = []
        for tune in pending_reviews:
            creator_profile = getattr(tune.creator, 'creator_profile', None)
            
            review_item = {
                'id': tune.id,
                'name': tune.name,
                'motorcycle': tune.compatibility_string,
                'creator': tune.creator.username,
                'creator_level': creator_profile.verification_level if creator_profile else 'BASIC',
                
                # T-CLOCS Safety Data
                'ai_safety_score': tune.ai_safety_score,
                'ai_confidence': tune.ai_confidence,
                'skill_level_required': tune.skill_level_required,
                'safety_badge': tune.safety_badge,
                'risk_flags': tune.risk_flags[:3],  # Top 3 risks
                
                # Risk Analysis
                'critical_risks': {
                    'lean_afr': tune.lean_afr_risk,
                    'timing': tune.timing_risk,
                    'ecu_brick': tune.ecu_brick_risk,
                    'emissions': tune.emissions_impact
                },
                
                # Performance Data
                'performance': {
                    'hp_gain': tune.estimated_hp_gain,
                    'torque_gain': tune.estimated_torque_gain,
                    'highlights': tune.performance_highlights[:2]
                },
                
                # Real-world validation
                'has_dyno_data': bool(tune.dyno_chart_before or tune.dyno_chart_after),
                'has_afr_data': bool(tune.afr_monitoring_data),
                'measured_hp_gain': tune.hp_gain if tune.baseline_hp and tune.tuned_hp else None,
                
                # Review metadata
                'submitted_at': tune.created_at,
                'priority_score': self._calculate_review_priority(tune),
                'review_complexity': self._assess_review_complexity(tune)
            }
            
            review_queue.append(review_item)
        
        # Sort by priority score (highest first)
        review_queue.sort(key=lambda x: x['priority_score'], reverse=True)
        
        # Get reviewer statistics
        reviewer_stats = self._get_reviewer_stats(request.user)
        
        # Get platform safety statistics
        platform_stats = self._get_platform_safety_stats()
        
        return Response({
            'review_dashboard': {
                'pending_count': len(review_queue),
                'high_priority': len([item for item in review_queue if item['priority_score'] > 80]),
                'critical_safety': len([item for item in review_queue if any(item['critical_risks'].values())]),
                'with_real_world_data': len([item for item in review_queue if item['has_dyno_data']])
            },
            'review_queue': review_queue[:25],  # Top 25 priority items
            'reviewer_stats': reviewer_stats,
            'platform_stats': platform_stats,
            'tclocs_legend': {
                'safety_badges': {
                    'SAFE': '🟢 Conservative, street-friendly',
                    'MODERATE': '🟡 Some risk considerations', 
                    'EXPERT': '🔴 Advanced, requires experience'
                },
                'priority_factors': [
                    'Creator verification level',
                    'AI safety score',
                    'Presence of real-world data',
                    'Time since submission',
                    'Critical risk flags'
                ]
            }
        })
    
    def post(self, request, tune_id):
        """Submit T-CLOCS human review decision"""
        
        if not self._is_reviewer(request.user):
            return Response({
                'error': '🚫 Reviewer permissions required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            tune_submission = get_object_or_404(TuneSubmission, id=tune_id)
            
            decision = request.data.get('decision')  # 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'
            review_notes = request.data.get('review_notes', '')
            safety_score_override = request.data.get('safety_score_override')
            
            # Validate decision
            valid_decisions = ['APPROVED', 'REJECTED', 'REVISION_REQUESTED']
            if decision not in valid_decisions:
                return Response({
                    'error': f'Invalid decision. Must be one of: {", ".join(valid_decisions)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update tune submission with review decision
            tune_submission.review_status = decision
            tune_submission.reviewer = request.user
            tune_submission.review_notes = self._format_review_notes(review_notes, decision, tune_submission)
            tune_submission.reviewed_at = timezone.now()
            
            # Handle safety score override
            if safety_score_override is not None:
                try:
                    override_score = int(safety_score_override)
                    if 0 <= override_score <= 100:
                        tune_submission.ai_safety_score = override_score
                        tune_submission.review_notes += f"\n\nSafety score overridden by reviewer: {override_score}"
                except (ValueError, TypeError):
                    pass
            
            # Process decision-specific actions
            if decision == 'APPROVED':
                self._process_tune_approval(tune_submission)
            elif decision == 'REJECTED':
                self._process_tune_rejection(tune_submission)
            elif decision == 'REVISION_REQUESTED':
                self._process_revision_request(tune_submission)
            
            tune_submission.save()
            
            # Create audit trail
            SafetyAudit.objects.create(
                tune=tune_submission,
                auditor=request.user,
                audit_type='ROUTINE',
                recommendations=review_notes,
                action_taken=decision
            )
            
            decision_messages = {
                'APPROVED': '✅ Tune approved successfully',
                'REJECTED': '❌ Tune rejected',
                'REVISION_REQUESTED': '📝 Revision requested'
            }
            
            return Response({
                'message': decision_messages[decision],
                'tune_id': tune_id,
                'decision': decision,
                'reviewed_by': request.user.username,
                'review_timestamp': tune_submission.reviewed_at,
                'safety_score': tune_submission.ai_safety_score
            })
            
        except Exception as e:
            logger.error(f"Error in T-CLOCS human review: {str(e)}")
            return Response({
                'error': 'Review submission failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _is_reviewer(self, user) -> bool:
        """Check if user has T-CLOCS reviewer permissions"""
        
        if user.is_staff:
            return True
        
        if user.groups.filter(name='tune_reviewers').exists():
            return True
        
        creator_profile = getattr(user, 'creator_profile', None)
        if creator_profile and creator_profile.verification_level in ['EXPERT', 'PARTNER']:
            return True
        
        return False
    
    def _calculate_review_priority(self, tune_submission) -> int:
        """Calculate T-CLOCS review priority score (0-100)"""
        
        priority = 0
        
        # Creator level priority (higher level = higher priority)
        creator_profile = getattr(tune_submission.creator, 'creator_profile', None)
        if creator_profile:
            level_priority = {
                'PARTNER': 40,
                'EXPERT': 35,
                'PROFESSIONAL': 25,
                'BASIC': 10
            }
            priority += level_priority.get(creator_profile.verification_level, 10)
        
        # Safety score priority (higher score = higher priority)
        if tune_submission.ai_safety_score:
            priority += min(tune_submission.ai_safety_score // 3, 30)
        
        # Real-world data bonus
        if tune_submission.dyno_chart_before or tune_submission.dyno_chart_after:
            priority += 15
        if tune_submission.afr_monitoring_data:
            priority += 10
        
        # Time factor (older submissions get priority boost)
        hours_old = (timezone.now() - tune_submission.created_at).total_seconds() / 3600
        time_priority = min(hours_old // 24 * 5, 20)  # 5 points per day, max 20
        priority += time_priority
        
        # Critical risk penalty (very dangerous tunes get lower priority as likely rejection)
        critical_risks = [
            tune_submission.lean_afr_risk,
            tune_submission.ecu_brick_risk
        ]
        if any(critical_risks) and tune_submission.ai_safety_score and tune_submission.ai_safety_score < 50:
            priority -= 15
        
        return max(0, min(100, int(priority)))
    
    def _assess_review_complexity(self, tune_submission) -> str:
        """Assess review complexity for reviewer planning"""
        
        complexity_factors = 0
        
        # Technical complexity
        if tune_submission.tune_type in ['ECU_FLASH', 'FULL_SYSTEM']:
            complexity_factors += 2
        
        # Risk complexity
        risks = [
            tune_submission.lean_afr_risk,
            tune_submission.timing_risk,
            tune_submission.ecu_brick_risk
        ]
        complexity_factors += sum(risks)
        
        # Data complexity
        if tune_submission.dyno_chart_before or tune_submission.dyno_chart_after:
            complexity_factors += 1
        
        # Safety score complexity
        if tune_submission.ai_safety_score and tune_submission.ai_safety_score < 70:
            complexity_factors += 1
        
        if complexity_factors >= 4:
            return 'HIGH'
        elif complexity_factors >= 2:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _get_reviewer_stats(self, reviewer) -> dict:
        """Get comprehensive reviewer statistics"""
        
        total_reviewed = TuneSubmission.objects.filter(reviewer=reviewer).count()
        approved = TuneSubmission.objects.filter(reviewer=reviewer, review_status='APPROVED').count()
        rejected = TuneSubmission.objects.filter(reviewer=reviewer, review_status='REJECTED').count()
        
        # Recent activity (last 30 days)
        recent_cutoff = timezone.now() - timezone.timedelta(days=30)
        recent_reviews = TuneSubmission.objects.filter(
            reviewer=reviewer, 
            reviewed_at__gte=recent_cutoff
        ).count()
        
        return {
            'total_reviewed': total_reviewed,
            'total_approved': approved,
            'total_rejected': rejected,
            'approval_rate': (approved / total_reviewed * 100) if total_reviewed > 0 else 0,
            'recent_activity': recent_reviews,
            'reviewer_level': 'Expert' if total_reviewed > 100 else 'Experienced' if total_reviewed > 25 else 'New'
        }
    
    def _get_platform_safety_stats(self) -> dict:
        """Get platform-wide safety statistics"""
        
        total_submissions = TuneSubmission.objects.count()
        approved = TuneSubmission.objects.filter(review_status='APPROVED').count()
        rejected = TuneSubmission.objects.filter(review_status='REJECTED').count()
        
        # Safety score distribution
        high_safety = TuneSubmission.objects.filter(ai_safety_score__gte=85).count()
        medium_safety = TuneSubmission.objects.filter(ai_safety_score__range=(70, 84)).count()
        low_safety = TuneSubmission.objects.filter(ai_safety_score__lt=70).count()
        
        return {
            'total_submissions': total_submissions,
            'approval_rate': (approved / total_submissions * 100) if total_submissions > 0 else 0,
            'rejection_rate': (rejected / total_submissions * 100) if total_submissions > 0 else 0,
            'safety_distribution': {
                'high_safety': high_safety,
                'medium_safety': medium_safety, 
                'low_safety': low_safety
            },
            'platform_safety_score': 'Excellent' if (approved / total_submissions if total_submissions > 0 else 0) > 0.8 else 'Good'
        }
    
    def _format_review_notes(self, notes: str, decision: str, tune_submission) -> str:
        """Format comprehensive review notes"""
        
        header = f"=== T-CLOCS HUMAN REVIEW ===\n"
        header += f"Decision: {decision}\n"
        header += f"Tune: {tune_submission.name}\n"
        header += f"Motorcycle: {tune_submission.compatibility_string}\n"
        header += f"AI Safety Score: {tune_submission.ai_safety_score}\n"
        header += f"AI Confidence: {tune_submission.ai_confidence:.2f}\n"
        header += f"Review Date: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        return header + notes
    
    def _process_tune_approval(self, tune_submission):
        """Process tune approval - Layer 5 preparation"""
        logger.info(f"Processing T-CLOCS approval for tune {tune_submission.id}")
        # In production: create published tune, notify creator, etc.
    
    def _process_tune_rejection(self, tune_submission):
        """Process tune rejection"""
        logger.info(f"Processing T-CLOCS rejection for tune {tune_submission.id}")
        # In production: notify creator with feedback, archive submission
    
    def _process_revision_request(self, tune_submission):
        """Process revision request"""
        logger.info(f"Processing T-CLOCS revision request for tune {tune_submission.id}")
        # In production: notify creator, provide revision guidelines


# Layer 5: Safety Presentation View will be handled by the mobile app
# Layer 6: Pre-Flash Safeguards will be implemented in mobile app
# Layer 7: Post-Installation Monitoring implemented below
# Layer 8: Quality Assurance implemented below

class PostInstallationFeedbackView(APIView):
    """Layer 7: Post-Installation Monitoring - User feedback collection"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, tune_id):
        """Submit comprehensive post-installation feedback"""
        
        try:
            tune_submission = get_object_or_404(
                TuneSubmission, 
                id=tune_id, 
                review_status='APPROVED'
            )
            
            # Create or update comprehensive feedback
            feedback_data = self._validate_feedback_data(request.data)
            if 'error' in feedback_data:
                return Response(feedback_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if feedback already exists
            existing_feedback = UserFeedback.objects.filter(
                tune=tune_submission, 
                user=request.user
            ).first()
            
            if existing_feedback:
                # Update existing feedback
                self._update_feedback(existing_feedback, feedback_data)
                message = "🔄 Feedback updated successfully"
                feedback = existing_feedback
            else:
                # Create new feedback
                feedback = self._create_feedback(tune_submission, request.user, feedback_data)
                message = "✅ Feedback submitted successfully"
            
            # Update tune aggregate statistics
            self._update_tune_feedback_stats(tune_submission)
            
            # Check for safety concerns
            safety_concerns = self._analyze_feedback_for_safety_issues(feedback)
            if safety_concerns:
                self._flag_safety_concerns(tune_submission, feedback, safety_concerns)
            
            return Response({
                'message': message,
                'feedback_id': feedback.id,
                'safety_analysis': safety_concerns,
                'thank_you': '🙏 Thank you for helping improve motorcycle tune safety!',
                'community_impact': f'Your feedback helps keep {UserFeedback.objects.filter(tune=tune_submission).count()} riders safe'
            })
            
        except Exception as e:
            logger.error(f"Error submitting post-installation feedback: {str(e)}")
            return Response({
                'error': 'Feedback submission failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _validate_feedback_data(self, data: dict) -> dict:
        """Validate comprehensive feedback data"""
        
        # Required fields validation
        required_ratings = ['installation_difficulty', 'performance_rating']
        for field in required_ratings:
            if field not in data:
                return {'error': f"'{field}' rating is required"}
            
            try:
                rating = int(data[field])
                if not 1 <= rating <= 5:
                    return {'error': f"'{field}' must be between 1 and 5"}
            except (ValueError, TypeError):
                return {'error': f"'{field}' must be a number between 1 and 5"}
        
        # Validate choice fields
        choice_fields = {
            'throttle_response': ['MUCH_BETTER', 'BETTER', 'SAME', 'WORSE'],
            'power_delivery': ['SMOOTH', 'PEAKY', 'HARSH'],
            'fuel_economy_change': ['IMPROVED', 'SAME', 'WORSE'],
            'primary_use': ['STREET', 'TRACK', 'BOTH']
        }
        
        for field, valid_choices in choice_fields.items():
            if field in data and data[field] not in valid_choices:
                return {'error': f"'{field}' must be one of: {', '.join(valid_choices)}"}
        
        return data
    
    def _create_feedback(self, tune_submission, user, feedback_data: dict):
        """Create comprehensive feedback record"""
        
        return UserFeedback.objects.create(
            tune=tune_submission,
            user=user,
            installation_difficulty=int(feedback_data['installation_difficulty']),
            installation_time_minutes=feedback_data.get('installation_time_minutes'),
            tools_used=feedback_data.get('tools_used', ''),
            performance_rating=int(feedback_data['performance_rating']),
            throttle_response=feedback_data.get('throttle_response', 'BETTER'),
            power_delivery=feedback_data.get('power_delivery', 'SMOOTH'),
            fuel_economy_change=feedback_data.get('fuel_economy_change', 'SAME'),
            any_issues=feedback_data.get('any_issues', False),
            issue_description=feedback_data.get('issue_description', ''),
            would_recommend=feedback_data.get('would_recommend', True),
            primary_use=feedback_data.get('primary_use', 'STREET'),
            miles_since_install=feedback_data.get('miles_since_install')
        )
    
    def _update_feedback(self, feedback, feedback_data: dict):
        """Update existing feedback record"""
        
        for field, value in feedback_data.items():
            if hasattr(feedback, field):
                setattr(feedback, field, value)
        feedback.save()
    
    def _update_tune_feedback_stats(self, tune_submission):
        """Update tune aggregate feedback statistics"""
        
        feedback_stats = UserFeedback.objects.filter(tune=tune_submission).aggregate(
            avg_rating=Avg('performance_rating'),
            avg_installation=Avg('installation_difficulty'),
            count=Count('id'),
            issues_count=Count('id', filter=Q(any_issues=True)),
            recommend_count=Count('id', filter=Q(would_recommend=True))
        )
        
        tune_submission.feedback_count = feedback_stats['count'] or 0
        tune_submission.average_user_rating = feedback_stats['avg_rating']
        tune_submission.reported_issues_count = feedback_stats['issues_count'] or 0
        tune_submission.save()
        
        logger.info(f"Updated feedback stats for tune {tune_submission.id}: {feedback_stats['count']} reviews, {feedback_stats['avg_rating']:.1f} avg rating")
    
    def _analyze_feedback_for_safety_issues(self, feedback) -> list:
        """Analyze feedback for potential safety concerns"""
        
        safety_concerns = []
        
        # Performance issues that could indicate safety problems
        if feedback.performance_rating <= 2:
            safety_concerns.append("Low performance rating")
        
        if feedback.power_delivery == 'HARSH':
            safety_concerns.append("Harsh power delivery reported")
        
        if feedback.throttle_response == 'WORSE':
            safety_concerns.append("Worsened throttle response")
        
        # Installation difficulty issues
        if feedback.installation_difficulty >= 4:
            safety_concerns.append("High installation difficulty")
        
        # Explicit issue reporting
        if feedback.any_issues and feedback.issue_description:
            issue_text = feedback.issue_description.lower()
            
            # Safety-related keywords
            safety_keywords = [
                'knock', 'ping', 'detonation',
                'stall', 'stalling', 'rough idle',
                'jerky', 'harsh', 'violent',
                'dangerous', 'scary', 'unsafe',
                'overheat', 'overheating',
                'misfire', 'misfiring',
                'lean', 'rich', 'afr',
                'backfire', 'pop', 'flame'
            ]
            
            detected_keywords = [keyword for keyword in safety_keywords if keyword in issue_text]
            if detected_keywords:
                safety_concerns.append(f"Safety keywords detected: {', '.join(detected_keywords)}")
        
        # Non-recommendation is a red flag
        if not feedback.would_recommend:
            safety_concerns.append("User would not recommend this tune")
        
        return safety_concerns
    
    def _flag_safety_concerns(self, tune_submission, feedback, safety_concerns: list):
        """Flag tune for safety audit based on user feedback"""
        
        # Create safety audit record
        SafetyAudit.objects.create(
            tune=tune_submission,
            auditor=feedback.user,
            audit_type='SAFETY_CONCERN',
            recommendations=f"Safety concerns from user feedback:\n" + "\n".join([
                f"- {concern}" for concern in safety_concerns
            ]) + f"\n\nUser feedback: {feedback.issue_description}",
            action_taken='APPROVED'  # Will be updated by reviewer
        )
        
        # If multiple serious concerns, consider suspending tune
        serious_concerns = [c for c in safety_concerns if any(keyword in c.lower() for keyword in ['dangerous', 'unsafe', 'knock', 'stall'])]
        if len(serious_concerns) >= 2:
            logger.critical(f"Multiple serious safety concerns for tune {tune_submission.id}: {serious_concerns}")
            # In production: could automatically suspend tune pending review
        
        logger.warning(f"Safety concerns flagged for tune {tune_submission.id}: {safety_concerns}")


class SafetyAuditView(APIView):
    """Layer 8: Ongoing Quality Assurance - Safety audit management"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get safety audit dashboard"""
        
        if not self._is_safety_auditor(request.user):
            return Response({
                'error': '🚫 Safety auditor permissions required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get pending safety audits
        pending_audits = SafetyAudit.objects.filter(
            action_taken='APPROVED'  # This is the default, meaning "pending review"
        ).select_related('tune', 'auditor').order_by('-created_at')
        
        audit_queue = []
        for audit in pending_audits[:20]:
            audit_queue.append({
                'id': audit.id,
                'tune_id': audit.tune.id,
                'tune_name': audit.tune.name,
                'audit_type': audit.audit_type,
                'auditor': audit.auditor.username,
                'created_at': audit.created_at,
                'recommendations': audit.recommendations,
                'urgency': self._calculate_audit_urgency(audit)
            })
        
        # Get audit statistics
        audit_stats = self._get_audit_statistics()
        
        return Response({
            'pending_audits': len(audit_queue),
            'audit_queue': audit_queue,
            'audit_statistics': audit_stats,
            'audit_types': {
                'ROUTINE': 'Routine periodic audit',
                'COMPLAINT': 'Complaint-triggered audit',
                'SAFETY_CONCERN': 'Safety concern review',
                'PERFORMANCE_REVIEW': 'Performance review'
            }
        })
    
    def post(self, request, audit_id):
        """Process safety audit decision"""
        
        if not self._is_safety_auditor(request.user):
            return Response({
                'error': '🚫 Safety auditor permissions required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            audit = get_object_or_404(SafetyAudit, id=audit_id)
            
            action = request.data.get('action')  # 'APPROVED', 'MINOR_UPDATE', 'MAJOR_REVISION', 'SUSPENDED', 'REVOKED'
            notes = request.data.get('notes', '')
            
            valid_actions = ['APPROVED', 'MINOR_UPDATE', 'MAJOR_REVISION', 'SUSPENDED', 'REVOKED']
            if action not in valid_actions:
                return Response({
                    'error': f'Invalid action. Must be one of: {", ".join(valid_actions)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update audit record
            audit.action_taken = action
            audit.recommendations += f"\n\nAudit Decision ({timezone.now().strftime('%Y-%m-%d')}):\n{notes}"
            audit.save()
            
            # Take action on the tune
            self._execute_audit_action(audit.tune, action, notes, request.user)
            
            action_messages = {
                'APPROVED': '✅ Tune safety confirmed - no action needed',
                'MINOR_UPDATE': '🔧 Minor safety update recommended',
                'MAJOR_REVISION': '⚠️ Major revision required',
                'SUSPENDED': '⏸️ Tune temporarily suspended',
                'REVOKED': '🚫 Tune permanently revoked'
            }
            
            return Response({
                'message': action_messages[action],
                'audit_id': audit_id,
                'action': action,
                'tune_id': audit.tune.id
            })
            
        except Exception as e:
            logger.error(f"Error processing safety audit: {str(e)}")
            return Response({
                'error': 'Audit processing failed',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _is_safety_auditor(self, user) -> bool:
        """Check if user has safety auditor permissions"""
        return (user.is_staff or 
                user.groups.filter(name='safety_auditors').exists() or
                user.groups.filter(name='tune_reviewers').exists())
    
    def _calculate_audit_urgency(self, audit) -> str:
        """Calculate audit urgency level"""
        
        urgency_score = 0
        
        # Safety concern audits are high priority
        if audit.audit_type == 'SAFETY_CONCERN':
            urgency_score += 3
        
        # Check for dangerous keywords in recommendations
        dangerous_keywords = ['dangerous', 'unsafe', 'critical', 'emergency', 'knock', 'stall']
        if any(keyword in audit.recommendations.lower() for keyword in dangerous_keywords):
            urgency_score += 2
        
        # Time factor
        days_old = (timezone.now() - audit.created_at).days
        if days_old >= 7:
            urgency_score += 1
        
        # Tune safety score factor
        if audit.tune.ai_safety_score and audit.tune.ai_safety_score < 60:
            urgency_score += 1
        
        if urgency_score >= 4:
            return 'CRITICAL'
        elif urgency_score >= 2:
            return 'HIGH'
        else:
            return 'NORMAL'
    
    def _get_audit_statistics(self) -> dict:
        """Get comprehensive audit statistics"""
        
        total_audits = SafetyAudit.objects.count()
        
        # Audit outcomes
        outcomes = SafetyAudit.objects.values('action_taken').annotate(count=Count('id'))
        outcome_stats = {outcome['action_taken']: outcome['count'] for outcome in outcomes}
        
        # Recent audit activity (last 30 days)
        recent_cutoff = timezone.now() - timezone.timedelta(days=30)
        recent_audits = SafetyAudit.objects.filter(created_at__gte=recent_cutoff).count()
        
        return {
            'total_audits': total_audits,
            'recent_activity': recent_audits,
            'outcome_distribution': outcome_stats,
            'safety_incident_rate': (outcome_stats.get('REVOKED', 0) / total_audits * 100) if total_audits > 0 else 0
        }
    
    def _execute_audit_action(self, tune_submission, action: str, notes: str, auditor):
        """Execute the audit decision on the tune"""
        
        if action == 'SUSPENDED':
            # Temporarily suspend tune (in production, remove from marketplace)
            tune_submission.is_revoked = True
            tune_submission.revocation_reason = f"Temporary suspension: {notes}"
            
        elif action == 'REVOKED':
            # Permanently revoke tune
            tune_submission.is_revoked = True
            tune_submission.review_status = 'REJECTED'
            tune_submission.revocation_reason = f"Permanently revoked: {notes}"
            
        elif action in ['MINOR_UPDATE', 'MAJOR_REVISION']:
            # Mark for revision
            tune_submission.review_status = 'REVISION_REQUESTED'
            tune_submission.review_notes += f"\n\nAudit requires {action.lower()}: {notes}"
        
        # Update last audit date
        tune_submission.last_audit_date = timezone.now()
        tune_submission.save()
        
        logger.info(f"Audit action '{action}' executed on tune {tune_submission.id} by {auditor.username}")


# API endpoint for mobile app to get supported file types
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_supported_tune_file_types(request):
    """Get comprehensive motorcycle ECU tuning file types for mobile app"""
    
    return Response({
        'message': '🏍️ Complete motorcycle ECU tuning file format support',
        'supported_formats': {
            'standard_ecu_formats': [
                {
                    'extension': '.bin',
                    'description': 'Binary ECU firmware dump',
                    'details': 'Most standard format - raw binary dump of ECU firmware including tune maps and lookup tables',
                    'common_for': ['Yamaha', 'Honda', 'Kawasaki', 'Suzuki', 'All manufacturers'],
                    'min_size_kb': 16,
                    'typical_size': '64KB - 2MB'
                },
                {
                    'extension': '.hex',
                    'description': 'Intel HEX format',
                    'details': 'Text-based hexadecimal representation of binary data',
                    'common_for': ['Development tools', 'Custom tuning software'],
                    'min_size_kb': 2,
                    'typical_size': '4KB - 500KB'
                },
                {
                    'extension': '.rom',
                    'description': 'ROM dump format',
                    'details': 'Direct ROM memory dump from ECU',
                    'common_for': ['Low-level ECU access', 'Chip-level programming'],
                    'min_size_kb': 16,
                    'typical_size': '32KB - 1MB'
                }
            ],
            'proprietary_extensions': [
                {
                    'extension': '.cod',
                    'description': 'Code/Calibration file',
                    'details': 'Same binary data as .bin, alternate extension used by some tools',
                    'common_for': ['Proprietary tuning software'],
                    'min_size_kb': 1,
                    'typical_size': '16KB - 512KB'
                },
                {
                    'extension': '.dtf',
                    'description': 'Data Transfer File',
                    'details': 'Data transfer format for ECU calibration',
                    'common_for': ['Professional tuning tools'],
                    'min_size_kb': 1,
                    'typical_size': '8KB - 256KB'
                },
                {
                    'extension': '.map',
                    'description': 'Map file with lookup tables',
                    'details': 'Contains calibration maps and lookup tables',
                    'common_for': ['Tuning software', 'Map editors'],
                    'min_size_kb': 1,
                    'typical_size': '4KB - 128KB'
                },
                {
                    'extension': '.cal',
                    'description': 'Calibration file',
                    'details': 'ECU calibration data and parameters',
                    'common_for': ['Professional calibration tools'],
                    'min_size_kb': 1,
                    'typical_size': '2KB - 64KB'
                }
            ],
            'bdm_format': [
                {
                    'extension': '.bdm',
                    'description': 'Background Debug Mode dump',
                    'details': 'Binary dumps captured through direct chip access using BDM for advanced or protected ECU units',
                    'common_for': ['Protected ECUs', 'Advanced tuning', 'Chip-level access'],
                    'min_size_kb': 8,
                    'typical_size': '32KB - 1MB',
                    'note': 'Requires specialized BDM tools and expertise'
                }
            ],
            'manufacturer_specific': [
                {
                    'extension': '.kef',
                    'description': 'Kawasaki ECU format',
                    'details': 'Kawasaki-specific ECU tuning format',
                    'common_for': ['Kawasaki motorcycles'],
                    'min_size_kb': 1,
                    'typical_size': '16KB - 256KB'
                },
                {
                    'extension': '.ols',
                    'description': 'OpenECU format',
                    'details': 'Open-source ECU tuning format',
                    'common_for': ['OpenECU systems', 'Custom ECUs'],
                    'min_size_kb': 1,
                    'typical_size': '8KB - 128KB'
                },
                {
                    'extension': '.s19',
                    'description': 'Motorola S-record format',
                    'details': 'Motorola S-record hex format for embedded systems',
                    'common_for': ['Motorola-based ECUs', 'Embedded systems'],
                    'min_size_kb': 2,
                    'typical_size': '8KB - 512KB'
                }
            ],
            'tuning_tool_containers': [
                {
                    'extension': '.pcv',
                    'description': 'Power Commander file',
                    'details': 'Dynojet Power Commander map file - wrapper around core tune data',
                    'common_for': ['Power Commander V', 'Dynojet tools'],
                    'min_size_kb': 1,
                    'typical_size': '2KB - 32KB'
                },
                {
                    'extension': '.fmi',
                    'description': 'FTECU map import',
                    'details': 'FTECU (Flash Tune ECU) container format',
                    'common_for': ['FTECU software', 'Flash tuning'],
                    'min_size_kb': 1,
                    'typical_size': '4KB - 64KB'
                },
                {
                    'extension': '.wrf',
                    'description': 'Woolich Racing format',
                    'details': 'Woolich Racing Tuned container format',
                    'common_for': ['Woolich Racing Tuned software'],
                    'min_size_kb': 1,
                    'typical_size': '8KB - 128KB'
                },
                {
                    'extension': '.tec',
                    'description': 'TuneECU container',
                    'details': 'TuneECU software container with metadata',
                    'common_for': ['TuneECU software', 'Triumph motorcycles'],
                    'min_size_kb': 1,
                    'typical_size': '4KB - 64KB'
                },
                {
                    'extension': '.dyno',
                    'description': 'Dynojet format',
                    'details': 'Dynojet tuning system format',
                    'common_for': ['Dynojet systems', 'Professional tuning'],
                    'min_size_kb': 1,
                    'typical_size': '2KB - 32KB'
                }
            ]
        },
        'total_formats_supported': 20,
        'upload_requirements': {
            'compatibility_info': [
                'Exact motorcycle make, model, and year',
                'Engine type (e.g., 600cc Inline-4, 1000cc V-Twin)',
                'ECU type (e.g., Yamaha ECU, Bosch ME7)',
                'Tune type (ECU_FLASH, PIGGYBACK, MAP, FULL_SYSTEM)'
            ],
            'creator_verification': 'BASIC level minimum (PROFESSIONAL/EXPERT/PARTNER preferred)',
            'modification_disclosure': [
                'Required exhaust system (if any)',
                'Required air filter modifications (if any)', 
                'Required fuel system modifications (if any)',
                'Other required hardware modifications'
            ],
            'safety_validation': 'All uploads go through comprehensive T-CLOCS safety validation'
        },
        'file_constraints': {
            'max_file_size': '50MB',
            'minimum_sizes': {
                'binary_files': '16KB (.bin, .bdm, .rom)',
                'hex_files': '2KB (.hex, .s19)',
                'map_files': '1KB (.map, .cal, .cod)',
                'container_files': '1KB (.pcv, .fmi, .wrf, .tec)'
            }
        },
        'safety_analysis': {
            'binary_parsing': 'Raw hex table extraction for AFR and timing analysis',
            'format_validation': 'ECU-specific format verification',
            'security_scanning': 'Malware and executable detection',
            'manufacturer_detection': 'Automatic ECU manufacturer identification',
            'integrity_verification': 'File corruption and completeness checks'
        },
        'workflow_compatibility': {
            'commercial_tools': [
                'TuneECU', 'Woolich Racing Tuned', 'FTECU', 'Power Commander',
                'EcuTek', 'Hondata', 'Cobb Tuning', 'Dynojet'
            ],
            'diy_workflows': [
                'Direct ECU dump via OBD', 'BDM chip reading', 
                'Custom tuning software', 'Open-source tools'
            ],
            'professional_systems': [
                'Dyno tuning', 'Professional calibration tools',
                'Manufacturer diagnostic tools', 'Race team systems'
            ]
        },
        'safety_note': '🛡️ Every upload is validated through our comprehensive T-CLOCS safety system',
        'help': {
            'unsupported_format': 'Contact support if your ECU tuning tool uses a different format',
            'file_too_small': 'Ensure you are uploading the complete ECU tune file, not a partial or configuration file',
            'format_detection': 'Our system automatically detects and validates ECU-specific file formats'
        }
    })

# Enhanced binary parsing service for safety analysis
class ECUBinaryParser:
    """Enhanced binary parser for motorcycle ECU files"""
    
    def __init__(self):
        self.supported_formats = ['.bin', '.bdm', '.rom', '.hex', '.map']
    
    def parse_ecu_file(self, file_path: str, file_ext: str) -> dict:
        """Parse ECU file and extract safety-relevant data"""
        
        try:
            parsing_result = {
                'file_format': file_ext,
                'file_size': 0,
                'parsing_success': False,
                'ecu_metadata': {},
                'safety_data': {},
                'calibration_tables': {},
                'warnings': []
            }
            
            if not file_path or not os.path.exists(file_path):
                parsing_result['warnings'].append("File not found for parsing")
                return parsing_result
            
            # Get file info
            parsing_result['file_size'] = os.path.getsize(file_path)
            
            # Parse based on file format
            if file_ext in ['.bin', '.bdm', '.rom']:
                return self._parse_binary_ecu_file(file_path, parsing_result)
            elif file_ext == '.hex':
                return self._parse_hex_ecu_file(file_path, parsing_result)
            elif file_ext == '.map':
                return self._parse_map_file(file_path, parsing_result)
            else:
                parsing_result['warnings'].append(f"Parsing not yet implemented for {file_ext}")
                return parsing_result
                
        except Exception as e:
            logger.error(f"ECU file parsing error: {str(e)}")
            return {
                'parsing_success': False,
                'error': str(e),
                'warnings': ['Parsing failed due to file corruption or unsupported format']
            }
    
    def _parse_binary_ecu_file(self, file_path: str, result: dict) -> dict:
        """Parse binary ECU files (.bin, .bdm, .rom)"""
        
        try:
            with open(file_path, 'rb') as f:
                # Read file in chunks to analyze structure
                header = f.read(1024)  # First 1KB
                f.seek(-1024, 2)  # Last 1KB
                footer = f.read(1024)
                
                # Reset and read sample data from middle
                f.seek(result['file_size'] // 2)
                middle_sample = f.read(1024)
            
            # Detect ECU manufacturer from header
            result['ecu_metadata'] = self._detect_ecu_manufacturer(header)
            
            # Analyze binary structure for calibration data
            result['calibration_tables'] = self._analyze_binary_calibration_structure(header, middle_sample, footer)
            
            # Extract safety-relevant data patterns
            result['safety_data'] = self._extract_safety_patterns_from_binary(header, middle_sample)
            
            result['parsing_success'] = True
            
        except Exception as e:
            result['warnings'].append(f"Binary parsing error: {str(e)}")
        
        return result
    
    def _parse_hex_ecu_file(self, file_path: str, result: dict) -> dict:
        """Parse Intel HEX format ECU files"""
        
        try:
            with open(file_path, 'r', encoding='ascii', errors='ignore') as f:
                lines = f.readlines()[:100]  # Sample first 100 lines
            
            # Validate HEX format
            valid_records = 0
            total_bytes = 0
            
            for line in lines:
                line = line.strip()
                if line.startswith(':'):
                    try:
                        # Parse HEX record
                        byte_count = int(line[1:3], 16)
                        address = int(line[3:7], 16) 
                        record_type = int(line[7:9], 16)
                        
                        valid_records += 1
                        total_bytes += byte_count
                        
                    except ValueError:
                        result['warnings'].append(f"Invalid HEX record format: {line[:20]}...")
            
            result['ecu_metadata']['hex_records_analyzed'] = valid_records
            result['ecu_metadata']['estimated_data_size'] = total_bytes
            result['parsing_success'] = valid_records > 0
            
        except Exception as e:
            result['warnings'].append(f"HEX parsing error: {str(e)}")
        
        return result
    
    def _parse_map_file(self, file_path: str, result: dict) -> dict:
        """Parse MAP calibration files"""
        
        try:
            with open(file_path, 'r', encoding='ascii', errors='ignore') as f:
                content = f.read(8192)  # Read first 8KB
            
            # Look for calibration table indicators
            calibration_indicators = {
                'fuel_maps': ['fuel', 'afr', 'lambda', 'injection'],
                'ignition_maps': ['ignition', 'timing', 'advance', 'spark'],
                'boost_maps': ['boost', 'pressure', 'turbo', 'wastegate'],
                'rev_limiters': ['rev', 'limit', 'rpm', 'cutoff']
            }
            
            found_tables = {}
            content_lower = content.lower()
            
            for table_type, keywords in calibration_indicators.items():
                if any(keyword in content_lower for keyword in keywords):
                    found_tables[table_type] = True
            
            result['calibration_tables']['detected_types'] = found_tables
            result['calibration_tables']['total_detected'] = len(found_tables)
            
            # Extract numerical values for safety analysis
            import re
            numbers = re.findall(r'-?\d+\.?\d*', content)
            if numbers:
                result['safety_data']['numerical_values_found'] = len(numbers)
                result['safety_data']['value_range'] = {
                    'min': min(float(x) for x in numbers[:100] if self._is_number(x)),
                    'max': max(float(x) for x in numbers[:100] if self._is_number(x))
                }
            
            result['parsing_success'] = len(found_tables) > 0
            
        except Exception as e:
            result['warnings'].append(f"MAP parsing error: {str(e)}")
        
        return result
    
    def _detect_ecu_manufacturer(self, header: bytes) -> dict:
        """Detect ECU manufacturer from binary header"""
        
        manufacturer_signatures = {
            b'BOSCH': 'Bosch',
            b'DENSO': 'Denso', 
            b'YAMAHA': 'Yamaha',
            b'HONDA': 'Honda',
            b'KAWASAKI': 'Kawasaki',
            b'SUZUKI': 'Suzuki',
            b'BMW': 'BMW',
            b'DUCATI': 'Ducati',
            b'KTM': 'KTM',
            b'APRILIA': 'Aprilia'
        }
        
        header_upper = header.upper()
        detected_manufacturers = []
        
        for signature, manufacturer in manufacturer_signatures.items():
            if signature in header_upper:
                detected_manufacturers.append(manufacturer)
        
        return {
            'detected_manufacturers': detected_manufacturers,
            'primary_manufacturer': detected_manufacturers[0] if detected_manufacturers else 'Unknown',
            'confidence': 'High' if detected_manufacturers else 'Low'
        }
    
    def _analyze_binary_calibration_structure(self, header: bytes, middle: bytes, footer: bytes) -> dict:
        """Analyze binary structure for calibration table patterns"""
        
        calibration_analysis = {
            'potential_tables_detected': 0,
            'data_patterns': [],
            'structure_type': 'Unknown'
        }
        
        # Look for repetitive patterns that might indicate lookup tables
        for sample_name, sample_data in [('header', header), ('middle', middle), ('footer', footer)]:
            # Check for table-like patterns
            if self._has_table_patterns(sample_data):
                calibration_analysis['potential_tables_detected'] += 1
                calibration_analysis['data_patterns'].append(f"Table pattern in {sample_name}")
        
        # Analyze data distribution
        if header and middle and footer:
            entropy_header = self._calculate_entropy(header)
            entropy_middle = self._calculate_entropy(middle)
            
            if entropy_header > 0.5 and entropy_middle > 0.5:
                calibration_analysis['structure_type'] = 'Complex calibration data'
            elif entropy_header < 0.3:
                calibration_analysis['structure_type'] = 'Simple or sparse data'
        
        return calibration_analysis
    
    def _extract_safety_patterns_from_binary(self, header: bytes, middle: bytes) -> dict:
        """Extract safety-relevant patterns from binary data"""
        
        safety_patterns = {
            'potential_afr_tables': False,
            'potential_timing_tables': False,
            'rev_limiter_patterns': False,
            'safety_score_factors': []
        }
        
        combined_data = header + middle
        
        # Look for patterns that might indicate AFR tables (common value ranges)
        afr_like_values = self._find_afr_like_patterns(combined_data)
        if afr_like_values:
            safety_patterns['potential_afr_tables'] = True
            safety_patterns['safety_score_factors'].append('AFR table patterns detected')
        
        # Look for timing advance patterns (typically 0-40 degrees)
        timing_like_values = self._find_timing_like_patterns(combined_data)
        if timing_like_values:
            safety_patterns['potential_timing_tables'] = True
            safety_patterns['safety_score_factors'].append('Timing table patterns detected')
        
        # Look for rev limiter patterns (high RPM values)
        rev_patterns = self._find_rev_limiter_patterns(combined_data)
        if rev_patterns:
            safety_patterns['rev_limiter_patterns'] = True
            safety_patterns['safety_score_factors'].append('Rev limiter patterns detected')
        
        return safety_patterns
    
    def _has_table_patterns(self, data: bytes) -> bool:
        """Check if binary data has table-like patterns"""
        
        if len(data) < 64:
            return False
        
        # Look for repetitive structures (could indicate lookup tables)
        chunk_size = 16
        chunks = [data[i:i+chunk_size] for i in range(0, min(len(data), 256), chunk_size)]
        
        # Check for similar chunk structures
        similar_chunks = 0
        for i in range(len(chunks)):
            for j in range(i+1, len(chunks)):
                if self._chunks_similar(chunks[i], chunks[j]):
                    similar_chunks += 1
        
        return similar_chunks > 2
    
    def _chunks_similar(self, chunk1: bytes, chunk2: bytes, threshold: float = 0.7) -> bool:
        """Check if two binary chunks are similar"""
        
        if len(chunk1) != len(chunk2):
            return False
        
        matches = sum(1 for a, b in zip(chunk1, chunk2) if a == b)
        similarity = matches / len(chunk1)
        return similarity >= threshold
    
    def _calculate_entropy(self, data: bytes) -> float:
        """Calculate entropy of binary data"""
        
        if not data:
            return 0.0
        
        # Count byte frequencies
        frequencies = {}
        for byte in data:
            frequencies[byte] = frequencies.get(byte, 0) + 1
        
        # Calculate entropy
        entropy = 0.0
        data_len = len(data)
        
        for freq in frequencies.values():
            probability = freq / data_len
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        return entropy / 8.0  # Normalize to 0-1 range
    
    def _find_afr_like_patterns(self, data: bytes) -> bool:
        """Look for AFR-like value patterns in binary data"""
        
        # AFR values typically range from 10.0 to 18.0
        # Look for patterns that might represent these values
        for i in range(len(data) - 1):
            # Check for 16-bit values that could represent AFR * 100
            value = (data[i] << 8) | data[i+1]
            if 1000 <= value <= 1800:  # 10.00 to 18.00 AFR
                return True
        
        return False
    
    def _find_timing_like_patterns(self, data: bytes) -> bool:
        """Look for timing advance patterns in binary data"""
        
        # Timing advance typically 0-40 degrees
        # Look for byte values in this range with some structure
        timing_like_count = 0
        
        for byte in data:
            if 0 <= byte <= 40:
                timing_like_count += 1
        
        # If more than 10% of bytes are in timing range, might be timing table
        return timing_like_count > len(data) * 0.1
    
    def _find_rev_limiter_patterns(self, data: bytes) -> bool:
        """Look for rev limiter patterns (high RPM values)"""
        
        # Rev limiters typically 8000-15000 RPM
        # Look for 16-bit values in this range
        for i in range(len(data) - 1):
            value = (data[i] << 8) | data[i+1]
            if 8000 <= value <= 15000:
                return True
        
        return False
    
    def _is_number(self, s: str) -> bool:
        """Check if string represents a number"""
        try:
            float(s)
            return True
        except ValueError:
            return False

# Import at module level for use in safety analysis
import math
import os 