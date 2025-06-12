from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SafetyProfileViewSet, TuneValidationView, FlashSessionViewSet,
    SafetyConsentView, SafetyIncidentViewSet, SafetyAuditView,
    SafetyDashboardView
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'profiles', SafetyProfileViewSet, basename='safety-profiles')
router.register(r'flash-sessions', FlashSessionViewSet, basename='flash-sessions')
router.register(r'incidents', SafetyIncidentViewSet, basename='safety-incidents')

app_name = 'safety'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Tune validation endpoint
    path('validate-tune/', TuneValidationView.as_view(), name='validate-tune'),
    
    # Safety consent endpoints
    path('consents/', SafetyConsentView.as_view(), name='safety-consents'),
    
    # Audit and monitoring endpoints
    path('audit/', SafetyAuditView.as_view(), name='safety-audit'),
    path('dashboard/', SafetyDashboardView.as_view(), name='safety-dashboard'),
    
    # Additional convenience endpoints
    path('profiles/category/<str:category>/', 
         SafetyProfileViewSet.as_view({'get': 'by_category'}), 
         name='safety-profile-by-category'),
    
    # Flash session specific endpoints
    path('flash-sessions/<uuid:pk>/progress/', 
         FlashSessionViewSet.as_view({'post': 'update_progress'}), 
         name='flash-session-progress'),
    
    path('flash-sessions/<uuid:pk>/backup/', 
         FlashSessionViewSet.as_view({'post': 'create_backup'}), 
         name='flash-session-backup'),
    
    path('flash-sessions/<uuid:pk>/validate/', 
         FlashSessionViewSet.as_view({'post': 'validate_pre_flash'}), 
         name='flash-session-validate'),
    
    path('flash-sessions/<uuid:pk>/emergency-stop/', 
         FlashSessionViewSet.as_view({'post': 'emergency_stop'}), 
         name='flash-session-emergency-stop'),
    
    path('flash-sessions/<uuid:pk>/restore/', 
         FlashSessionViewSet.as_view({'post': 'restore_backup'}), 
         name='flash-session-restore'),
    
    # Incident investigation endpoint
    path('incidents/<uuid:pk>/investigate/', 
         SafetyIncidentViewSet.as_view({'post': 'investigate'}), 
         name='incident-investigate'),
] 