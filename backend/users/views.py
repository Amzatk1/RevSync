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
    UserAchievement, UserStats, UserFriend, MessageThread, Message, Community, CommunityMembership, CommunityPost, PostComment,
    MessageReceipt, PointTransaction
)
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    RidingProfileSerializer, UserGarageSerializer, RideSessionSerializer,
    UserAchievementSerializer, UserStatsSerializer, UserPublicProfileSerializer,
    PasswordChangeSerializer, EmailChangeSerializer, UserDashboardSerializer,
    UserFriendSerializer, UserFriendRequestSerializer, UserFriendCreateSerializer, UserFriendActionSerializer,
    MessageThreadSerializer, MessageThreadCreateSerializer, MessageThreadDetailSerializer,
    MessageSerializer, MessageCreateSerializer, CommunitySerializer, CommunityCreateSerializer, CommunityDetailSerializer,
    CommunityMembershipSerializer, CommunityPostSerializer, CommunityPostDetailSerializer,
    PostCommentSerializer, AchievementWithProgressSerializer, LeaderboardEntrySerializer,
    PointTransactionSerializer, UserRankingSerializer
)
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend


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


# Ride session functionality removed - focusing on tunes only


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
        """Update user statistics - now focused on tunes and garage"""
        user = self.request.user
        
        # Reset ride-related stats since we removed ride functionality
        stats.total_rides = 0
        stats.total_distance_km = 0
        stats.total_ride_time_minutes = 0
        stats.avg_ride_distance_km = 0
        stats.avg_ride_duration_minutes = 0
        stats.max_speed_achieved_kmh = 0
        stats.avg_speed_overall_kmh = 0
        stats.total_fuel_consumed_liters = 0
        stats.last_ride_date = None
        
        # Focus on tune and garage related stats
        stats.achievements_unlocked = user.achievements.filter(is_completed=True).count()
        
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


# Ride session functionality removed - focusing on tunes only


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def platform_stats(request):
    """Public platform statistics - focused on tunes marketplace"""
    from tunes.models import Tune
    from bikes.models import Motorcycle
    
    total_users = User.objects.count()
    total_tunes = Tune.objects.count()
    total_motorcycles = Motorcycle.objects.count()
    
    return Response({
        'total_users': total_users,
        'total_tunes': total_tunes,
        'total_motorcycles': total_motorcycles,
        'avg_tunes_per_user': round(total_tunes / total_users, 1) if total_users else 0,
    })


# PHASE 2 ENHANCEMENT: SOCIAL MESSAGING SYSTEM VIEWS

class UserFriendListView(generics.ListAPIView):
    """List all friends of the current user"""
    serializer_class = UserFriendSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get all accepted friendships
        return UserFriend.objects.filter(
            (Q(user=self.request.user) | Q(friend=self.request.user)),
            status='accepted'
        )


class UserFriendRequestsView(generics.ListAPIView):
    """List all pending friend requests for the current user"""
    serializer_class = UserFriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get all pending friend requests sent to this user
        return UserFriend.objects.filter(
            friend=self.request.user,
            status='pending'
        )


class UserFriendCreateView(generics.CreateAPIView):
    """Send a friend request to another user"""
    serializer_class = UserFriendCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='pending')


class UserFriendActionView(generics.UpdateAPIView):
    """Accept, reject, or block a friend request"""
    serializer_class = UserFriendActionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserFriend.objects.filter(friend=self.request.user)
    
    def perform_update(self, serializer):
        # Only allow changes to status field
        serializer.save(updated_at=timezone.now())


class MessageThreadListView(generics.ListAPIView):
    """List all message threads for the current user"""
    serializer_class = MessageThreadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MessageThread.objects.filter(
            participants=self.request.user,
            is_active=True
        ).order_by('-last_message_at')


class MessageThreadCreateView(generics.CreateAPIView):
    """Create a new message thread"""
    serializer_class = MessageThreadCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        thread = serializer.save(creator=self.request.user)
        # Add the creator to participants
        thread.participants.add(self.request.user)
        return thread


class MessageThreadDetailView(generics.RetrieveAPIView):
    """Get details of a message thread"""
    serializer_class = MessageThreadDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MessageThread.objects.filter(
            participants=self.request.user,
            is_active=True
        )


