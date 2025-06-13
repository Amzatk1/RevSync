from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from bikes.models import Motorcycle, Manufacturer
import uuid


class User(AbstractUser):
    """Extended user model for RevSync platform"""
    # Profile Information
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Location
    country = models.CharField(max_length=100, blank=True)
    state_province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Profile Settings
    avatar_url = models.URLField(blank=True)
    bio = models.TextField(max_length=500, blank=True)
    website = models.URLField(blank=True)
    
    # Privacy Settings
    profile_visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('friends', 'Friends Only'),
            ('private', 'Private'),
        ],
        default='public'
    )
    show_riding_stats = models.BooleanField(default=True)
    show_garage = models.BooleanField(default=True)
    
    # Platform Preferences
    metric_units = models.BooleanField(default=True)  # True for metric, False for imperial
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    
    # Account Status
    is_verified = models.BooleanField(default=False, db_index=True)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    is_premium = models.BooleanField(default=False, db_index=True)
    premium_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Activity Tracking
    last_active = models.DateTimeField(auto_now=True)
    join_date = models.DateTimeField(auto_now_add=True)
    login_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_premium']),
            models.Index(fields=['last_active']),
        ]

    def __str__(self):
        return f"{self.username} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class RidingProfile(models.Model):
    """User's riding profile and preferences"""
    EXPERIENCE_LEVELS = [
        ('beginner', 'Beginner (0-2 years)'),
        ('intermediate', 'Intermediate (2-5 years)'),
        ('advanced', 'Advanced (5-10 years)'),
        ('expert', 'Expert (10+ years)'),
        ('professional', 'Professional Rider'),
    ]
    
    RIDING_STYLES = [
        ('street', 'Street Riding'),
        ('track', 'Track/Racing'),
        ('touring', 'Touring'),
        ('sport', 'Sport Riding'),
        ('cruising', 'Cruising'),
        ('adventure', 'Adventure/Dual Sport'),
        ('commuting', 'Commuting'),
        ('stunting', 'Stunting'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='riding_profile')
    
    # Experience
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS, default='beginner')
    years_riding = models.PositiveIntegerField(default=0)
    license_date = models.DateField(null=True, blank=True)
    
    # Riding Preferences
    primary_riding_style = models.CharField(max_length=20, choices=RIDING_STYLES, default='street')
    secondary_riding_styles = models.JSONField(default=list, blank=True)
    favorite_riding_conditions = models.JSONField(default=list, blank=True)  # ['dry', 'wet', 'night', 'highway', 'twisties']
    
    # Performance Preferences
    preferred_power_range = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low Power (0-50 HP)'),
            ('medium', 'Medium Power (50-100 HP)'),
            ('high', 'High Power (100-150 HP)'),
            ('extreme', 'Extreme Power (150+ HP)'),
        ],
        default='medium'
    )
    
    comfort_vs_performance = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="1=Comfort focused, 10=Performance focused"
    )
    
    # Safety
    safety_priority = models.PositiveSmallIntegerField(
        default=8,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="1=Risk taker, 10=Safety first"
    )
    track_experience = models.BooleanField(default=False)
    racing_experience = models.BooleanField(default=False)
    
    # Maintenance
    diy_maintenance = models.BooleanField(default=False)
    tuning_interest = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="1=Stock only, 10=Heavy modification"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'riding_profiles'

    def __str__(self):
        return f"{self.user.username}'s Riding Profile"


