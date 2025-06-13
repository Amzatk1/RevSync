from django.db import models
from django.contrib.postgres.fields import JSONField
from users.models import User
from bikes.models import Motorcycle

class RideSession(models.Model):
    """A motorcycle ride session with telemetry data."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='telemetry_ride_sessions')
    bike = models.ForeignKey(Motorcycle, on_delete=models.CASCADE, related_name='ride_sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('completed', 'Completed'),
            ('crashed', 'Crashed'),
            ('interrupted', 'Interrupted')
        ],
        default='active'
    )
    
    # Ride summary metrics
    total_distance = models.FloatField(default=0)  # in kilometers
    max_speed = models.FloatField(default=0)  # in km/h
    avg_speed = models.FloatField(default=0)  # in km/h
    max_rpm = models.IntegerField(default=0)
    avg_rpm = models.FloatField(default=0)
    max_lean_angle = models.FloatField(default=0)  # in degrees
    max_acceleration = models.FloatField(default=0)  # in m/s²
    max_deceleration = models.FloatField(default=0)  # in m/s²
    
    # Location tracking
    start_location = models.JSONField(null=True)  # {lat: float, lng: float}
    end_location = models.JSONField(null=True)  # {lat: float, lng: float}
    route = models.JSONField(null=True)  # Array of {lat, lng} points
    
    # Safety metrics
    hard_braking_count = models.IntegerField(default=0)
    hard_acceleration_count = models.IntegerField(default=0)
    sharp_turn_count = models.IntegerField(default=0)
    safety_score = models.FloatField(default=0)  # 0-100
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['user', 'start_time']),
            models.Index(fields=['bike', 'start_time']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.user.username}'s ride on {self.bike.name} ({self.start_time})"

class TelemetryDataPoint(models.Model):
    """Individual telemetry data point recorded during a ride."""
    ride_session = models.ForeignKey(RideSession, on_delete=models.CASCADE, related_name='telemetry_points')
    timestamp = models.DateTimeField()
    
    # Location
    latitude = models.FloatField()
    longitude = models.FloatField()
    altitude = models.FloatField(null=True)
    
    # Speed and movement
    speed = models.FloatField()  # km/h
    acceleration = models.FloatField()  # m/s²
    heading = models.FloatField()  # degrees
    
    # Bike metrics
    rpm = models.IntegerField()
    throttle_position = models.FloatField()  # percentage
    brake_pressure = models.FloatField(null=True)  # bar
    lean_angle = models.FloatField()  # degrees
    gear = models.IntegerField(null=True)
    
    # Engine metrics
    engine_temp = models.FloatField(null=True)  # celsius
    oil_temp = models.FloatField(null=True)  # celsius
    oil_pressure = models.FloatField(null=True)  # bar
    fuel_level = models.FloatField(null=True)  # percentage
    
    # Additional data
    raw_data = models.JSONField(null=True)  # Store any additional sensor data
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['ride_session', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"Telemetry point at {self.timestamp} - Speed: {self.speed}km/h"

class RideAnalytics(models.Model):
    """Aggregated analytics for a ride session."""
    ride_session = models.OneToOneField(RideSession, on_delete=models.CASCADE, related_name='analytics')
    
    # Performance metrics
    performance_score = models.FloatField(default=0)  # 0-100
    efficiency_score = models.FloatField(default=0)  # 0-100
    smoothness_score = models.FloatField(default=0)  # 0-100
    
    # Detailed metrics
    acceleration_zones = models.JSONField(default=dict)  # Distribution of acceleration values
    speed_zones = models.JSONField(default=dict)  # Distribution of speed values
    rpm_zones = models.JSONField(default=dict)  # Distribution of RPM values
    lean_angle_zones = models.JSONField(default=dict)  # Distribution of lean angles
    
    # Safety analysis
    risk_zones = models.JSONField(default=dict)  # Areas with high risk factors
    safety_events = models.JSONField(default=list)  # List of safety events
    
    # Recommendations
    recommendations = models.JSONField(default=list)  # List of improvement suggestions
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analytics for {self.ride_session}"

class RideSafetyEvent(models.Model):
    ride_session = models.ForeignKey(RideSession, on_delete=models.CASCADE, related_name='safety_events')
    timestamp = models.DateTimeField()
    event_type = models.CharField(max_length=32)
    description = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()

    def __str__(self):
        return f"{self.event_type} at {self.timestamp} ({self.lat}, {self.lng})"
