from django.urls import path
from . import views

app_name = 'bikes'

urlpatterns = [
    # Reference data endpoints
    path('manufacturers/', views.ManufacturerListView.as_view(), name='manufacturer-list'),
    path('engine-types/', views.EngineTypeListView.as_view(), name='engine-type-list'),
    path('categories/', views.BikeCategoryListView.as_view(), name='category-list'),
    path('ecu-types/', views.ECUTypeListView.as_view(), name='ecu-type-list'),
    
    # Motorcycle endpoints
    path('motorcycles/', views.MotorcycleListView.as_view(), name='motorcycle-list'),
    path('motorcycles/<int:pk>/', views.MotorcycleDetailView.as_view(), name='motorcycle-detail'),
    path('motorcycles/<int:motorcycle_id>/specifications/', views.MotorcycleSpecificationsView.as_view(), name='motorcycle-specifications'),
    path('motorcycles/<int:motorcycle_id>/images/', views.MotorcycleImagesView.as_view(), name='motorcycle-images'),
    path('motorcycles/<int:motorcycle_id>/reviews/', views.MotorcycleReviewsView.as_view(), name='motorcycle-reviews'),
    path('motorcycles/<int:motorcycle_id>/ecus/', views.MotorcycleECUsView.as_view(), name='motorcycle-ecus'),
    
    # Manufacturer specific motorcycles
    path('manufacturers/<int:manufacturer_id>/motorcycles/', views.MotorcyclesByManufacturerView.as_view(), name='motorcycles-by-manufacturer'),
    
    # Special collections
    path('motorcycles/popular/', views.PopularMotorcyclesView.as_view(), name='popular-motorcycles'),
    path('motorcycles/new/', views.NewMotorcyclesView.as_view(), name='new-motorcycles'),
    
    # Utility endpoints
    path('stats/', views.motorcycle_stats, name='motorcycle-stats'),
    path('search/suggestions/', views.motorcycle_search_suggestions, name='motorcycle-search-suggestions'),
] 