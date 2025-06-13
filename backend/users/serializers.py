from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import (
    User, RidingProfile, UserGarage, RideSession, 
    UserAchievement, UserStats, UserFriend, MessageThread, Message,
    Community, CommunityMembership, CommunityPost, PostComment,
    PointTransaction
)
from bikes.models import Motorcycle
from bikes.serializers import MotorcycleListSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration with validation"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'country', 'state_province', 'city'
        ]
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create related profile objects
        RidingProfile.objects.create(user=user)
        UserStats.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """User login serializer"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Find user by email
            try:
                user = User.objects.get(email=email)
                username = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
            
            user = authenticate(request=self.context.get('request'),
                              username=username, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
                
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile with privacy controls"""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'date_of_birth', 'country', 'state_province', 'city',
            'timezone', 'avatar_url', 'bio', 'website', 'profile_visibility',
            'show_riding_stats', 'show_garage', 'metric_units', 
            'email_notifications', 'push_notifications', 'marketing_emails',
            'is_verified', 'is_premium', 'last_active', 'join_date'
        ]
        read_only_fields = [
            'id', 'is_verified', 'is_premium', 'last_active', 'join_date'
        ]
        extra_kwargs = {
            'email': {'read_only': True},  # Email changes require verification
        }


class RidingProfileSerializer(serializers.ModelSerializer):
    """Riding profile and preferences"""
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)
    primary_riding_style_display = serializers.CharField(source='get_primary_riding_style_display', read_only=True)
    preferred_power_range_display = serializers.CharField(source='get_preferred_power_range_display', read_only=True)
    
    class Meta:
        model = RidingProfile
        fields = [
            'experience_level', 'experience_level_display', 'years_riding', 'license_date',
            'primary_riding_style', 'primary_riding_style_display', 'secondary_riding_styles',
            'favorite_riding_conditions', 'preferred_power_range', 'preferred_power_range_display',
            'comfort_vs_performance', 'safety_priority', 'track_experience', 'racing_experience',
            'diy_maintenance', 'tuning_interest', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserGarageSerializer(serializers.ModelSerializer):
    """User garage with motorcycle details"""
    motorcycle = MotorcycleListSerializer(read_only=True)
    motorcycle_id = serializers.IntegerField(write_only=True)
    ownership_status_display = serializers.CharField(source='get_ownership_status_display', read_only=True)
    
    class Meta:
        model = UserGarage
        fields = [
            'id', 'motorcycle', 'motorcycle_id', 'ownership_status', 'ownership_status_display',
            'purchase_date', 'purchase_price', 'current_mileage_km', 'modifications',
            'tune_count', 'is_tuned', 'overall_rating', 'pros', 'cons', 'is_public',
            'nickname', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_motorcycle_id(self, value):
        try:
            motorcycle = Motorcycle.objects.get(id=value)
            return value
        except Motorcycle.DoesNotExist:
            raise serializers.ValidationError("Motorcycle not found")


class RideSessionSerializer(serializers.ModelSerializer):
    """Ride session tracking"""
    motorcycle = MotorcycleListSerializer(read_only=True)
    motorcycle_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    garage_bike_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    ride_type_display = serializers.CharField(source='get_ride_type_display', read_only=True)
    weather_condition_display = serializers.CharField(source='get_weather_condition_display', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = RideSession
        fields = [
            'id', 'motorcycle', 'motorcycle_id', 'garage_bike_id', 'ride_type', 'ride_type_display',
            'start_time', 'end_time', 'duration_minutes', 'duration_hours',
            'start_location', 'end_location', 'route_description',
            'start_latitude', 'start_longitude', 'end_latitude', 'end_longitude',
            'distance_km', 'avg_speed_kmh', 'max_speed_kmh', 'fuel_consumed_liters',
            'weather_condition', 'weather_condition_display', 'temperature_celsius',
            'enjoyment_rating', 'safety_rating', 'notes', 'is_public', 'share_route',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, attrs):
        # Ensure either motorcycle_id or garage_bike_id is provided
        if not attrs.get('motorcycle_id') and not attrs.get('garage_bike_id'):
            raise serializers.ValidationError("Either motorcycle_id or garage_bike_id must be provided")
        return attrs


class UserAchievementSerializer(serializers.ModelSerializer):
    """User achievements and progress"""
    achievement_type_display = serializers.CharField(source='get_achievement_type_display', read_only=True)
    badge_level_display = serializers.CharField(source='get_badge_level_display', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserAchievement
        fields = [
            'id', 'achievement_type', 'achievement_type_display', 'name', 'description',
            'icon_url', 'target_value', 'current_value', 'progress_percentage',
            'is_completed', 'completed_at', 'points_awarded', 'badge_level',
            'badge_level_display', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_progress_percentage(self, obj):
        if obj.target_value and obj.target_value > 0:
            return min(100, (float(obj.current_value) / float(obj.target_value)) * 100)
        return 0


class UserStatsSerializer(serializers.ModelSerializer):
    """User statistics and rankings"""
    total_ride_time_hours = serializers.ReadOnlyField()
    avg_fuel_efficiency = serializers.ReadOnlyField()
    
    class Meta:
        model = UserStats
        fields = [
            'total_rides', 'total_distance_km', 'total_ride_time_minutes', 'total_ride_time_hours',
            'avg_ride_distance_km', 'avg_ride_duration_minutes', 'max_speed_achieved_kmh',
            'avg_speed_overall_kmh', 'total_fuel_consumed_liters', 'avg_fuel_efficiency',
            'total_points', 'achievements_unlocked', 'tunes_downloaded', 'tunes_uploaded',
            'community_posts', 'distance_rank', 'points_rank', 'safety_rank',
            'current_ride_streak_days', 'longest_ride_streak_days', 'last_ride_date',
            'updated_at'
        ]
        read_only_fields = ['updated_at']


class UserPublicProfileSerializer(serializers.ModelSerializer):
    """Public user profile (limited fields)"""
    full_name = serializers.ReadOnlyField()
    riding_profile = RidingProfileSerializer(read_only=True)
    stats = UserStatsSerializer(read_only=True)
    total_garage_bikes = serializers.SerializerMethodField()
    total_achievements = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'avatar_url', 'bio', 'website',
            'country', 'state_province', 'city', 'is_verified', 'is_premium',
            'join_date', 'riding_profile', 'stats', 'total_garage_bikes', 'total_achievements'
        ]
    
    def get_total_garage_bikes(self, obj):
        return obj.garage.filter(ownership_status='owned').count()
    
    def get_total_achievements(self, obj):
        return obj.achievements.filter(is_completed=True).count()


class PasswordChangeSerializer(serializers.Serializer):
    """Password change serializer"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value


class EmailChangeSerializer(serializers.Serializer):
    """Email change serializer with verification"""
    new_email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate_new_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use")
        return value
    
    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Password is incorrect")
        return value


class UserDashboardSerializer(serializers.ModelSerializer):
    """User dashboard with comprehensive data"""
    riding_profile = RidingProfileSerializer(read_only=True)
    stats = UserStatsSerializer(read_only=True)
    recent_rides = serializers.SerializerMethodField()
    recent_achievements = serializers.SerializerMethodField()
    garage_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'avatar_url', 'is_verified', 'is_premium',
            'riding_profile', 'stats', 'recent_rides', 'recent_achievements', 'garage_summary'
        ]
    
    def get_recent_rides(self, obj):
        recent_rides = obj.ride_sessions.order_by('-start_time')[:5]
        return RideSessionSerializer(recent_rides, many=True).data
    
    def get_recent_achievements(self, obj):
        recent_achievements = obj.achievements.filter(is_completed=True).order_by('-completed_at')[:5]
        return UserAchievementSerializer(recent_achievements, many=True).data
    
    def get_garage_summary(self, obj):
        garage = obj.garage.filter(ownership_status='owned').select_related('motorcycle__manufacturer')
        return {
            'total_bikes': garage.count(),
            'bikes': UserGarageSerializer(garage, many=True).data
        }


# PHASE 2 ENHANCEMENT: SOCIAL MESSAGING SYSTEM SERIALIZERS

class UserFriendSerializer(serializers.ModelSerializer):
    """Serializer for user friendships"""
    friend = UserPublicProfileSerializer()
    
    class Meta:
        model = UserFriend
        fields = ['id', 'friend', 'status', 'created_at', 'updated_at']


class UserFriendRequestSerializer(serializers.ModelSerializer):
    """Serializer for friend requests"""
    user = UserPublicProfileSerializer()
    
    class Meta:
        model = UserFriend
        fields = ['id', 'user', 'status', 'created_at']


class UserFriendCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating friend requests"""
    friend_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = UserFriend
        fields = ['friend_id']
    
    def validate_friend_id(self, value):
        # Prevent self-friending
        if value == self.context['request'].user.id:
            raise serializers.ValidationError("You cannot send a friend request to yourself")
        
        # Check if friendship already exists
        if UserFriend.objects.filter(
            (Q(user=self.context['request'].user, friend_id=value) |
             Q(user_id=value, friend=self.context['request'].user))
        ).exists():
            raise serializers.ValidationError("Friendship already exists")
        
        return value
    
    def create(self, validated_data):
        return UserFriend.objects.create(
            user=self.context['request'].user,
            friend_id=validated_data['friend_id']
        )


class UserFriendActionSerializer(serializers.ModelSerializer):
    """Serializer for friend request actions"""
    class Meta:
        model = UserFriend
        fields = ['status']
    
    def validate_status(self, value):
        if value not in ['accepted', 'rejected', 'blocked']:
            raise serializers.ValidationError("Invalid status")
        return value


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for message threads"""
    participants = UserPublicProfileSerializer(many=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageThread
        fields = ['id', 'title', 'is_group_thread', 'participants', 'last_message', 'unread_count', 'last_message_at']
    
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        if last_message:
            return {
                'id': last_message.id,
                'text': last_message.text,
                'sender': last_message.sender.username,
                'created_at': last_message.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        return obj.messages.filter(
            sender__id__ne=self.context['request'].user.id,
            is_read=False
        ).count()


class MessageThreadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating message threads"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    
    class Meta:
        model = MessageThread
        fields = ['title', 'is_group_thread', 'participant_ids']
    
    def validate_participant_ids(self, value):
        # Ensure at least one participant
        if not value:
            raise serializers.ValidationError("At least one participant is required")
        
        # Remove duplicates
        value = list(set(value))
        
        # Verify all users exist
        User = get_user_model()
        existing_users = set(User.objects.filter(id__in=value).values_list('id', flat=True))
        if len(existing_users) != len(value):
            raise serializers.ValidationError("One or more users do not exist")
        
        return value
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids')
        thread = MessageThread.objects.create(**validated_data)
        
        # Add participants
        thread.participants.add(self.context['request'].user)
        thread.participants.add(*participant_ids)
        
        return thread


class MessageThreadDetailSerializer(MessageThreadSerializer):
    """Detailed serializer for message threads"""
    class Meta(MessageThreadSerializer.Meta):
        fields = MessageThreadSerializer.Meta.fields + ['created_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages"""
    sender = UserPublicProfileSerializer()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'text', 'has_attachment', 'attachment_url', 'attachment_type',
                 'is_read', 'read_at', 'is_system_message', 'is_ride_share', 'ride_session_id',
                 'created_at']


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating messages"""
    class Meta:
        model = Message
        fields = ['text', 'has_attachment', 'attachment_url', 'attachment_type',
                 'is_ride_share', 'ride_session_id']


# COMMUNITY FEATURES SERIALIZERS

class CommunitySerializer(serializers.ModelSerializer):
    """Serializer for communities"""
    creator = UserPublicProfileSerializer()
    member_count = serializers.IntegerField(read_only=True)
    post_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Community
        fields = ['id', 'name', 'short_description', 'visibility', 'creator',
                 'avatar_url', 'banner_url', 'location', 'website',
                 'focus_tags', 'primary_category', 'member_count', 'post_count',
                 'created_at']


class CommunityCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating communities"""
    class Meta:
        model = Community
        fields = ['name', 'description', 'short_description', 'visibility',
                 'avatar_url', 'banner_url', 'location', 'website',
                 'focus_tags', 'primary_category']


class CommunityDetailSerializer(CommunitySerializer):
    """Detailed serializer for communities"""
    description = serializers.CharField()
    admins = UserPublicProfileSerializer(many=True)
    
    class Meta(CommunitySerializer.Meta):
        fields = CommunitySerializer.Meta.fields + ['description', 'admins', 'updated_at']


class CommunityMembershipSerializer(serializers.ModelSerializer):
    """Serializer for community memberships"""
    user = UserPublicProfileSerializer()
    
    class Meta:
        model = CommunityMembership
        fields = ['id', 'user', 'status', 'join_date', 'last_active_date',
                 'receive_notifications']


class CommunityPostSerializer(serializers.ModelSerializer):
    """Serializer for community posts"""
    author = UserPublicProfileSerializer()
    comment_count = serializers.IntegerField(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = CommunityPost
        fields = ['id', 'title', 'content', 'has_images', 'images',
                 'post_type', 'author', 'is_pinned', 'is_closed',
                 'comment_count', 'like_count', 'created_at']


class CommunityPostDetailSerializer(CommunityPostSerializer):
    """Detailed serializer for community posts"""
    view_count = serializers.IntegerField(read_only=True)
    
    class Meta(CommunityPostSerializer.Meta):
        fields = CommunityPostSerializer.Meta.fields + ['view_count', 'updated_at']


class PostCommentSerializer(serializers.ModelSerializer):
    """Serializer for post comments"""
    author = UserPublicProfileSerializer()
    like_count = serializers.IntegerField(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = PostComment
        fields = ['id', 'content', 'has_image', 'image_url',
                 'author', 'like_count', 'replies', 'created_at']
    
    def get_replies(self, obj):
        if obj.parent_comment is None:  # Only get replies for top-level comments
            replies = obj.replies.filter(is_hidden=False).order_by('created_at')
            return PostCommentSerializer(replies, many=True).data
        return []


# ENHANCED GAMIFICATION SERIALIZERS

class AchievementWithProgressSerializer(serializers.ModelSerializer):
    """Serializer for achievements with user progress"""
    progress_percentage = serializers.SerializerMethodField()
    is_completed = serializers.BooleanField(source='is_completed', read_only=True)
    completed_at = serializers.DateTimeField(source='completed_at', read_only=True)
    badge_level_display = serializers.CharField(source='get_badge_level_display', read_only=True)
    achievement_type_display = serializers.CharField(source='get_achievement_type_display', read_only=True)

    class Meta:
        model = UserAchievement
        fields = [
            'id', 'achievement_type', 'achievement_type_display', 'name', 'description',
            'icon_url', 'target_value', 'current_value', 'progress_percentage',
            'is_completed', 'completed_at', 'points_awarded', 'badge_level',
            'badge_level_display', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_progress_percentage(self, obj):
        if obj.target_value and obj.target_value > 0:
            return min(100, (float(obj.current_value) / float(obj.target_value)) * 100)
        return 0


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Serializer for leaderboard entries"""
    user = UserPublicProfileSerializer()
    rank = serializers.SerializerMethodField()
    
    class Meta:
        model = UserStats
        fields = ['user', 'total_points', 'total_distance_km', 'total_rides',
                 'achievements_unlocked', 'rank']
    
    def get_rank(self, obj):
        # Get the user's rank in the current category
        category = self.context.get('category', 'points')
        field_mapping = {
            'points': 'total_points',
            'distance': 'total_distance_km',
            'rides': 'total_rides',
            'achievements': 'achievements_unlocked',
        }
        order_field = field_mapping.get(category, 'total_points')
        
        # Count users with higher values
        return UserStats.objects.filter(
            **{f'{order_field}__gt': getattr(obj, order_field)}
        ).count() + 1


class PointTransactionSerializer(serializers.ModelSerializer):
    """Serializer for point transactions"""
    class Meta:
        model = PointTransaction
        fields = ['id', 'points', 'transaction_type', 'description', 'created_at']


class UserRankingSerializer(serializers.ModelSerializer):
    """Serializer for user rankings across categories"""
    user = UserPublicProfileSerializer()
    points_rank = serializers.SerializerMethodField()
    distance_rank = serializers.SerializerMethodField()
    rides_rank = serializers.SerializerMethodField()
    achievements_rank = serializers.SerializerMethodField()
    
    class Meta:
        model = UserStats
        fields = ['user', 'total_points', 'total_distance_km', 'total_rides',
                 'achievements_unlocked', 'points_rank', 'distance_rank',
                 'rides_rank', 'achievements_rank']
    
    def get_rank(self, obj, field):
        # Count users with higher values
        return UserStats.objects.filter(
            **{f'{field}__gt': getattr(obj, field)}
        ).count() + 1
    
    def get_points_rank(self, obj):
        return self.get_rank(obj, 'total_points')
    
    def get_distance_rank(self, obj):
        return self.get_rank(obj, 'total_distance_km')
    
    def get_rides_rank(self, obj):
        return self.get_rank(obj, 'total_rides')
    
    def get_achievements_rank(self, obj):
        return self.get_rank(obj, 'achievements_unlocked') 