from django.urls import path
from . import views

app_name = 'tunes'

urlpatterns = [
    # Category and Type endpoints
    path('categories/', views.TuneCategoryListView.as_view(), name='category-list'),
    path('types/', views.TuneTypeListView.as_view(), name='type-list'),
    path('safety-ratings/', views.SafetyRatingListView.as_view(), name='safety-rating-list'),
    
    # Creator endpoints
    path('creators/', views.TuneCreatorListView.as_view(), name='creator-list'),
    path('creators/<int:pk>/', views.TuneCreatorDetailView.as_view(), name='creator-detail'),
    
    # Tune endpoints
    path('tunes/', views.TuneListView.as_view(), name='tune-list'),
    path('tunes/<uuid:pk>/', views.TuneDetailView.as_view(), name='tune-detail'),
    path('tunes/<uuid:tune_id>/reviews/', views.TuneReviewListView.as_view(), name='tune-reviews'),
    
    # Special tune collections
    path('tunes/featured/', views.FeaturedTunesView.as_view(), name='featured-tunes'),
    path('tunes/popular/', views.PopularTunesView.as_view(), name='popular-tunes'),
    path('tunes/recent/', views.RecentTunesView.as_view(), name='recent-tunes'),
    path('tunes/free/', views.FreeTunesView.as_view(), name='free-tunes'),
    
    # Creator Verification and Upload System
    path('creator/apply/', views.apply_for_creator_verification, name='creator-apply'),
    path('creator/dashboard/', views.creator_dashboard, name='creator-dashboard'),
    path('upload/', views.TuneUploadView.as_view(), name='tune-upload'),
    path('upload/file-types/', views.supported_tune_file_types, name='supported-file-types'),
    
    # Utility endpoints
    path('stats/', views.tune_stats, name='stats'),
    path('search/suggestions/', views.search_suggestions, name='search-suggestions'),
] 