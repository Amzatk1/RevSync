from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.http import JsonResponse
from typing import Dict, List

from .models import (
    SafetyProfile, TuneValidation, FlashSession, 
    UserSafetyConsent, SafetyIncident, SafetyAuditLog
)
from .services import (
    ComprehensiveTuneValidator, SafeFlashService, SafetyConsentService
)
from .serializers import (
    SafetyProfileSerializer, TuneValidationSerializer, FlashSessionSerializer,
    SafetyConsentSerializer, SafetyIncidentSerializer, ValidationResultSerializer
)
from tunes.models import TuneFile
from motorcycles.models import Motorcycle
from marketplace.models import TunePurchase


class SafetyProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for safety profiles"""
    
    queryset = SafetyProfile.objects.all()
    serializer_class = SafetyProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get safety profile by bike category"""
        category = request.query_params.get('category')
        if not category:
            return Response(
                {'error': 'Category parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = SafetyProfile.objects.get(category=category)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except SafetyProfile.DoesNotExist:
            return Response(
                {'error': f'No safety profile found for category: {category}'},
                status=status.HTTP_404_NOT_FOUND
            )


class TuneValidationView(APIView):
    """API for comprehensive tune validation"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Validate a tune file with comprehensive safety checks"""
        tune_id = request.data.get('tune_id')
        bike_category = request.data.get('bike_category', 'SPORT')
        force_revalidate = request.data.get('force_revalidate', False)
        
        if not tune_id:
            return Response(
                {'error': 'tune_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tune_file = TuneFile.objects.get(id=tune_id)
        except TuneFile.DoesNotExist:
            return Response(
                {'error': 'Tune file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if validation already exists and is valid
        if not force_revalidate:
            existing_validation = TuneValidation.objects.filter(
                tune_file=tune_file,
                status='PASSED'
            ).first()
            
            if existing_validation and not self._validation_expired(existing_validation):
                serializer = TuneValidationSerializer(existing_validation)
                return Response({
                    'validation': serializer.data,
                    'cached': True
                })
        
        # Get safety profile
        try:
            safety_profile = SafetyProfile.objects.get(category=bike_category)
        except SafetyProfile.DoesNotExist:
            return Response(
                {'error': f'Safety profile not found for category: {bike_category}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Perform validation
        validator = ComprehensiveTuneValidator()
        
        # In real implementation, this would read the actual tune file
        tune_file_data = b"mock_tune_data"  # Placeholder
        tune_metadata = {
            'checksum': 'mock_checksum',
            'max_rpm': 14000,
            'afr_map': [12.5, 13.0, 13.2, 12.8],
            'ignition_map': [30, 32, 28, 35],
            'boost_pressure': 12.0,
            'temperature_limits': {
                'coolant_temp': 105,
                'egt_temp': 850
            },
            'ecu_info': {'type': 'bosch_me17'},
            'required_ecu_types': ['bosch_me17', 'denso_ecu'],
            'expected_file_size': 1024 * 512,
            'performance_gains': {
                'horsepower_gain': 25,
                'torque_gain': 20
            },
            'track_only': False,
            'expert_tune': False
        }
        
        validation_result = validator.validate_tune(
            tune_file_data, tune_metadata, bike_category
        )
        
        # Create validation record
        validation = TuneValidation.objects.create(
            tune_file=tune_file,
            safety_profile=safety_profile,
            validator=request.user,
            validation_level='STANDARD',
            status='PASSED' if validation_result.is_safe else 'FAILED',
            risk_level=validation_result.risk_level,
            checksum_valid=validation_result.checksum_valid,
            parameter_check_passed=validation_result.parameter_check_passed,
            validation_data=validation_result.validation_data,
            safety_violations=validation_result.violations,
            warnings=validation_result.warnings
        )
        
        # Log validation
        SafetyAuditLog.objects.create(
            user=request.user,
            action_type='TUNE_VALIDATION',
            description=f'Tune validation performed for {tune_file.name}',
            tune_file=tune_file,
            metadata={
                'validation_id': str(validation.id),
                'risk_level': validation_result.risk_level,
                'violations_count': len(validation_result.violations),
                'warnings_count': len(validation_result.warnings)
            }
        )
        
        serializer = TuneValidationSerializer(validation)
        return Response({
            'validation': serializer.data,
            'result': ValidationResultSerializer(validation_result).data,
            'cached': False
        })
    
    def _validation_expired(self, validation: TuneValidation) -> bool:
        """Check if validation has expired"""
        if not validation.expires_at:
            return False
        return validation.expires_at < timezone.now()


class FlashSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing flash sessions"""
    
    serializer_class = FlashSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return FlashSession.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Initiate a new flash session"""
        tune_id = request.data.get('tune_id')
        motorcycle_id = request.data.get('motorcycle_id')
        purchase_id = request.data.get('purchase_id')
        
        if not tune_id or not motorcycle_id:
            return Response(
                {'error': 'tune_id and motorcycle_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tune_file = TuneFile.objects.get(id=tune_id)
            motorcycle = Motorcycle.objects.get(id=motorcycle_id, user=request.user)
            purchase = None
            
            if purchase_id:
                purchase = TunePurchase.objects.get(
                    id=purchase_id, 
                    user=request.user,
                    listing__tune_file=tune_file
                )
        except (TuneFile.DoesNotExist, Motorcycle.DoesNotExist, TunePurchase.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Initialize flash service
        flash_service = SafeFlashService()
        
        try:
            session = flash_service.initiate_flash_session(
                user=request.user,
                motorcycle=motorcycle,
                tune_file=tune_file,
                purchase=purchase
            )
            
            serializer = self.get_serializer(session)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to initiate flash session: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update flash session progress"""
        session = self.get_object()
        stage = request.data.get('stage')
        progress = request.data.get('progress')
        data = request.data.get('data', {})
        
        if not stage:
            return Response(
                {'error': 'stage is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        flash_service = SafeFlashService()
        flash_service.update_flash_progress(session, stage, progress, data)
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_backup(self, request, pk=None):
        """Create ECU backup for flash session"""
        session = self.get_object()
        
        # In real implementation, this would receive backup data
        backup_data = b"mock_backup_data"  # Placeholder
        
        flash_service = SafeFlashService()
        success = flash_service.create_backup(session, backup_data)
        
        if success:
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Failed to create backup'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def validate_pre_flash(self, request, pk=None):
        """Perform comprehensive pre-flash validation"""
        session = self.get_object()
        
        flash_service = SafeFlashService()
        validation_result = flash_service.validate_pre_flash(session)
        
        return Response(validation_result)
    
    @action(detail=True, methods=['post'])
    def emergency_stop(self, request, pk=None):
        """Emergency stop flash process"""
        session = self.get_object()
        error_message = request.data.get('error_message', 'Emergency stop requested by user')
        
        flash_service = SafeFlashService()
        flash_service.handle_flash_failure(session, error_message)
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restore_backup(self, request, pk=None):
        """Restore ECU from backup"""
        session = self.get_object()
        
        flash_service = SafeFlashService()
        success = flash_service.restore_backup(session)
        
        if success:
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Failed to restore backup'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SafetyConsentView(APIView):
    """API for managing user safety consents"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get required consents for a tune/bike combination"""
        tune_id = request.query_params.get('tune_id')
        motorcycle_id = request.query_params.get('motorcycle_id')
        
        if not tune_id or not motorcycle_id:
            return Response(
                {'error': 'tune_id and motorcycle_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tune_file = TuneFile.objects.get(id=tune_id)
            motorcycle = Motorcycle.objects.get(id=motorcycle_id, user=request.user)
        except (TuneFile.DoesNotExist, Motorcycle.DoesNotExist):
            return Response(
                {'error': 'Tune file or motorcycle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        consent_service = SafetyConsentService()
        required_consents = consent_service.get_required_consents(tune_file, motorcycle)
        consent_status = consent_service.check_consents(request.user, required_consents)
        
        return Response({
            'required_consents': required_consents,
            'granted_consents': [
                consent.consent_type 
                for consent in UserSafetyConsent.objects.filter(
                    user=request.user,
                    consent_type__in=required_consents,
                    revoked_at__isnull=True
                )
            ],
            'consent_status': consent_status,
            'consent_texts': {
                consent_type: SafetyConsentService.CONSENT_TEXTS.get(consent_type, '')
                for consent_type in required_consents
            }
        })
    
    def post(self, request):
        """Grant user consent"""
        consent_type = request.data.get('consent_type')
        tune_id = request.data.get('tune_id')
        motorcycle_id = request.data.get('motorcycle_id')
        flash_session_id = request.data.get('flash_session_id')
        
        if not consent_type:
            return Response(
                {'error': 'consent_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional related objects
        tune_file = None
        motorcycle = None
        flash_session = None
        
        if tune_id:
            try:
                tune_file = TuneFile.objects.get(id=tune_id)
            except TuneFile.DoesNotExist:
                pass
        
        if motorcycle_id:
            try:
                motorcycle = Motorcycle.objects.get(id=motorcycle_id, user=request.user)
            except Motorcycle.DoesNotExist:
                pass
        
        if flash_session_id:
            try:
                flash_session = FlashSession.objects.get(
                    id=flash_session_id, 
                    user=request.user
                )
            except FlashSession.DoesNotExist:
                pass
        
        # Get client information
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        consent_service = SafetyConsentService()
        
        try:
            consent = consent_service.record_consent(
                user=request.user,
                consent_type=consent_type,
                ip_address=ip_address,
                user_agent=user_agent,
                motorcycle=motorcycle,
                tune_file=tune_file,
                flash_session=flash_session
            )
            
            serializer = SafetyConsentSerializer(consent)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to record consent: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SafetyIncidentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing safety incidents"""
    
    serializer_class = SafetyIncidentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return SafetyIncident.objects.all()
        return SafetyIncident.objects.filter(reporter=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
        
        # Log incident creation
        SafetyAuditLog.objects.create(
            user=self.request.user,
            action_type='INCIDENT_REPORTED',
            description=f'Safety incident reported: {serializer.instance.title}',
            metadata={
                'incident_id': str(serializer.instance.id),
                'incident_type': serializer.instance.incident_type,
                'severity': serializer.instance.severity
            }
        )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def investigate(self, request, pk=None):
        """Mark incident as investigated (admin only)"""
        incident = self.get_object()
        
        resolution_notes = request.data.get('resolution_notes', '')
        preventive_measures = request.data.get('preventive_measures', '')
        tune_action = request.data.get('tune_action')  # 'flag' or 'suspend'
        
        incident.investigated_by = request.user
        incident.resolution_notes = resolution_notes
        incident.preventive_measures = preventive_measures
        incident.resolved_at = timezone.now()
        
        if tune_action == 'flag' and incident.tune_file:
            incident.tune_flagged = True
        elif tune_action == 'suspend' and incident.tune_file:
            incident.tune_suspended = True
        
        incident.save()
        
        # Log investigation
        SafetyAuditLog.objects.create(
            user=request.user,
            action_type='EXPERT_REVIEW',
            description=f'Safety incident investigated: {incident.title}',
            metadata={
                'incident_id': str(incident.id),
                'tune_action': tune_action,
                'resolved': True
            }
        )
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)


class SafetyAuditView(APIView):
    """API for safety audit logs"""
    
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        """Get safety audit logs with filtering"""
        action_type = request.query_params.get('action_type')
        user_id = request.query_params.get('user_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = SafetyAuditLog.objects.all()
        
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # Pagination
        page_size = min(int(request.query_params.get('page_size', 50)), 100)
        page = int(request.query_params.get('page', 1))
        
        total_count = queryset.count()
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        logs = queryset[start_index:end_index]
        
        return Response({
            'logs': [
                {
                    'id': str(log.id),
                    'user': log.user.username if log.user else None,
                    'action_type': log.action_type,
                    'description': log.description,
                    'metadata': log.metadata,
                    'timestamp': log.timestamp.isoformat(),
                    'ip_address': log.ip_address,
                }
                for log in logs
            ],
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': (total_count + page_size - 1) // page_size,
            }
        })


class SafetyDashboardView(APIView):
    """Safety dashboard with key metrics and alerts"""
    
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        """Get safety dashboard data"""
        # Time range for metrics
        from datetime import datetime, timedelta
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Flash session metrics
        total_flash_sessions = FlashSession.objects.count()
        recent_flash_sessions = FlashSession.objects.filter(
            started_at__gte=week_ago
        ).count()
        failed_flash_sessions = FlashSession.objects.filter(
            current_stage='FAILED',
            started_at__gte=month_ago
        ).count()
        
        # Validation metrics
        total_validations = TuneValidation.objects.count()
        high_risk_tunes = TuneValidation.objects.filter(
            risk_level__in=['HIGH', 'CRITICAL']
        ).count()
        failed_validations = TuneValidation.objects.filter(
            status='FAILED'
        ).count()
        
        # Incident metrics
        total_incidents = SafetyIncident.objects.count()
        recent_incidents = SafetyIncident.objects.filter(
            created_at__gte=week_ago
        ).count()
        critical_incidents = SafetyIncident.objects.filter(
            severity='CRITICAL',
            resolved_at__isnull=True
        ).count()
        
        # Top incident types
        incident_types = SafetyIncident.objects.filter(
            created_at__gte=month_ago
        ).values('incident_type').annotate(
            count=models.Count('id')
        ).order_by('-count')[:5]
        
        # Recent critical events
        critical_events = []
        
        # Critical incidents
        critical_events.extend([
            {
                'type': 'CRITICAL_INCIDENT',
                'title': incident.title,
                'severity': incident.severity,
                'timestamp': incident.created_at.isoformat(),
                'id': str(incident.id)
            }
            for incident in SafetyIncident.objects.filter(
                severity='CRITICAL'
            ).order_by('-created_at')[:10]
        ])
        
        # Failed flash sessions
        critical_events.extend([
            {
                'type': 'FLASH_FAILURE',
                'title': f'Flash failure for {session.tune_file.name}',
                'severity': 'HIGH',
                'timestamp': session.started_at.isoformat(),
                'id': str(session.id)
            }
            for session in FlashSession.objects.filter(
                current_stage='FAILED'
            ).order_by('-started_at')[:10]
        ])
        
        # Sort and limit critical events
        critical_events.sort(key=lambda x: x['timestamp'], reverse=True)
        critical_events = critical_events[:20]
        
        return Response({
            'metrics': {
                'flash_sessions': {
                    'total': total_flash_sessions,
                    'recent': recent_flash_sessions,
                    'failed': failed_flash_sessions,
                },
                'validations': {
                    'total': total_validations,
                    'high_risk': high_risk_tunes,
                    'failed': failed_validations,
                },
                'incidents': {
                    'total': total_incidents,
                    'recent': recent_incidents,
                    'critical': critical_incidents,
                }
            },
            'incident_types': list(incident_types),
            'critical_events': critical_events,
            'generated_at': now.isoformat()
        }) 