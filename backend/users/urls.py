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
    
    # Ride Sessions
    path('rides/', views.RideSessionListView.as_view(), name='ride-sessions'),
    path('rides/<int:pk>/', views.RideSessionDetailView.as_view(), name='ride-session-detail'),
    path('rides/start/', views.start_ride_session, name='start-ride-session'),
    path('rides/<int:session_id>/end/', views.end_ride_session, name='end-ride-session'),
    
    # Achievements & Stats
    path('achievements/', views.UserAchievementsView.as_view(), name='user-achievements'),
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('analytics/', views.user_analytics, name='user-analytics'),
    
    # Social Features
    path('leaderboard/', views.user_leaderboard, name='user-leaderboard'),
    path('platform-stats/', views.platform_stats, name='platform-stats'),
] 