from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/users/', include('users.urls')),  # Phase 2: User authentication and profiles
    path('api/bikes/', include('bikes.urls')),
    path('api/tunes/', include('tunes.urls')),
    # path('api/safety/', include('safety.urls')),
    # path('api/marketplace/', include('marketplace.urls')),
    # path('api/compatibility/', include('compatibility.urls')),
    # path('api/accounts/', include('accounts.urls')),
    # path('api/motorcycles/', include('motorcycles.urls')),
    # path('api/hardware/', include('hardware.urls')),
    # path('api/community/', include('community.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 