class UserGarage(models.Model):
    """User's motorcycle garage"""
    OWNERSHIP_STATUS = [
        ('owned', 'Currently Owned'),
        ('previously_owned', 'Previously Owned'),
        ('test_ridden', 'Test Ridden'),
        ('wishlist', 'Wishlist'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='garage')
    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE)
    
    # Ownership Details
    ownership_status = models.CharField(max_length=20, choices=OWNERSHIP_STATUS, default='owned')
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_mileage_km = models.PositiveIntegerField(null=True, blank=True)
    
    # Customizations
    modifications = models.JSONField(default=list, blank=True)  # List of mods
    tune_count = models.PositiveIntegerField(default=0)
    is_tuned = models.BooleanField(default=False)
    
    # User Experience
    overall_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    pros = models.TextField(blank=True)
    cons = models.TextField(blank=True)
    
    # Privacy
    is_public = models.BooleanField(default=True)
    
    # Metadata
    nickname = models.CharField(max_length=100, blank=True)  # User's nickname for this bike
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_garage'
        unique_together = ['user', 'motorcycle', 'ownership_status']
        indexes = [
            models.Index(fields=['user', 'ownership_status']),
            models.Index(fields=['motorcycle']),
            models.Index(fields=['is_public']),
        ]

    def __str__(self):
        return f"{self.user.username}'s {self.motorcycle.full_name}"


