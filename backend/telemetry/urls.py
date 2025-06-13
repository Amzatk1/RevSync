from django.urls import path
from .views import (
    StartRideView, SendTelemetryDataView, EndRideView, RideDetailView, RideSummaryView, RideSafetyEventListView
)

urlpatterns = [
    path('start-ride/', StartRideView.as_view(), name='start-ride'),
    path('send-data/', SendTelemetryDataView.as_view(), name='send-telemetry-data'),
    path('end-ride/', EndRideView.as_view(), name='end-ride'),
    path('ride/<int:pk>/', RideDetailView.as_view(), name='ride-detail'),
    path('summary/<int:pk>/', RideSummaryView.as_view(), name='ride-summary'),
    path('safety-events/<int:ride_id>/', RideSafetyEventListView.as_view(), name='ride-safety-events'),
] 