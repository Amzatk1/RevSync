from django.shortcuts import render
from rest_framework import generics, status, permissions, views
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import RideSession, TelemetryDataPoint, RideAnalytics, RideSafetyEvent
from .serializers import RideSessionSerializer, TelemetryDataPointSerializer, RideAnalyticsSerializer, RideSafetyEventSerializer
from bikes.models import Motorcycle
from django.utils import timezone
from django.db import transaction
from math import radians, cos, sin, sqrt, atan2

# Create your views here.

class StartRideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        bike_id = request.data.get('bike_id')
        start_time = request.data.get('start_time', timezone.now())
        bike = get_object_or_404(Motorcycle, id=bike_id)
        ride = RideSession.objects.create(
            user=request.user,
            bike=bike,
            start_time=start_time,
            status='active',
        )
        serializer = RideSessionSerializer(ride)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SendTelemetryDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        ride_id = request.data.get('ride_id')
        data_points = request.data.get('data_points', [])
        ride = get_object_or_404(RideSession, id=ride_id, user=request.user)
        serializer = TelemetryDataPointSerializer(data=data_points, many=True)
        serializer.is_valid(raise_exception=True)
        TelemetryDataPoint.objects.bulk_create([
            TelemetryDataPoint(ride_session=ride, **item) for item in serializer.validated_data
        ])
        return Response({'status': 'success', 'count': len(data_points)}, status=status.HTTP_201_CREATED)

class EndRideView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ride_id = request.data.get('ride_id')
        end_time = request.data.get('end_time', timezone.now())
        ride = get_object_or_404(RideSession, id=ride_id, user=request.user, status='active')
        ride.end_time = end_time
        ride.status = 'completed'
        ride.save()

        # --- ANALYTICS CALCULATION ---
        points = TelemetryDataPoint.objects.filter(ride_session=ride).order_by('timestamp')
        if points.exists():
            # Duration
            duration = (ride.end_time - ride.start_time).total_seconds()
            # Distance (Haversine formula)
            def haversine(lat1, lon1, lat2, lon2):
                R = 6371  # km
                dlat = radians(lat2 - lat1)
                dlon = radians(lon2 - lon1)
                a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                return R * c
            total_distance = 0
            prev = None
            route = []
            for p in points:
                route.append({'lat': p.latitude, 'lng': p.longitude})
                if prev:
                    total_distance += haversine(prev.latitude, prev.longitude, p.latitude, p.longitude)
                prev = p
            # Speed/RPM
            speeds = [p.speed for p in points]
            rpms = [p.rpm for p in points]
            max_speed = max(speeds)
            avg_speed = sum(speeds) / len(speeds)
            max_rpm = max(rpms)
            avg_rpm = sum(rpms) / len(rpms)
            # Safety
            hard_braking = sum(1 for p in points if p.acceleration < -5)
            hard_accel = sum(1 for p in points if p.acceleration > 5)
            redline_hits = sum(1 for p in points if p.rpm > 11000)
            safety_events = []
            RideSafetyEvent.objects.filter(ride_session=ride).delete()  # Clean old events
            for p in points:
                if p.rpm > 11000:
                    RideSafetyEvent.objects.create(
                        ride_session=ride,
                        timestamp=p.timestamp,
                        event_type='redline',
                        description='RPM exceeded redline',
                        lat=p.latitude,
                        lng=p.longitude
                    )
                if p.acceleration < -5:
                    RideSafetyEvent.objects.create(
                        ride_session=ride,
                        timestamp=p.timestamp,
                        event_type='hard_braking',
                        description='Hard braking detected',
                        lat=p.latitude,
                        lng=p.longitude
                    )
                if p.acceleration > 5:
                    RideSafetyEvent.objects.create(
                        ride_session=ride,
                        timestamp=p.timestamp,
                        event_type='hard_acceleration',
                        description='Hard acceleration detected',
                        lat=p.latitude,
                        lng=p.longitude
                    )
            # Update RideSession
            ride.total_distance = total_distance
            ride.max_speed = max_speed
            ride.avg_speed = avg_speed
            ride.max_rpm = max_rpm
            ride.avg_rpm = avg_rpm
            ride.route = route
            ride.hard_braking_count = hard_braking
            ride.hard_acceleration_count = hard_accel
            ride.save()
            # Update or create RideAnalytics
            analytics, _ = RideAnalytics.objects.get_or_create(ride_session=ride)
            analytics.performance_score = min(100, avg_speed / max_speed * 100)
            analytics.safety_events = safety_events
            analytics.save()
        serializer = RideSessionSerializer(ride)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RideDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TelemetryDataPointSerializer

    def get_queryset(self):
        ride_id = self.kwargs['pk']
        ride = get_object_or_404(RideSession, id=ride_id, user=self.request.user)
        return TelemetryDataPoint.objects.filter(ride_session=ride)

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = TelemetryDataPointSerializer(queryset, many=True)
        return Response(serializer.data)

class RideSummaryView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RideAnalyticsSerializer

    def get_object(self):
        ride_id = self.kwargs['pk']
        ride = get_object_or_404(RideSession, id=ride_id, user=self.request.user)
        return get_object_or_404(RideAnalytics, ride_session=ride)

class RideSafetyEventListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, ride_id):
        ride = get_object_or_404(RideSession, id=ride_id, user=request.user)
        events = RideSafetyEvent.objects.filter(ride_session=ride)
        serializer = RideSafetyEventSerializer(events, many=True)
        return Response(serializer.data)
