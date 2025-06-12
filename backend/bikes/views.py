from django.shortcuts import render
from rest_framework import generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Max, Min
from django.db import models

from .models import (
    Manufacturer, EngineType, BikeCategory, Motorcycle, ECUType,
    MotorcycleECU, BikeSpecification, BikeImage, BikeReview
)
from .serializers import (
    ManufacturerSerializer, EngineTypeSerializer, BikeCategorySerializer,
    MotorcycleListSerializer, MotorcycleDetailSerializer, ECUTypeSerializer,
    BikeSpecificationSerializer, BikeImageSerializer, BikeReviewSerializer,
    MotorcycleECUSerializer
)


class ManufacturerListView(generics.ListAPIView):
    """List all motorcycle manufacturers"""
    queryset = Manufacturer.objects.filter(is_active=True).order_by('name')
    serializer_class = ManufacturerSerializer
    permission_classes = [AllowAny]


class EngineTypeListView(generics.ListAPIView):
    """List all engine types"""
    queryset = EngineType.objects.all().order_by('name')
    serializer_class = EngineTypeSerializer
    permission_classes = [AllowAny]


class BikeCategoryListView(generics.ListAPIView):
    """List all bike categories"""
    queryset = BikeCategory.objects.all().order_by('name')
    serializer_class = BikeCategorySerializer
    permission_classes = [AllowAny]


class ECUTypeListView(generics.ListAPIView):
    """List all ECU types"""
    queryset = ECUType.objects.all().order_by('name')
    serializer_class = ECUTypeSerializer
    permission_classes = [AllowAny]


class MotorcycleListView(generics.ListAPIView):
    """List all motorcycles with filtering and search"""
    serializer_class = MotorcycleListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['model_name', 'manufacturer__name', 'description']
    ordering_fields = [
        'model_name', 'year', 'displacement_cc', 'max_power_hp', 
        'max_torque_nm', 'msrp_usd', 'created_at'
    ]
    ordering = ['manufacturer__name', 'model_name', '-year']

    def get_queryset(self):
        queryset = Motorcycle.objects.select_related(
            'manufacturer', 'category', 'engine_type'
        )
        
        # Filter by displacement range
        displacement_min = self.request.query_params.get('displacement_min', None)
        displacement_max = self.request.query_params.get('displacement_max', None)
        if displacement_min:
            queryset = queryset.filter(displacement_cc__gte=displacement_min)
        if displacement_max:
            queryset = queryset.filter(displacement_cc__lte=displacement_max)
        
        # Filter by price range
        price_min = self.request.query_params.get('price_min', None)
        price_max = self.request.query_params.get('price_max', None)
        if price_min:
            queryset = queryset.filter(msrp_usd__gte=price_min)
        if price_max:
            queryset = queryset.filter(msrp_usd__lte=price_max)
        
        return queryset


class MotorcycleDetailView(generics.RetrieveAPIView):
    """Get individual motorcycle details"""
    queryset = Motorcycle.objects.select_related(
        'manufacturer', 'category', 'engine_type'
    ).prefetch_related('specifications', 'images', 'ecus__ecu_type')
    serializer_class = MotorcycleDetailSerializer
    permission_classes = [AllowAny]


class MotorcyclesByManufacturerView(generics.ListAPIView):
    """Get motorcycles by specific manufacturer"""
    serializer_class = MotorcycleListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        manufacturer_id = self.kwargs['manufacturer_id']
        return Motorcycle.objects.filter(
            manufacturer_id=manufacturer_id
        ).select_related('manufacturer', 'category', 'engine_type').order_by(
            'model_name', '-year'
        )


class MotorcycleSpecificationsView(generics.ListAPIView):
    """Get specifications for a specific motorcycle"""
    serializer_class = BikeSpecificationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        motorcycle_id = self.kwargs['motorcycle_id']
        return BikeSpecification.objects.filter(
            motorcycle_id=motorcycle_id
        ).order_by('specification_type')


class MotorcycleImagesView(generics.ListAPIView):
    """Get images for a specific motorcycle"""
    serializer_class = BikeImageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        motorcycle_id = self.kwargs['motorcycle_id']
        return BikeImage.objects.filter(
            motorcycle_id=motorcycle_id
        ).order_by('-is_primary', 'order')


class MotorcycleReviewsView(generics.ListAPIView):
    """Get reviews for a specific motorcycle"""
    serializer_class = BikeReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        motorcycle_id = self.kwargs['motorcycle_id']
        return BikeReview.objects.filter(
            motorcycle_id=motorcycle_id
        ).select_related('user').order_by('-created_at')


class MotorcycleECUsView(generics.ListAPIView):
    """Get ECU information for a specific motorcycle"""
    serializer_class = MotorcycleECUSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        motorcycle_id = self.kwargs['motorcycle_id']
        return MotorcycleECU.objects.filter(
            motorcycle_id=motorcycle_id
        ).select_related('ecu_type').order_by('-is_primary')


class PopularMotorcyclesView(generics.ListAPIView):
    """Get most popular motorcycles"""
    queryset = Motorcycle.objects.select_related(
        'manufacturer', 'category', 'engine_type'
    ).order_by('-created_at')[:12]
    serializer_class = MotorcycleListSerializer
    permission_classes = [AllowAny]


class NewMotorcyclesView(generics.ListAPIView):
    """Get newest motorcycles"""
    queryset = Motorcycle.objects.select_related(
        'manufacturer', 'category', 'engine_type'
    ).order_by('-year', '-created_at')[:12]
    serializer_class = MotorcycleListSerializer
    permission_classes = [AllowAny]


@api_view(['GET'])
@permission_classes([AllowAny])
def motorcycle_stats(request):
    """Get motorcycle database statistics"""
    stats = {
        'total_motorcycles': Motorcycle.objects.count(),
        'manufacturers': Manufacturer.objects.filter(is_active=True).count(),
        'categories': BikeCategory.objects.count(),
        'latest_year': Motorcycle.objects.aggregate(
            latest=Max('year')
        )['latest'] or 0,
        'displacement_range': {
            'min': Motorcycle.objects.aggregate(
                min_disp=Min('displacement_cc')
            )['min_disp'] or 0,
            'max': Motorcycle.objects.aggregate(
                max_disp=Max('displacement_cc')
            )['max_disp'] or 0,
        }
    }
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def motorcycle_search_suggestions(request):
    """Get motorcycle search suggestions"""
    query = request.GET.get('q', '')
    if len(query) < 2:
        return Response([])
    
    # Search in model names and manufacturer names
    suggestions = []
    
    # Motorcycle model suggestions
    motorcycle_suggestions = Motorcycle.objects.filter(
        Q(model_name__icontains=query) | Q(manufacturer__name__icontains=query)
    ).values_list('model_name', flat=True).distinct()[:5]
    
    suggestions.extend(list(motorcycle_suggestions))
    
    # Manufacturer suggestions
    manufacturer_suggestions = Manufacturer.objects.filter(
        name__icontains=query, is_active=True
    ).values_list('name', flat=True)[:3]
    
    suggestions.extend(list(manufacturer_suggestions))
    
    return Response(suggestions[:8])
