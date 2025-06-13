import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface TelemetryDataPoint {
  timestamp: string;
  rpm: number;
  speed: number;
  gps: string;
  [key: string]: any;
}

export interface RideSafetyEvent {
  id: number;
  ride: number;
  timestamp: string;
  event_type: string;
  description: string;
  lat: number;
  lng: number;
}

class TelemetryService {
  private dataQueue: { rideId: string; dataPoints: TelemetryDataPoint[]; timestamp: number }[] = [];
  private isSending = false;
  private retryInterval: NodeJS.Timeout | null = null;
  private telemetryInterval: NodeJS.Timeout | null = null;

  async startRide(bikeId: string) {
    const response = await apiClient.post('/telemetry/start-ride/', { bike_id: bikeId });
    return response.data;
  }

  async sendTelemetryData(rideId: string, dataPoints: TelemetryDataPoint[]) {
    try {
      const response = await apiClient.post('/telemetry/send-data/', {
        ride_id: rideId,
        data_points: dataPoints,
      });
      return response.data;
    } catch (error) {
      this.queueData(rideId, dataPoints);
      throw error;
    }
  }

  async endRide(rideId: string) {
    const response = await apiClient.post('/telemetry/end-ride/', { ride_id: rideId });
    return response.data;
  }

  // Offline queue management
  private queueData(rideId: string, dataPoints: TelemetryDataPoint[]) {
    this.dataQueue.push({ rideId, dataPoints, timestamp: Date.now() });
    this.startRetryInterval();
  }

  private startRetryInterval() {
    if (this.retryInterval) return;
    this.retryInterval = setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && this.dataQueue.length > 0) {
        await this.processQueue();
      }
    }, 30000);
  }

  private async processQueue() {
    if (this.isSending || this.dataQueue.length === 0) return;
    this.isSending = true;
    try {
      const { rideId, dataPoints } = this.dataQueue[0];
      await this.sendTelemetryData(rideId, dataPoints);
      this.dataQueue.shift();
    } catch (error) {
      // Keep in queue for next retry
    } finally {
      this.isSending = false;
    }
  }

  // Periodic telemetry collection
  startTelemetryCollection(rideId: string, callback: () => Promise<TelemetryDataPoint | null>) {
    this.telemetryInterval = setInterval(async () => {
      const telemetryData = await callback();
      if (telemetryData) {
        await this.sendTelemetryData(rideId, [telemetryData]);
      }
    }, 2000);
  }

  stopTelemetryCollection() {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  // Fetch safety events for a ride
  async getSafetyEvents(rideId: string): Promise<RideSafetyEvent[]> {
    const response = await apiClient.get(`/telemetry/safety-events/${rideId}/`);
    return response.data;
  }
}

export default new TelemetryService(); 