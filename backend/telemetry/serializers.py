from rest_framework import serializers
from .models import RideSession, TelemetryDataPoint, RideAnalytics, RideSafetyEvent

class RideSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideSession
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at', 'status', 'total_distance', 'max_speed', 'avg_speed', 'max_rpm', 'avg_rpm', 'max_lean_angle', 'max_acceleration', 'max_deceleration', 'hard_braking_count', 'hard_acceleration_count', 'sharp_turn_count', 'safety_score')

class TelemetryDataPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelemetryDataPoint
        fields = '__all__'
        read_only_fields = ('id', 'ride_session')

class RideAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideAnalytics
        fields = '__all__'
        read_only_fields = ('id', 'ride_session', 'created_at', 'updated_at')

class RideSafetyEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideSafetyEvent
        fields = '__all__' 