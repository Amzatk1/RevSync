from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import update_session_auth_hash
from django.db.models import Q, Count, Avg, Max, Sum
from django.utils import timezone
from datetime import timedelta
from .models import (
    User, RidingProfile, UserGarage, RideSession, 
    UserAchievement, UserStats
)
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    RidingProfileSerializer, UserGarageSerializer, RideSessionSerializer,
    UserAchievementSerializer, UserStatsSerializer, UserPublicProfileSerializer,
    PasswordChangeSerializer, EmailChangeSerializer, UserDashboardSerializer
)


class UserRegistrationView(generics.CreateAPIView):
    """User registration with automatic profile creation"""
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Account created successfully'
        }, status=status.HTTP_201_CREATED)


class UserLoginView(TokenObtainPairView):
    """Enhanced login with user data"""
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Update login count and last login
        user.login_count += 1
        user.save(update_fields=['login_count', 'last_login'])
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Login successful'
        })


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class RidingProfileView(generics.RetrieveUpdateAPIView):
    """User riding profile and preferences"""
    serializer_class = RidingProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = RidingProfile.objects.get_or_create(user=self.request.user)
        return profile


class UserGarageListView(generics.ListCreateAPIView):
    """User's motorcycle garage"""
    serializer_class = UserGarageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserGarage.objects.filter(
            user=self.request.user
        ).select_related('motorcycle__manufacturer').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserGarageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Individual garage bike management"""
    serializer_class = UserGarageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserGarage.objects.filter(user=self.request.user)


class RideSessionListView(generics.ListCreateAPIView):
    """User's ride sessions"""
    serializer_class = RideSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return RideSession.objects.filter(
            user=self.request.user
        ).select_related('motorcycle__manufacturer').order_by('-start_time')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RideSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Individual ride session management"""
    serializer_class = RideSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return RideSession.objects.filter(user=self.request.user)


class UserAchievementsView(generics.ListAPIView):
    """User achievements and progress"""
    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user).order_by('-created_at')


class UserStatsView(generics.RetrieveAPIView):
    """User statistics and analytics"""
    serializer_class = UserStatsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        stats, created = UserStats.objects.get_or_create(user=self.request.user)
        if created or stats.updated_at < timezone.now() - timedelta(hours=1):
            self.update_user_stats(stats)
        return stats
    
    def update_user_stats(self, stats):
        """Update user statistics from ride sessions"""
        user = self.request.user
        rides = user.ride_sessions.all()
        
        stats.total_rides = rides.count()
        stats.total_distance_km = rides.aggregate(
            total=Sum('distance_km'))['total'] or 0
        stats.total_ride_time_minutes = rides.aggregate(
            total=Sum('duration_minutes'))['total'] or 0
        
        if stats.total_rides > 0:
            stats.avg_ride_distance_km = stats.total_distance_km / stats.total_rides
            stats.avg_ride_duration_minutes = stats.total_ride_time_minutes / stats.total_rides
        
        stats.max_speed_achieved_kmh = rides.aggregate(
            max_speed=Max('max_speed_kmh'))['max_speed'] or 0
        stats.avg_speed_overall_kmh = rides.aggregate(
            avg_speed=Avg('avg_speed_kmh'))['avg_speed'] or 0
        stats.total_fuel_consumed_liters = rides.aggregate(
            total=Sum('fuel_consumed_liters'))['total'] or 0
        
        stats.achievements_unlocked = user.achievements.filter(is_completed=True).count()
        stats.last_ride_date = rides.order_by('-start_time').first().start_time.date() if rides.exists() else None
        
        stats.save()


class UserDashboardView(generics.RetrieveAPIView):
    """User dashboard with comprehensive overview"""
    serializer_class = UserDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class PublicProfileView(generics.RetrieveAPIView):
    """Public user profile (limited data)"""
    serializer_class = UserPublicProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'username'
    
    def get_queryset(self):
        return User.objects.filter(
            Q(profile_visibility='public') |
            Q(profile_visibility='friends')  # TODO: Add friends logic
        ).select_related('riding_profile').prefetch_related('stats')


class PasswordChangeView(APIView):
    """Change user password"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            update_session_auth_hash(request, user)
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailChangeView(APIView):
    """Change user email (requires verification)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = EmailChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # TODO: Send verification email
            return Response({
                'message': 'Verification email sent to new address',
                'new_email': serializer.validated_data['new_email']
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_leaderboard(request):
    """Global user leaderboard"""
    leaderboard_type = request.GET.get('type', 'points')
    limit = min(int(request.GET.get('limit', 50)), 100)
    
    if leaderboard_type == 'distance':
        users = User.objects.select_related('stats').order_by('-stats__total_distance_km')[:limit]
        data = [{
            'rank': idx + 1,
            'username': user.username,
            'avatar_url': user.avatar_url,
            'value': float(user.stats.total_distance_km) if hasattr(user, 'stats') else 0,
            'label': 'km'
        } for idx, user in enumerate(users)]
    
    elif leaderboard_type == 'rides':
        users = User.objects.select_related('stats').order_by('-stats__total_rides')[:limit]
        data = [{
            'rank': idx + 1,
            'username': user.username,
            'avatar_url': user.avatar_url,
            'value': user.stats.total_rides if hasattr(user, 'stats') else 0,
            'label': 'rides'
        } for idx, user in enumerate(users)]
    
    else:  # points
        users = User.objects.select_related('stats').order_by('-stats__total_points')[:limit]
        data = [{
            'rank': idx + 1,
            'username': user.username,
            'avatar_url': user.avatar_url,
            'value': user.stats.total_points if hasattr(user, 'stats') else 0,
            'label': 'points'
        } for idx, user in enumerate(users)]
    
    return Response({
        'type': leaderboard_type,
        'leaderboard': data,
        'user_rank': next((item['rank'] for item in data if item['username'] == request.user.username), None)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_analytics(request):
    """User riding analytics and insights"""
    user = request.user
    rides = user.ride_sessions.all()
    
    # Time period filter
    period = request.GET.get('period', '30')  # days
    if period != 'all':
        start_date = timezone.now() - timedelta(days=int(period))
        rides = rides.filter(start_time__gte=start_date)
    
    # Basic stats
    total_rides = rides.count()
    total_distance = rides.aggregate(Sum('distance_km'))['distance_km__sum'] or 0
    total_time = rides.aggregate(Sum('duration_minutes'))['duration_minutes__sum'] or 0
    
    # Riding patterns
    rides_by_type = rides.values('ride_type').annotate(count=Count('id'))
    rides_by_day = rides.extra(
        select={'day': 'EXTRACT(dow FROM start_time)'}
    ).values('day').annotate(count=Count('id'))
    
    # Performance trends
    monthly_distance = rides.extra(
        select={'month': 'EXTRACT(month FROM start_time)', 'year': 'EXTRACT(year FROM start_time)'}
    ).values('year', 'month').annotate(
        total_distance=Sum('distance_km'),
        total_rides=Count('id')
    ).order_by('year', 'month')
    
    return Response({
        'period': period,
        'summary': {
            'total_rides': total_rides,
            'total_distance_km': float(total_distance),
            'total_time_hours': round(total_time / 60, 2) if total_time else 0,
            'avg_distance_per_ride': round(total_distance / total_rides, 2) if total_rides else 0,
            'avg_duration_per_ride': round(total_time / total_rides, 2) if total_rides else 0,
        },
        'patterns': {
            'rides_by_type': list(rides_by_type),
            'rides_by_day': list(rides_by_day),
        },
        'trends': {
            'monthly_distance': list(monthly_distance),
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_ride_session(request):
    """Start a new ride session"""
    data = request.data.copy()
    data['user'] = request.user.id
    data['start_time'] = timezone.now()
    
    serializer = RideSessionSerializer(data=data)
    if serializer.is_valid():
        ride = serializer.save(user=request.user)
        return Response({
            'ride_session': RideSessionSerializer(ride).data,
            'message': 'Ride session started'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def end_ride_session(request, session_id):
    """End an active ride session"""
    try:
        ride = RideSession.objects.get(id=session_id, user=request.user)
        if ride.end_time:
            return Response({'error': 'Ride session already ended'}, status=status.HTTP_400_BAD_REQUEST)
        
        ride.end_time = timezone.now()
        ride.duration_minutes = int((ride.end_time - ride.start_time).total_seconds() / 60)
        
        # Update with any additional data from request
        for field in ['distance_km', 'avg_speed_kmh', 'max_speed_kmh', 'fuel_consumed_liters', 
                     'weather_condition', 'temperature_celsius', 'enjoyment_rating', 'safety_rating', 'notes']:
            if field in request.data:
                setattr(ride, field, request.data[field])
        
        ride.save()
        
        # Update user stats
        self.update_user_stats_after_ride(request.user, ride)
        
        return Response({
            'ride_session': RideSessionSerializer(ride).data,
            'message': 'Ride session completed'
        })
        
    except RideSession.DoesNotExist:
        return Response({'error': 'Ride session not found'}, status=status.HTTP_404_NOT_FOUND)


def update_user_stats_after_ride(user, ride):
    """Update user stats after completing a ride"""
    stats, created = UserStats.objects.get_or_create(user=user)
    
    stats.total_rides += 1
    if ride.distance_km:
        stats.total_distance_km += ride.distance_km
    if ride.duration_minutes:
        stats.total_ride_time_minutes += ride.duration_minutes
    if ride.max_speed_kmh and ride.max_speed_kmh > stats.max_speed_achieved_kmh:
        stats.max_speed_achieved_kmh = ride.max_speed_kmh
    
    # Recalculate averages
    all_rides = user.ride_sessions.all()
    stats.avg_ride_distance_km = all_rides.aggregate(Avg('distance_km'))['distance_km__avg'] or 0
    stats.avg_ride_duration_minutes = all_rides.aggregate(Avg('duration_minutes'))['duration_minutes__avg'] or 0
    stats.avg_speed_overall_kmh = all_rides.aggregate(Avg('avg_speed_kmh'))['avg_speed_kmh__avg'] or 0
    
    stats.last_ride_date = ride.start_time.date()
    stats.save()


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def platform_stats(request):
    """Public platform statistics"""
    total_users = User.objects.count()
    total_rides = RideSession.objects.count()
    total_distance = RideSession.objects.aggregate(Sum('distance_km'))['distance_km__sum'] or 0
    
    return Response({
        'total_users': total_users,
        'total_rides': total_rides,
        'total_distance_km': float(total_distance),
        'avg_rides_per_user': round(total_rides / total_users, 1) if total_users else 0,
    }) 