from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('auth/login/', views.UserLoginView.as_view(), name='user-login'),
    path('auth/password/change/', views.PasswordChangeView.as_view(), name='password-change'),
    path('auth/email/change/', views.EmailChangeView.as_view(), name='email-change'),
    
    # User Profile
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/riding/', views.RidingProfileView.as_view(), name='riding-profile'),
    path('profile/dashboard/', views.UserDashboardView.as_view(), name='user-dashboard'),
    path('profile/<str:username>/', views.PublicProfileView.as_view(), name='public-profile'),
    
    # User Garage
    path('garage/', views.UserGarageListView.as_view(), name='user-garage-list'),
    path('garage/<int:pk>/', views.UserGarageDetailView.as_view(), name='user-garage-detail'),
    
    # Achievements & Stats
    path('achievements/', views.UserAchievementsView.as_view(), name='user-achievements'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('analytics/', views.user_analytics, name='user-analytics'),
    
    # Social Features
    path('leaderboard/', views.user_leaderboard, name='user-leaderboard'),
    path('platform-stats/', views.platform_stats, name='platform-stats'),

    # PHASE 2 ENHANCEMENT: SOCIAL MESSAGING SYSTEM URLS

    # Friend system
    path('friends/', views.UserFriendListView.as_view(), name='friend-list'),
    path('friends/requests/', views.UserFriendRequestsView.as_view(), name='friend-requests'),
    path('friends/add/', views.UserFriendCreateView.as_view(), name='friend-add'),
    path('friends/<int:pk>/action/', views.UserFriendActionView.as_view(), name='friend-action'),

    # Messaging system
    path('messages/threads/', views.MessageThreadListView.as_view(), name='message-thread-list'),
    path('messages/threads/create/', views.MessageThreadCreateView.as_view(), name='message-thread-create'),
    path('messages/threads/<int:pk>/', views.MessageThreadDetailView.as_view(), name='message-thread-detail'),
    path('messages/threads/<int:thread_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('messages/threads/<int:thread_id>/messages/create/', views.MessageCreateView.as_view(), name='message-create'),

    # Community features
    path('communities/', views.CommunityListView.as_view(), name='community-list'),
    path('communities/create/', views.CommunityCreateView.as_view(), name='community-create'),
    path('communities/<int:pk>/', views.CommunityDetailView.as_view(), name='community-detail'),
    path('communities/<int:pk>/join/', views.CommunityJoinView.as_view(), name='community-join'),
    path('communities/<int:pk>/leave/', views.CommunityLeaveView.as_view(), name='community-leave'),
    path('communities/<int:community_id>/posts/', views.CommunityPostListView.as_view(), name='community-post-list'),
    path('communities/<int:community_id>/posts/<int:pk>/', views.CommunityPostDetailView.as_view(), name='community-post-detail'),
    path('communities/<int:community_id>/posts/<int:post_id>/comments/', views.PostCommentListCreateView.as_view(), name='post-comment-list'),
    path('communities/<int:community_id>/posts/<int:post_id>/comments/<int:comment_id>/replies/', views.CommentReplyListCreateView.as_view(), name='comment-reply-list'),

    # Enhanced gamification
    path('achievements/', views.AchievementListView.as_view(), name='achievement-list'),
    path('badges/', views.UserBadgeListView.as_view(), name='badge-list'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('points/history/', views.UserPointsHistoryView.as_view(), name='points-history'),
    path('ranking/', views.UserRankingView.as_view(), name='user-ranking'),
] 