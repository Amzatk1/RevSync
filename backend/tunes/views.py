from django.shortcuts import render
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import (
    TuneCategory, TuneType, SafetyRating, TuneCreator, 
    Tune, TuneCompatibility, TuneReview
)
from .serializers import (
    TuneCategorySerializer, TuneTypeSerializer, SafetyRatingSerializer,
    TuneCreatorSerializer, TuneListSerializer, TuneDetailSerializer,
    TuneReviewSerializer
)

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.db import transaction
from django.utils import timezone
from ai.tune_review_service import get_tune_review_service
import logging

logger = logging.getLogger(__name__)

class CreatorVerificationRequired(permissions.BasePermission):
    """
    Custom permission that only allows verified creators to upload tunes
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        try:
            creator_profile = request.user.creator_profile
            return (creator_profile.can_upload_tunes and 
                   creator_profile.verification_level != 'UNVERIFIED')
        except:
            return False

class TuneUploadView(generics.CreateAPIView):
    """
    Secure tune upload endpoint with AI review integration
    Only verified creators can upload tunes
    """
    serializer_class = TuneDetailSerializer
    permission_classes = [permissions.IsAuthenticated, CreatorVerificationRequired]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        """
        Handle tune upload with comprehensive AI safety review
        """
        try:
            with transaction.atomic():
                # 1. Validate creator permissions
                creator_profile = request.user.creator_profile
                
                # 2. Validate and create initial tune record
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                
                # 3. Create tune in DRAFT status
                tune = serializer.save(
                    creator=creator_profile,
                    status='DRAFT',
                    ai_review_required=True,
                    ai_review_completed=False
                )
                
                # 4. Extract motorcycle compatibility
                compatible_motorcycles = self._extract_motorcycle_models(request.data)
                
                # 5. Trigger AI review
                if request.FILES.get('tune_file'):
                    self._trigger_ai_review(tune, request.FILES['tune_file'], compatible_motorcycles, creator_profile.verification_level)
                
                # 6. Log upload event
                logger.info(f"Tune uploaded by {request.user.username}: {tune.name} (ID: {tune.id})")
                
                return Response({
                    'message': 'Tune uploaded successfully and submitted for AI review',
                    'tune_id': str(tune.id),
                    'status': tune.status,
                    'ai_review_status': 'PENDING',
                    'estimated_review_time': '2-10 minutes',
                    'next_steps': [
                        'AI safety analysis in progress',
                        'You will receive notification when review is complete',
                        'High-quality tunes from verified creators are often auto-approved'
                    ]
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Tune upload failed for {request.user.username}: {str(e)}")
            return Response({
                'error': 'Tune upload failed',
                'details': str(e) if settings.DEBUG else 'Please try again or contact support'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _extract_motorcycle_models(self, data):
        """Extract motorcycle model names for AI analysis"""
        motorcycle_ids = data.getlist('compatible_motorcycles', [])
        if motorcycle_ids:
            from bikes.models import Motorcycle
            motorcycles = Motorcycle.objects.filter(id__in=motorcycle_ids)
            return [f"{m.manufacturer.name} {m.model} {m.year}" for m in motorcycles]
        return []
    
    def _trigger_ai_review(self, tune, tune_file, motorcycle_models, creator_level):
        """Trigger AI review process"""
        try:
            # Get AI review service
            review_service = get_tune_review_service()
            
            # Perform AI analysis
            review_result = review_service.analyze_tune_upload(
                tune_file, motorcycle_models, creator_level
            )
            
            # Create AI review record
            from .models import TuneAIReview
            ai_review = TuneAIReview.objects.create(
                tune=tune,
                status=review_result['status'],
                ai_confidence_score=review_result['ai_confidence_score'],
                safety_score=review_result['safety_score'],
                compatibility_score=review_result['compatibility_score'],
                risk_factors=review_result['risk_factors'],
                safety_recommendations=review_result['safety_recommendations'],
                file_analysis=review_result['file_analysis'],
                ai_explanation=review_result['ai_explanation'],
                requires_manual_review=review_result['requires_manual_review'],
                manual_review_reason=review_result.get('manual_review_reason', ''),
                review_duration_seconds=review_result['review_duration_seconds'],
                reviewed_at=timezone.now()
            )
            
            # Update tune based on AI review result
            self._update_tune_from_ai_review(tune, review_result, creator_level)
            
            logger.info(f"AI review completed for tune {tune.id}: {review_result['status']}")
            
        except Exception as e:
            logger.error(f"AI review failed for tune {tune.id}: {str(e)}")
            # Set tune to manual review if AI fails
            tune.status = 'PENDING_REVIEW'
            tune.manual_review_required = True
            tune.save()
    
    def _update_tune_from_ai_review(self, tune, review_result, creator_level):
        """Update tune status based on AI review results"""
        ai_status = review_result['status']
        
        if ai_status == 'APPROVED':
            # Check if creator can be auto-approved
            creator_can_auto_approve = tune.creator.auto_approve_tunes
            
            if creator_can_auto_approve and review_result['safety_score'] >= 85:
                tune.status = 'APPROVED'
                tune.auto_approved = True
                tune.approval_date = timezone.now()
                tune.published_at = timezone.now()
            else:
                tune.status = 'PENDING_REVIEW'  # Still needs manual approval
                
            tune.ai_review_completed = True
            
        elif ai_status == 'REJECTED':
            tune.status = 'REJECTED'
            tune.rejection_reason = f"AI Safety Analysis: {review_result['ai_explanation']}"
            tune.ai_review_completed = True
            
        elif ai_status == 'MANUAL_REVIEW':
            tune.status = 'PENDING_REVIEW'
            tune.manual_review_required = True
            tune.ai_review_completed = True
            
        tune.save()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def creator_dashboard(request):
    """
    Creator dashboard showing their uploaded tunes and AI review status
    """
    try:
        creator_profile = request.user.creator_profile
    except:
        return Response({
            'error': 'Creator profile not found',
            'message': 'You need to create a creator profile to upload tunes'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Get creator's tunes with AI review status
    tunes = creator_profile.tunes.select_related('ai_review').all()
    
    dashboard_data = {
        'creator_info': {
            'username': request.user.username,
            'business_name': creator_profile.business_name,
            'verification_level': creator_profile.get_verification_level_display(),
            'can_upload_tunes': creator_profile.can_upload_tunes,
            'auto_approve_tunes': creator_profile.auto_approve_tunes,
            'years_experience': creator_profile.years_experience,
            'total_tunes': tunes.count(),
        },
        'tunes': [],
        'review_stats': {
            'pending_review': 0,
            'approved': 0,
            'rejected': 0,
            'auto_approved': 0,
        }
    }
    
    for tune in tunes:
        tune_data = {
            'id': str(tune.id),
            'name': tune.name,
            'status': tune.get_status_display(),
            'created_at': tune.created_at,
            'download_count': tune.download_count,
            'average_rating': float(tune.average_rating),
            'ai_review': None
        }
        
        # Add AI review information if available
        if hasattr(tune, 'ai_review'):
            ai_review = tune.ai_review
            tune_data['ai_review'] = {
                'status': ai_review.get_status_display(),
                'safety_score': ai_review.safety_score,
                'ai_confidence_score': ai_review.ai_confidence_score,
                'risk_factors': ai_review.risk_factors,
                'safety_recommendations': ai_review.safety_recommendations,
                'reviewed_at': ai_review.reviewed_at,
                'requires_manual_review': ai_review.requires_manual_review,
                'ai_explanation': ai_review.ai_explanation,
            }
        
        dashboard_data['tunes'].append(tune_data)
        
        # Update stats
        if tune.status == 'PENDING_REVIEW':
            dashboard_data['review_stats']['pending_review'] += 1
        elif tune.status == 'APPROVED':
            if tune.auto_approved:
                dashboard_data['review_stats']['auto_approved'] += 1
            else:
                dashboard_data['review_stats']['approved'] += 1
        elif tune.status == 'REJECTED':
            dashboard_data['review_stats']['rejected'] += 1
    
    return Response(dashboard_data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def apply_for_creator_verification(request):
    """
    Apply for creator verification
    """
    try:
        # Check if user already has creator profile
        try:
            creator_profile = request.user.creator_profile
            return Response({
                'message': 'You already have a creator profile',
                'current_level': creator_profile.get_verification_level_display(),
                'can_upload': creator_profile.can_upload_tunes
            })
        except:
            pass
        
        # Create new creator profile
        from .models import Creator
        data = request.data
        
        creator_profile = Creator.objects.create(
            user=request.user,
            business_name=data.get('business_name', ''),
            years_experience=data.get('years_experience', 0),
            specialization=data.get('specialization', []),
            certifications=data.get('certifications', []),
            business_license=data.get('business_license', ''),
            website=data.get('website', ''),
            verification_level='BASIC',  # Start with basic verification
            can_upload_tunes=True,      # Allow basic uploads
        )
        
        logger.info(f"Creator profile created for {request.user.username}")
        
        return Response({
            'message': 'Creator profile created successfully',
            'verification_level': creator_profile.get_verification_level_display(),
            'can_upload_tunes': creator_profile.can_upload_tunes,
            'next_steps': [
                'You can now upload tunes for AI review',
                'Build reputation with quality uploads for higher verification levels',
                'Professional verification available for established tuning shops'
            ]
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Creator verification application failed: {str(e)}")
        return Response({
            'error': 'Application failed',
            'details': str(e) if settings.DEBUG else 'Please try again'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def supported_tune_file_types(request):
    """
    Get supported tune file types and upload guidelines
    """
    from .models import TuneFileType
    
    file_types = []
    for choice in TuneFileType.choices:
        file_types.append({
            'extension': choice[0],
            'description': choice[1],
            'common_use': get_file_type_description(choice[0])
        })
    
    return Response({
        'supported_file_types': file_types,
        'upload_guidelines': {
            'max_file_size': '50MB',
            'security_scanning': 'All files are scanned for safety',
            'ai_review': 'FREE AI safety analysis using Mistral 7B',
            'creator_verification': 'Verified creators get priority review',
            'auto_approval': 'High-quality uploads may be auto-approved'
        },
        'safety_requirements': [
            'Files must be legitimate ECU tune files',
            'No executable or malicious content',
            'Must target specific motorcycle models',
            'Include proper safety warnings and instructions'
        ]
    })

def get_file_type_description(file_type):
    """Get detailed description for file types"""
    descriptions = {
        'bin': 'Binary ECU memory dumps, most common format for direct ECU flashing',
        'hex': 'Intel HEX format, readable text-based representation of binary data',
        'map': 'ECU map files containing calibration tables and parameters',
        'cal': 'Calibration files with specific tuning parameters',
        'kts': 'KTM-specific tune files for KTM motorcycles',
        'damos': 'Database definition files describing ECU structure',
        'a2l': 'ASAP2 files for ECU communication and data logging',
        'ols': 'OLS project files for advanced ECU tuning',
        'xdf': 'XDF definition files describing ECU memory layout',
        'bdm': 'BDM (Background Debug Mode) read files'
    }
    return descriptions.get(file_type, 'Standard ECU tune file format')


class TuneCategoryListView(generics.ListAPIView):
    """List all tune categories"""
    queryset = TuneCategory.objects.filter(is_active=True)
    serializer_class = TuneCategorySerializer
    permission_classes = [AllowAny]


class TuneTypeListView(generics.ListAPIView):
    """List all tune types"""
    queryset = TuneType.objects.all()
    serializer_class = TuneTypeSerializer
    permission_classes = [AllowAny]


class SafetyRatingListView(generics.ListAPIView):
    """List all safety ratings"""
    queryset = SafetyRating.objects.all()
    serializer_class = SafetyRatingSerializer
    permission_classes = [AllowAny]


class TuneCreatorListView(generics.ListAPIView):
    """List all verified tune creators"""
    queryset = TuneCreator.objects.filter(is_verified=True)
    serializer_class = TuneCreatorSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['business_name', 'user__username', 'specialties']
    ordering_fields = ['average_rating', 'total_downloads', 'experience_years']
    ordering = ['-average_rating']


class TuneCreatorDetailView(generics.RetrieveAPIView):
    """Get individual tune creator details"""
    queryset = TuneCreator.objects.filter(is_verified=True)
    serializer_class = TuneCreatorSerializer
    permission_classes = [AllowAny]


class TuneListView(generics.ListAPIView):
    """List all approved tunes with filtering and search"""
    serializer_class = TuneListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'category__name': ['exact'],
        'tune_type__name': ['exact'],
        'safety_rating__level': ['exact'],
        'price': ['exact', 'lte', 'gte'],
        'is_open_source': ['exact'],
        'dyno_tested': ['exact'],
        'street_legal': ['exact'],
        'is_track_only': ['exact'],
        'is_featured': ['exact'],
    }
    search_fields = ['name', 'description', 'tags', 'creator__business_name']
    ordering_fields = [
        'published_at', 'download_count', 'average_rating', 'price',
        'power_gain_hp', 'fuel_economy_change_percentage'
    ]
    ordering = ['-published_at']

    def get_queryset(self):
        queryset = Tune.objects.filter(status='approved').select_related(
            'creator', 'category', 'tune_type', 'safety_rating'
        )
        
        # Filter by motorcycle compatibility
        motorcycle_id = self.request.query_params.get('motorcycle', None)
        if motorcycle_id:
            queryset = queryset.filter(
                compatible_motorcycles__id=motorcycle_id
            ).distinct()
        
        # Filter by free/paid
        pricing = self.request.query_params.get('pricing', None)
        if pricing == 'free':
            queryset = queryset.filter(price=0)
        elif pricing == 'paid':
            queryset = queryset.filter(price__gt=0)
        
        return queryset


class TuneDetailView(generics.RetrieveAPIView):
    """Get individual tune details"""
    queryset = Tune.objects.filter(status='approved').select_related(
        'creator', 'category', 'tune_type', 'safety_rating'
    ).prefetch_related('tunecompatibility_set__motorcycle__manufacturer')
    serializer_class = TuneDetailSerializer
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FeaturedTunesView(generics.ListAPIView):
    """Get featured tunes for homepage"""
    queryset = Tune.objects.filter(
        status='approved', 
        is_featured=True
    ).select_related('creator', 'category', 'tune_type', 'safety_rating')[:6]
    serializer_class = TuneListSerializer
    permission_classes = [AllowAny]


class PopularTunesView(generics.ListAPIView):
    """Get most popular tunes by download count"""
    queryset = Tune.objects.filter(
        status='approved'
    ).select_related('creator', 'category', 'tune_type', 'safety_rating').order_by(
        '-download_count'
    )[:10]
    serializer_class = TuneListSerializer
    permission_classes = [AllowAny]


class RecentTunesView(generics.ListAPIView):
    """Get recently added tunes"""
    queryset = Tune.objects.filter(
        status='approved'
    ).select_related('creator', 'category', 'tune_type', 'safety_rating').order_by(
        '-published_at'
    )[:10]
    serializer_class = TuneListSerializer
    permission_classes = [AllowAny]


class FreeTunesView(generics.ListAPIView):
    """Get all free/open-source tunes"""
    queryset = Tune.objects.filter(
        status='approved',
        price=0,
        is_open_source=True
    ).select_related('creator', 'category', 'tune_type', 'safety_rating').order_by(
        '-published_at'
    )
    serializer_class = TuneListSerializer
    permission_classes = [AllowAny]


class TuneReviewListView(generics.ListAPIView):
    """Get reviews for a specific tune"""
    serializer_class = TuneReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        tune_id = self.kwargs['tune_id']
        return TuneReview.objects.filter(
            tune_id=tune_id,
            is_approved=True
        ).select_related('user', 'motorcycle').order_by('-created_at')


@api_view(['GET'])
@permission_classes([AllowAny])
def tune_stats(request):
    """Get platform statistics"""
    stats = {
        'total_tunes': Tune.objects.filter(status='approved').count(),
        'free_tunes': Tune.objects.filter(status='approved', price=0).count(),
        'verified_creators': TuneCreator.objects.filter(is_verified=True).count(),
        'total_downloads': sum(Tune.objects.filter(status='approved').values_list('download_count', flat=True)),
        'categories': TuneCategory.objects.filter(is_active=True).count(),
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_suggestions(request):
    """Get search suggestions based on query"""
    query = request.GET.get('q', '')
    if len(query) < 2:
        return Response([])
    
    # Search in tune names and creator names
    tune_suggestions = Tune.objects.filter(
        Q(name__icontains=query) | Q(creator__business_name__icontains=query),
        status='approved'
    ).values_list('name', flat=True)[:5]
    
    suggestions = list(tune_suggestions)
    return Response(suggestions)
