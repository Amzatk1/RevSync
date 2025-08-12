from rest_framework import serializers
from .models import AITuneRequest


class BikeSnapshotSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    manufacturer = serializers.CharField(required=False, allow_blank=True)
    model_name = serializers.CharField(required=False, allow_blank=True)
    year = serializers.IntegerField(required=False)
    displacement_cc = serializers.IntegerField(required=False)


class AITuneRequestInputSerializer(serializers.Serializer):
    preferences = serializers.DictField(child=serializers.JSONField(), required=True)
    bike = BikeSnapshotSerializer(required=False)


class AITuneRequestHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AITuneRequest
        fields = [
            'id', 'bike_id', 'bike_snapshot', 'preferences', 'recommendation_ids', 'created_at'
        ]