class RideSession(models.Model):
    """Individual riding sessions for tracking and analytics"""
    RIDE_TYPES = [
        ('commute', 'Commute'),
        ('leisure', 'Leisure Ride'),
        ('track', 'Track Day'),
        ('touring', 'Touring'),
        ('test', 'Test Ride'),
        ('maintenance', 'Maintenance Run'),
    ]
    
    WEATHER_CONDITIONS = [
        ('sunny', 'Sunny'),
        ('cloudy', 'Cloudy'),
        ('rainy', 'Rainy'),
        ('windy', 'Windy'),
        ('foggy', 'Foggy'),
        ('snow', 'Snow'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ride_sessions')
    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE, null=True, blank=True)
    garage_bike = models.ForeignKey(UserGarage, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Ride Details
    ride_type = models.CharField(max_length=20, choices=RIDE_TYPES, default='leisure')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Location & Route
    start_location = models.CharField(max_length=200, blank=True)
    end_location = models.CharField(max_length=200, blank=True)
    route_description = models.TextField(blank=True)
    start_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    start_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    end_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    end_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Performance Data
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    avg_speed_kmh = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_speed_kmh = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fuel_consumed_liters = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Environmental
    weather_condition = models.CharField(max_length=20, choices=WEATHER_CONDITIONS, blank=True)
    temperature_celsius = models.IntegerField(null=True, blank=True)
    
    # User Experience
    enjoyment_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    safety_rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    notes = models.TextField(blank=True)
    
    # Social Features
    is_public = models.BooleanField(default=False)
    share_route = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ride_sessions'
        indexes = [
            models.Index(fields=['user', '-start_time']),
            models.Index(fields=['motorcycle']),
            models.Index(fields=['ride_type']),
            models.Index(fields=['is_public']),
        ]
        ordering = ['-start_time']

    def __str__(self):
        bike_name = self.motorcycle.full_name if self.motorcycle else "Unknown Bike"
        return f"{self.user.username} - {bike_name} ({self.start_time.date()})"

    @property
    def duration_hours(self):
        if self.duration_minutes:
            return round(self.duration_minutes / 60, 2)
        return None


class UserAchievement(models.Model):
    """User achievements and gamification"""
    ACHIEVEMENT_TYPES = [
        ('distance', 'Distance Milestone'),
        ('rides', 'Ride Count'),
        ('speed', 'Speed Achievement'),
        ('safety', 'Safety Record'),
        ('social', 'Social Engagement'),
        ('tuning', 'Tuning Expertise'),
        ('platform', 'Platform Usage'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon_url = models.URLField(blank=True)
    
    # Achievement Data
    target_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_completed = models.BooleanField(default=False, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Rewards
    points_awarded = models.PositiveIntegerField(default=0)
    badge_level = models.CharField(
        max_length=20,
        choices=[
            ('bronze', 'Bronze'),
            ('silver', 'Silver'),
            ('gold', 'Gold'),
            ('platinum', 'Platinum'),
        ],
        default='bronze'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_achievements'
        unique_together = ['user', 'achievement_type', 'name']
        indexes = [
            models.Index(fields=['user', 'is_completed']),
            models.Index(fields=['achievement_type']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class UserStats(models.Model):
    """Aggregated user statistics for performance tracking"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    
    # Riding Statistics
    total_rides = models.PositiveIntegerField(default=0)
    total_distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_ride_time_minutes = models.PositiveIntegerField(default=0)
    avg_ride_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    avg_ride_duration_minutes = models.PositiveIntegerField(default=0)
    
    # Performance
    max_speed_achieved_kmh = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    avg_speed_overall_kmh = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_fuel_consumed_liters = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Platform Activity
    total_points = models.PositiveIntegerField(default=0)
    achievements_unlocked = models.PositiveIntegerField(default=0)
    tunes_downloaded = models.PositiveIntegerField(default=0)
    tunes_uploaded = models.PositiveIntegerField(default=0)
    community_posts = models.PositiveIntegerField(default=0)
    
    # Rankings
    distance_rank = models.PositiveIntegerField(null=True, blank=True)
    points_rank = models.PositiveIntegerField(null=True, blank=True)
    safety_rank = models.PositiveIntegerField(null=True, blank=True)
    
    # Streaks
    current_ride_streak_days = models.PositiveIntegerField(default=0)
    longest_ride_streak_days = models.PositiveIntegerField(default=0)
    last_ride_date = models.DateField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_stats'

    def __str__(self):
        return f"{self.user.username}'s Stats"

    @property
    def total_ride_time_hours(self):
        return round(self.total_ride_time_minutes / 60, 2) if self.total_ride_time_minutes else 0

    @property
    def avg_fuel_efficiency(self):
        """Calculate average fuel efficiency in L/100km"""
        if self.total_distance_km and self.total_fuel_consumed_liters:
            return round((self.total_fuel_consumed_liters / self.total_distance_km) * 100, 2)
        return 0


# PHASE 2 ENHANCEMENT: SOCIAL MESSAGING SYSTEM

class UserFriend(models.Model):
    """User friends and connections"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friends')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friended_by')
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('blocked', 'Blocked'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_friends'
        unique_together = ['user', 'friend']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['friend', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} → {self.friend.username} ({self.get_status_display()})"


class MessageThread(models.Model):
    """Message threads between users"""
    participants = models.ManyToManyField(User, related_name='message_threads')
    title = models.CharField(max_length=100, blank=True)
    is_group_thread = models.BooleanField(default=False)
    
    # Group settings (for group threads)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_threads')
    avatar_url = models.URLField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    last_message_at = models.DateTimeField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_threads'
        indexes = [
            models.Index(fields=['is_group_thread']),
            models.Index(fields=['last_message_at']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        if self.title:
            return self.title
        elif self.is_group_thread:
            return f"Group Thread ({self.id})"
        else:
            participants = self.participants.all()
            if participants.count() >= 2:
                return f"{participants[0].username} & {participants[1].username}"
            return f"Thread {self.id}"


class Message(models.Model):
    """Individual messages in threads"""
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    
    # Content
    text = models.TextField()
    has_attachment = models.BooleanField(default=False)
    attachment_url = models.URLField(blank=True)
    attachment_type = models.CharField(max_length=50, blank=True)  # image, video, file, ride, tune
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Special types
    is_system_message = models.BooleanField(default=False)  # For notifications, alerts
    is_ride_share = models.BooleanField(default=False)
    ride_session_id = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['thread', '-created_at']),
            models.Index(fields=['sender']),
            models.Index(fields=['is_read']),
            models.Index(fields=['is_system_message']),
            models.Index(fields=['is_ride_share']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.thread}"


class MessageReceipt(models.Model):
    """Read receipts for messages"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='receipts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_receipts')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'message_receipts'
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        status = "Read" if self.is_read else "Unread"
        return f"{self.user.username}: {status} at {self.read_at or 'N/A'}"


class Community(models.Model):
    """Motorcycle communities and groups"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    short_description = models.CharField(max_length=200, blank=True)
    
    # Settings
    visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('private', 'Private'),
            ('hidden', 'Hidden'),
        ],
        default='public'
    )
    
    # Membership
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_communities')
    admins = models.ManyToManyField(User, related_name='administered_communities')
    members = models.ManyToManyField(User, through='CommunityMembership', related_name='communities')
    
    # Content
    avatar_url = models.URLField(blank=True)
    banner_url = models.URLField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    
    # Focus areas
    focus_tags = models.JSONField(default=list)  # ['sport_riding', 'track_days', 'maintenance']
    primary_category = models.CharField(
        max_length=50,
        choices=[
            ('riding_club', 'Riding Club'),
            ('brand_enthusiasts', 'Brand Enthusiasts'),
            ('technical', 'Technical Discussion'),
            ('track_racing', 'Track & Racing'),
            ('adventure', 'Adventure Riding'),
            ('custom_builds', 'Custom Builds'),
            ('beginner_focused', 'Beginner Focused'),
            ('local_rides', 'Local Rides'),
        ],
        default='riding_club'
    )
    
    # Stats
    member_count = models.PositiveIntegerField(default=0)
    post_count = models.PositiveIntegerField(default=0)
    event_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'communities'
        verbose_name_plural = 'Communities'
        indexes = [
            models.Index(fields=['visibility']),
            models.Index(fields=['primary_category']),
            models.Index(fields=['member_count']),
            models.Index(fields=['post_count']),
        ]
    
    def __str__(self):
        return self.name


class CommunityMembership(models.Model):
    """User membership in communities"""
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Membership status
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('active', 'Active Member'),
        ('moderator', 'Moderator'),
        ('admin', 'Administrator'),
        ('banned', 'Banned'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Activity
    join_date = models.DateTimeField(auto_now_add=True)
    last_active_date = models.DateTimeField(auto_now=True)
    
    # Notifications
    receive_notifications = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'community_memberships'
        unique_together = ['community', 'user']
        indexes = [
            models.Index(fields=['community', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['last_active_date']),
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.community.name} ({self.get_status_display()})"


class CommunityPost(models.Model):
    """Posts in community forums"""
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_posts')
    
    # Content
    title = models.CharField(max_length=200)
    content = models.TextField()
    has_images = models.BooleanField(default=False)
    images = models.JSONField(default=list)  # URLs to images
    
    # Type
    POST_TYPES = [
        ('discussion', 'Discussion'),
        ('question', 'Question'),
        ('event', 'Event Announcement'),
        ('ride_report', 'Ride Report'),
        ('build_log', 'Build Log'),
        ('review', 'Review'),
        ('poll', 'Poll'),
    ]
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='discussion')
    
    # Special content
    ride_session = models.ForeignKey('RideSession', on_delete=models.SET_NULL, null=True, blank=True, related_name='community_posts')
    garage_bike = models.ForeignKey('UserGarage', on_delete=models.SET_NULL, null=True, blank=True, related_name='community_posts')
    
    # Moderation
    is_pinned = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    
    # Stats
    view_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'community_posts'
        indexes = [
            models.Index(fields=['community', '-created_at']),
            models.Index(fields=['author']),
            models.Index(fields=['post_type']),
            models.Index(fields=['is_pinned', 'is_closed']),
            models.Index(fields=['comment_count']),
            models.Index(fields=['like_count']),
        ]
    
    def __str__(self):
        return f"{self.title} in {self.community.name}"


class PostComment(models.Model):
    """Comments on community posts"""
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_comments')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    # Content
    content = models.TextField()
    has_image = models.BooleanField(default=False)
    image_url = models.URLField(blank=True)
    
    # Moderation
    is_hidden = models.BooleanField(default=False)
    
    # Stats
    like_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'post_comments'
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['author']),
            models.Index(fields=['parent_comment']),
            models.Index(fields=['like_count']),
        ]
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"


class PointTransaction(models.Model):
    """Model for tracking point transactions"""
    TRANSACTION_TYPES = [
        ('achievement', 'Achievement Unlocked'),
        ('ride', 'Ride Completed'),
        ('social', 'Social Interaction'),
        ('purchase', 'Tune Purchase'),
        ('referral', 'User Referral'),
        ('bonus', 'Bonus Points'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='point_transactions')
    points = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.points} points" 