class MessageListView(generics.ListAPIView):
    """List all messages in a thread"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        thread_id = self.kwargs.get('thread_id')
        # Verify user is participant in this thread
        get_object_or_404(MessageThread, id=thread_id, participants=self.request.user)
        
        return Message.objects.filter(
            thread_id=thread_id
        ).order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        # Mark messages as read when fetched
        queryset = self.get_queryset()
        
        # Update unread messages to read
        unread_messages = queryset.filter(
            sender__id__ne=request.user.id,
            is_read=False
        )
        
        # Create or update receipts
        for msg in unread_messages:
            MessageReceipt.objects.update_or_create(
                message=msg,
                user=request.user,
                defaults={
                    'is_read': True,
                    'read_at': timezone.now()
                }
            )
        
        # Continue with standard list behavior
        return super().list(request, *args, **kwargs)


class MessageCreateView(generics.CreateAPIView):
    """Send a new message in a thread"""
    serializer_class = MessageCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        thread_id = self.kwargs.get('thread_id')
        # Verify user is participant in this thread
        thread = get_object_or_404(MessageThread, id=thread_id, participants=self.request.user)
        
        # Create the message
        message = serializer.save(
            thread=thread,
            sender=self.request.user,
            is_read=False
        )
        
        # Update thread last message timestamp
        thread.last_message_at = timezone.now()
        thread.save()
        
        # Create receipts for all participants
        for participant in thread.participants.all():
            if participant != self.request.user:
                MessageReceipt.objects.create(
                    message=message,
                    user=participant,
                    is_read=False
                )
        
        return message


# COMMUNITY FEATURES

class CommunityListView(generics.ListAPIView):
    """List all public communities or those the user is a member of"""
    serializer_class = CommunitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['visibility', 'primary_category']
    search_fields = ['name', 'description', 'focus_tags']
    ordering_fields = ['member_count', 'post_count', 'created_at']
    ordering = ['-member_count']
    
    def get_queryset(self):
        # Get public communities and those the user is a member of
        if self.request.user.is_authenticated:
            return Community.objects.filter(
                Q(visibility='public') | 
                Q(members=self.request.user)
            ).distinct()
        else:
            return Community.objects.filter(visibility='public')


class CommunityCreateView(generics.CreateAPIView):
    """Create a new community"""
    serializer_class = CommunityCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        community = serializer.save(creator=self.request.user)
        
        # Add creator as admin and member
        community.admins.add(self.request.user)
        
        # Create membership
        CommunityMembership.objects.create(
            community=community,
            user=self.request.user,
            status='admin'
        )
        
        return community


class CommunityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a community"""
    serializer_class = CommunityDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            # User can view public communities or those they're a member of
            return Community.objects.filter(
                Q(visibility='public') | 
                Q(members=self.request.user)
            ).distinct()
        else:
            return Community.objects.filter(visibility='public')


class CommunityJoinView(generics.CreateAPIView):
    """Join a community"""
    serializer_class = CommunityMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        community_id = self.kwargs.get('pk')
        community = get_object_or_404(Community, id=community_id)
        
        # Check if membership already exists
        if CommunityMembership.objects.filter(community=community, user=self.request.user).exists():
            raise ValidationError("You are already a member of this community")
        
        # For private communities, set status to pending
        if community.visibility == 'private':
            status = 'pending'
        else:
            status = 'active'
            # Increment member count for public communities
            community.member_count += 1
            community.save()
        
        return serializer.save(
            community=community,
            user=self.request.user,
            status=status
        )


class CommunityLeaveView(generics.DestroyAPIView):
    """Leave a community"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CommunityMembership.objects.filter(user=self.request.user)
    
    def get_object(self):
        community_id = self.kwargs.get('pk')
        return get_object_or_404(
            CommunityMembership,
            community_id=community_id,
            user=self.request.user
        )
    
    def perform_destroy(self, instance):
        # Decrement member count
        community = instance.community
        community.member_count -= 1
        community.save()
        
        # Remove from admins if applicable
        if self.request.user in community.admins.all():
            community.admins.remove(self.request.user)
        
        super().perform_destroy(instance)


class CommunityPostListView(generics.ListCreateAPIView):
    """List or create posts in a community"""
    serializer_class = CommunityPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['post_type', 'is_pinned']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'view_count', 'comment_count', 'like_count']
    ordering = ['-is_pinned', '-created_at']
    
    def get_queryset(self):
        community_id = self.kwargs.get('community_id')
        community = get_object_or_404(Community, id=community_id)
        
        # For private communities, ensure user is a member
        if community.visibility == 'private':
            if not self.request.user.is_authenticated:
                return CommunityPost.objects.none()
            
            is_member = CommunityMembership.objects.filter(
                community=community,
                user=self.request.user,
                status__in=['active', 'moderator', 'admin']
            ).exists()
            
            if not is_member:
                return CommunityPost.objects.none()
        
        # Return non-hidden posts
        return CommunityPost.objects.filter(
            community_id=community_id,
            is_hidden=False
        )
    
    def perform_create(self, serializer):
        community_id = self.kwargs.get('community_id')
        community = get_object_or_404(Community, id=community_id)
        
        # Ensure user is a member of the community
        is_member = CommunityMembership.objects.filter(
            community=community,
            user=self.request.user,
            status__in=['active', 'moderator', 'admin']
        ).exists()
        
        if not is_member:
            raise PermissionDenied("You must be a member to post in this community")
        
        post = serializer.save(
            community=community,
            author=self.request.user
        )
        
        # Increment post count
        community.post_count += 1
        community.save()
        
        return post


class CommunityPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a community post"""
    serializer_class = CommunityPostDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        community_id = self.kwargs.get('community_id')
        
        # For private communities, ensure user is a member
        community = get_object_or_404(Community, id=community_id)
        if community.visibility == 'private':
            if not self.request.user.is_authenticated:
                return CommunityPost.objects.none()
            
            is_member = CommunityMembership.objects.filter(
                community=community,
                user=self.request.user,
                status__in=['active', 'moderator', 'admin']
            ).exists()
            
            if not is_member:
                return CommunityPost.objects.none()
        
        return CommunityPost.objects.filter(
            community_id=community_id,
            is_hidden=False
        )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        
        return super().retrieve(request, *args, **kwargs)


