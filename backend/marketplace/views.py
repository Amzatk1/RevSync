from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from django.utils import timezone
from decimal import Decimal
import stripe
import logging

from .models import (
    TuneMarketplaceListing, TunePurchase, CreatorProfile, 
    TuneReview, SafetyValidation, RevenuePayout
)
from .serializers import (
    MarketplaceListingSerializer, TunePurchaseSerializer,
    CreatorProfileSerializer, TuneReviewSerializer,
    SafetyValidationSerializer
)
from .services import PaymentService, SafetyValidationService, RevenueService

logger = logging.getLogger(__name__)


class MarketplaceListingViewSet(viewsets.ModelViewSet):
    """API for marketplace tune listings"""
    serializer_class = MarketplaceListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = TuneMarketplaceListing.objects.filter(status='APPROVED')
        
        # Filter by bike compatibility
        bike_id = self.request.query_params.get('bike_id')
        if bike_id:
            queryset = queryset.filter(compatible_bikes__id=bike_id)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(tune_file__category=category)
        
        # Filter by pricing type
        pricing_type = self.request.query_params.get('pricing_type')
        if pricing_type:
            queryset = queryset.filter(pricing_type=pricing_type)
        
        # Filter for track/race modes
        track_mode = self.request.query_params.get('track_mode')
        if track_mode == 'true':
            queryset = queryset.filter(track_mode=True)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(creator__username__icontains=search)
            )
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        valid_orderings = [
            'price', '-price', 'total_sales', '-total_sales',
            'average_rating', '-average_rating', 'created_at', '-created_at'
        ]
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)
        
        return queryset.select_related('creator', 'tune_file').prefetch_related('compatible_bikes')
    
    def perform_create(self, serializer):
        """Create a new marketplace listing"""
        serializer.save(creator=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def purchase(self, request, pk=None):
        """Purchase a tune"""
        listing = self.get_object()
        user = request.user
        
        # Check if already purchased
        if TunePurchase.objects.filter(buyer=user, listing=listing).exists():
            return Response(
                {'error': 'You have already purchased this tune'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get motorcycle for compatibility check
        motorcycle_id = request.data.get('motorcycle_id')
        if not motorcycle_id:
            return Response(
                {'error': 'motorcycle_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from motorcycles.models import Motorcycle
            motorcycle = Motorcycle.objects.get(id=motorcycle_id, user=user)
        except Motorcycle.DoesNotExist:
            return Response(
                {'error': 'Invalid motorcycle'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check compatibility
        if not listing.compatible_bikes.filter(id=motorcycle.id).exists():
            return Response(
                {'error': 'This tune is not compatible with your motorcycle'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process payment
        payment_service = PaymentService()
        
        if listing.is_free:
            # Free tune - create purchase directly
            purchase = TunePurchase.objects.create(
                buyer=user,
                listing=listing,
                motorcycle=motorcycle,
                price_paid=Decimal('0.00'),
                payment_method='FREE',
                payment_id=f'free_{timezone.now().timestamp()}',
                status='COMPLETED'
            )
        else:
            # Paid tune - process payment
            payment_token = request.data.get('payment_token')
            if not payment_token:
                return Response(
                    {'error': 'payment_token is required for paid tunes'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                payment_result = payment_service.process_payment(
                    amount=listing.price,
                    token=payment_token,
                    description=f"RevSync Tune: {listing.title}",
                    user=user
                )
                
                purchase = TunePurchase.objects.create(
                    buyer=user,
                    listing=listing,
                    motorcycle=motorcycle,
                    price_paid=listing.price,
                    payment_method='STRIPE',
                    payment_id=payment_result['payment_id'],
                    status='COMPLETED'
                )
                
                # Update listing sales metrics
                listing.total_sales += 1
                listing.total_revenue += listing.price
                listing.save()
                
                # Update creator earnings
                revenue_service = RevenueService()
                revenue_service.record_sale(purchase)
                
            except Exception as e:
                logger.error(f"Payment processing failed: {str(e)}")
                return Response(
                    {'error': 'Payment processing failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = TunePurchaseSerializer(purchase)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def download(self, request, pk=None):
        """Download purchased tune file"""
        listing = self.get_object()
        user = request.user
        
        try:
            purchase = TunePurchase.objects.get(
                buyer=user, 
                listing=listing, 
                status='COMPLETED'
            )
        except TunePurchase.DoesNotExist:
            return Response(
                {'error': 'You have not purchased this tune'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check download limits
        if purchase.download_count >= purchase.max_downloads:
            return Response(
                {'error': 'Download limit exceeded'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check rental expiry
        if listing.pricing_type == 'RENTAL' and not purchase.is_rental_active:
            return Response(
                {'error': 'Rental period has expired'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate secure download URL
        download_url = listing.tune_file.get_secure_download_url()
        
        # Update download count
        purchase.download_count += 1
        purchase.downloaded_at = timezone.now()
        purchase.save()
        
        return Response({
            'download_url': download_url,
            'expires_at': timezone.now() + timezone.timedelta(hours=1),
            'downloads_remaining': purchase.max_downloads - purchase.download_count
        })
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get reviews for a listing"""
        listing = self.get_object()
        reviews = TuneReview.objects.filter(
            listing=listing, 
            is_approved=True
        ).select_related('reviewer')
        
        serializer = TuneReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        """Create a review for a purchased tune"""
        listing = self.get_object()
        user = request.user
        
        # Check if user purchased the tune
        try:
            purchase = TunePurchase.objects.get(
                buyer=user,
                listing=listing,
                status='COMPLETED'
            )
        except TunePurchase.DoesNotExist:
            return Response(
                {'error': 'You can only review tunes you have purchased'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already reviewed
        if TuneReview.objects.filter(purchase=purchase).exists():
            return Response(
                {'error': 'You have already reviewed this tune'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TuneReviewSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(
                purchase=purchase,
                reviewer=user,
                listing=listing
            )
            
            # Update listing average rating
            avg_rating = TuneReview.objects.filter(
                listing=listing,
                is_approved=True
            ).aggregate(avg=Avg('rating'))['avg']
            
            listing.average_rating = avg_rating or 0
            listing.rating_count = TuneReview.objects.filter(
                listing=listing,
                is_approved=True
            ).count()
            listing.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreatorDashboardViewSet(viewsets.ModelViewSet):
    """Creator dashboard for managing listings and earnings"""
    serializer_class = CreatorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CreatorProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get creator statistics"""
        user = request.user
        
        try:
            profile = CreatorProfile.objects.get(user=user)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': 'Creator profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get listing statistics
        listings = TuneMarketplaceListing.objects.filter(creator=user)
        
        stats = {
            'total_listings': listings.count(),
            'approved_listings': listings.filter(status='APPROVED').count(),
            'pending_listings': listings.filter(status='PENDING_REVIEW').count(),
            'total_sales': profile.total_sales,
            'total_revenue': profile.total_revenue,
            'total_earnings': profile.total_earnings,
            'average_rating': profile.average_rating,
            'recent_sales': TunePurchase.objects.filter(
                listing__creator=user,
                purchased_at__gte=timezone.now() - timezone.timedelta(days=30)
            ).count(),
            'pending_payout': RevenuePayout.objects.filter(
                creator=profile,
                status='PENDING'
            ).aggregate(total=models.Sum('amount'))['total'] or 0
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def request_payout(self, request):
        """Request payout of earnings"""
        user = request.user
        
        try:
            profile = CreatorProfile.objects.get(user=user)
        except CreatorProfile.DoesNotExist:
            return Response(
                {'error': 'Creator profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check minimum payout amount
        minimum_payout = Decimal('50.00')
        available_earnings = profile.total_earnings - RevenuePayout.objects.filter(
            creator=profile,
            status__in=['PENDING', 'PROCESSING', 'COMPLETED']
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        if available_earnings < minimum_payout:
            return Response(
                {'error': f'Minimum payout amount is ${minimum_payout}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payout request
        revenue_service = RevenueService()
        payout = revenue_service.create_payout_request(profile, available_earnings)
        
        return Response({
            'payout_id': payout.id,
            'amount': payout.amount,
            'status': payout.status,
            'estimated_processing_time': '3-5 business days'
        })


class SafetyValidationViewSet(viewsets.ReadOnlyModelViewSet):
    """Safety validation management for admins"""
    serializer_class = SafetyValidationSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = SafetyValidation.objects.all()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a tune after validation"""
        validation = self.get_object()
        
        if validation.status != 'PASSED':
            return Response(
                {'error': 'Tune must pass safety validation first'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        listing = validation.listing
        listing.status = 'APPROVED'
        listing.approved_at = timezone.now()
        listing.save()
        
        return Response({'message': 'Tune approved for marketplace'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a tune listing"""
        validation = self.get_object()
        reason = request.data.get('reason', '')
        
        listing = validation.listing
        listing.status = 'REJECTED'
        listing.admin_notes = reason
        listing.save()
        
        validation.status = 'FAILED'
        validation.validation_notes = reason
        validation.save()
        
        return Response({'message': 'Tune rejected'})


class MyPurchasesViewSet(viewsets.ReadOnlyModelViewSet):
    """User's purchased tunes"""
    serializer_class = TunePurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TunePurchase.objects.filter(
            buyer=self.request.user,
            status='COMPLETED'
        ).select_related('listing', 'motorcycle')
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a purchased tune"""
        purchase = self.get_object()
        
        # Use the same download logic as marketplace
        listing_view = MarketplaceListingViewSet()
        listing_view.request = request
        return listing_view.download(request, pk=purchase.listing.id) 