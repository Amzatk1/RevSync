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
