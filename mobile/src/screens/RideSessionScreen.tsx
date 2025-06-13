import React, { useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Alert } from 'react-native';
import telemetryService, { TelemetryDataPoint } from '../services/telemetryService';

const SIM_BIKE_ID = '1'; // Replace with real bike ID from user garage

const getSimulatedTelemetry = (): TelemetryDataPoint => {
  const now = new Date().toISOString();
  return {
    timestamp: now,
    rpm: Math.floor(6000 + Math.random() * 4000),
    speed: Math.floor(40 + Math.random() * 80),
    gps: '51.5,-0.1',
  };
};

const RideSessionScreen: React.FC = () => {
  const [rideId, setRideId] = useState<string | null>(null);
  const [isRiding, setIsRiding] = useState(false);
  const [latest, setLatest] = useState<TelemetryDataPoint | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartRide = async () => {
    try {
      const ride = await telemetryService.startRide(SIM_BIKE_ID);
      setRideId(ride.id.toString());
      setIsRiding(true);
      setStartTime(new Date());
      // Start telemetry collection with simulated data
      telemetryService.startTelemetryCollection(ride.id.toString(), async () => {
        const data = getSimulatedTelemetry();
        setLatest(data);
        return data;
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start ride.');
    }
  };

  const handleEndRide = async () => {
    if (!rideId) return;
    try {
      await telemetryService.endRide(rideId);
      telemetryService.stopTelemetryCollection();
      setIsRiding(false);
      setRideId(null);
      setStartTime(null);
      setLatest(null);
      Alert.alert('Ride Ended', 'Your ride session has ended.');
    } catch (error) {
      Alert.alert('Error', 'Failed to end ride.');
    }
  };

  const rideDuration = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ride Session</Text>
      {!isRiding ? (
        <Button title="Start Ride" onPress={handleStartRide} />
      ) : (
        <>
          <Text style={styles.label}>Ride ID: {rideId}</Text>
          <Text style={styles.label}>Duration: {rideDuration}s</Text>
          <View style={styles.metricsBox}>
            <Text style={styles.metric}>Speed: {latest?.speed ?? '--'} km/h</Text>
            <Text style={styles.metric}>RPM: {latest?.rpm ?? '--'}</Text>
            <Text style={styles.metric}>GPS: {latest?.gps ?? '--'}</Text>
          </View>
          <Button title="End Ride" color="#d9534f" onPress={handleEndRide} />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 16, marginVertical: 4 },
  metricsBox: { marginVertical: 24, padding: 16, borderRadius: 8, backgroundColor: '#f2f2f2', width: 220 },
  metric: { fontSize: 20, fontWeight: '600', marginVertical: 4, textAlign: 'center' },
});

export default RideSessionScreen; 