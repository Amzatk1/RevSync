from django.urls import path
from . import views

urlpatterns = [
    # 🚀 User onboarding
    path('onboarding/', views.OnboardingAPIView.as_view(), name='ai-onboarding'),
    
    # 🎯 AI recommendations
    path('recommendations/', views.AIRecommendationsAPIView.as_view(), name='ai-recommendations'),
    
    # 📊 User interaction tracking
    path('track-interaction/', views.track_interaction, name='track-interaction'),
    
    # 🧠 User insights and analytics
    path('user-insights/', views.get_user_insights, name='user-insights'),
] 