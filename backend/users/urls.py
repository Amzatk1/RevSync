from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('auth/login/', views.UserLoginView.as_view(), name='user-login'),
    
    # Profile endpoints
    path('profile/', views.get_user_profile, name='get_user_profile'),
    path('profile/update/', views.update_user_profile, name='update_user_profile'),
    path('complete-onboarding/', views.complete_onboarding, name='complete_onboarding'),
    
    # Garage endpoints
    path('garage/', views.UserGarageListView.as_view(), name='user_garage_list'),
    path('garage/<int:pk>/', views.UserGarageDetailView.as_view(), name='user_garage_detail'),
    path('garage/search-bikes/', views.MotorcycleSearchView.as_view(), name='motorcycle_search'),
    path('garage/add-custom-bike/', views.AddCustomMotorcycleView.as_view(), name='add_custom_motorcycle'),
] 