class PostCommentListCreateView(generics.ListCreateAPIView):
    """List or create comments on a post"""
    serializer_class = PostCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        community_id = self.kwargs.get('community_id')
        post_id = self.kwargs.get('post_id')
        
        # Get top-level comments (no parent)
        return PostComment.objects.filter(
            post_id=post_id,
            post__community_id=community_id,
            parent_comment__isnull=True,
            is_hidden=False
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        community_id = self.kwargs.get('community_id')
        post_id = self.kwargs.get('post_id')
        
        # Verify post belongs to community
        post = get_object_or_404(CommunityPost, id=post_id, community_id=community_id)
        
        # Check if post is closed
        if post.is_closed:
            raise ValidationError("Comments are closed for this post")
        
        # Create comment
        comment = serializer.save(
            post=post,
            author=self.request.user
        )
        
        # Increment comment count
        post.comment_count += 1
        post.save(update_fields=['comment_count'])
        
        return comment


class CommentReplyListCreateView(generics.ListCreateAPIView):
    """List or create replies to a comment"""
    serializer_class = PostCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        comment_id = self.kwargs.get('comment_id')
        
        return PostComment.objects.filter(
            parent_comment_id=comment_id,
            is_hidden=False
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        community_id = self.kwargs.get('community_id')
        post_id = self.kwargs.get('post_id')
        comment_id = self.kwargs.get('comment_id')
        
        # Verify post belongs to community
        post = get_object_or_404(CommunityPost, id=post_id, community_id=community_id)
        
        # Verify parent comment exists
        parent_comment = get_object_or_404(PostComment, id=comment_id, post_id=post_id)
        
        # Check if post is closed
        if post.is_closed:
            raise ValidationError("Comments are closed for this post")
        
        # Create reply
        reply = serializer.save(
            post=post,
            author=self.request.user,
            parent_comment=parent_comment
        )
        
        # Increment comment count
        post.comment_count += 1
        post.save(update_fields=['comment_count'])
        
        return reply


# ENHANCED GAMIFICATION SYSTEM

class AchievementListView(generics.ListAPIView):
    """List all achievements with user progress"""
    serializer_class = AchievementWithProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user).order_by('achievement_type', 'name')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context


class UserBadgeListView(generics.ListAPIView):
    """List all badges earned by the user"""
    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserAchievement.objects.filter(
            user=self.request.user,
            is_unlocked=True
        ).order_by('-unlocked_at')


class LeaderboardView(generics.ListAPIView):
    """Global leaderboard for various categories"""
    serializer_class = LeaderboardEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        category = self.request.query_params.get('category', 'points')
        timeframe = self.request.query_params.get('timeframe', 'all_time')
        
        # Map category to field in UserStats
        field_mapping = {
            'points': 'total_points',
            'distance': 'total_distance_km',
            'rides': 'total_rides',
            'achievements': 'achievements_unlocked',
        }
        
        # Map timeframe to query filter
        today = timezone.now().date()
        time_filters = {}
        if timeframe == 'weekly':
            start_of_week = today - timedelta(days=today.weekday())
            time_filters = {'updated_at__gte': start_of_week}
        elif timeframe == 'monthly':
            start_of_month = today.replace(day=1)
            time_filters = {'updated_at__gte': start_of_month}
        
        # Get field to order by
        order_field = field_mapping.get(category, 'total_points')
        
        # Get top users by the selected field
        return UserStats.objects.filter(
            **time_filters
        ).select_related('user').order_by(f'-{order_field}')[:100]


class UserPointsHistoryView(generics.ListAPIView):
    """History of user's point transactions"""
    serializer_class = PointTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PointTransaction.objects.filter(
            user=self.request.user
        ).order_by('-created_at')


class UserRankingView(generics.RetrieveAPIView):
    """Get current user's rankings across categories"""
    serializer_class = UserRankingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        try:
            return self.request.user.stats
        except UserStats.DoesNotExist:
            # Create stats object if it doesn't exist
            return UserStats.objects.create(user=self.request.user) 