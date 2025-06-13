import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import apiClient from '../services/api';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TelemetryService, { RideSafetyEvent } from '../services/telemetryService';
// import { LineChart } from 'react-native-svg-charts'; // Uncomment if using charts

interface RideAnalytics {
  performance_score: number;
  safety_events: { type: string; count: number }[];
  // Add more fields as needed
}

interface RideSession {
  id: string;
  start_time: string;
  end_time: string;
  total_distance: number;
  max_speed: number;
  avg_speed: number;
  max_rpm: number;
  avg_rpm: number;
  route?: { lat: number; lng: number }[];
}

interface Props {
  route: { params: { rideId: string } };
}

const RideSummaryScreen: React.FC<Props> = ({ route }) => {
  const { rideId } = route.params;
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<RideSession | null>(null);
  const [analytics, setAnalytics] = useState<RideAnalytics | null>(null);
  const [safetyEvents, setSafetyEvents] = useState<RideSafetyEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RideSafetyEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const sessionRes = await apiClient.get(`/telemetry/ride/${rideId}/`);
        const summaryRes = await apiClient.get(`/telemetry/summary/${rideId}/`);
        setSession(sessionRes.data);
        setAnalytics(summaryRes.data);
        // Fetch safety events
        const events = await new TelemetryService().getSafetyEvents(rideId);
        setSafetyEvents(events);
      } catch (error) {
        Alert.alert('Error', 'Failed to load ride summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [rideId]);

  // Helper for icon and color
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'redline':
      case 'RPM Redline':
        return { name: 'engine', color: '#d32f2f' };
      case 'hard_braking':
      case 'Hard Braking':
        return { name: 'car-brake-alert', color: '#ff9800' };
      case 'hard_acceleration':
      case 'Hard Acceleration':
        return { name: 'flash', color: '#fbc02d' };
      default:
        return { name: 'alert-circle', color: '#607d8b' };
    }
  };

  // Helper for advice
  const getAdvice = (event: RideSafetyEvent) => {
    switch (event.event_type) {
      case 'redline':
      case 'RPM Redline':
        return 'Consider shifting earlier or adjusting your tune for smoother power delivery.';
      case 'hard_braking':
      case 'Hard Braking':
        return 'Review your braking technique or check brake system health.';
      case 'hard_acceleration':
      case 'Hard Acceleration':
        return 'Smooth throttle input can improve traction and safety.';
      default:
        return '';
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!session || !analytics) {
    return <Text style={styles.error}>No summary available.</Text>;
  }

  const duration = session.end_time && session.start_time
    ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000)
    : 0;

  // Sort events chronologically
  const sortedEvents = [...safetyEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ride Summary</Text>
      {session.route && session.route.length > 1 && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: session.route[0].lat,
            longitude: session.route[0].lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Polyline
            coordinates={session.route.map(p => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
          <Marker coordinate={{ latitude: session.route[0].lat, longitude: session.route[0].lng }} title="Start" pinColor="green" />
          <Marker coordinate={{ latitude: session.route[session.route.length-1].lat, longitude: session.route[session.route.length-1].lng }} title="End" pinColor="red" />
          {/* Safety Event Markers */}
          {safetyEvents.map(event => {
            const { name, color } = getEventIcon(event.event_type);
            return (
              <Marker
                key={event.id}
                coordinate={{ latitude: event.lat, longitude: event.lng }}
                onPress={() => { setSelectedEvent(event); setModalVisible(true); }}
                title={event.event_type}
                description={event.description}
              >
                <Icon name={name} size={32} color={color} />
              </Marker>
            );
          })}
        </MapView>
      )}
      <Text style={styles.label}>Duration: {duration}s</Text>
      <Text style={styles.label}>Distance: {session.total_distance.toFixed(2)} km</Text>
      <Text style={styles.label}>Top Speed: {session.max_speed} km/h</Text>
      <Text style={styles.label}>Avg Speed: {session.avg_speed.toFixed(1)} km/h</Text>
      <Text style={styles.label}>Max RPM: {session.max_rpm}</Text>
      <Text style={styles.label}>Avg RPM: {session.avg_rpm.toFixed(0)}</Text>
      <Text style={styles.label}>Performance Score: {analytics.performance_score.toFixed(0)} / 100</Text>
      <Text style={styles.section}>Safety Events:</Text>
      {safetyEvents.length === 0 ? (
        <Text style={styles.safe}>No unsafe events detected 🎉</Text>
      ) : (
        <View style={styles.eventList}>
          {sortedEvents.map(event => {
            const { name, color } = getEventIcon(event.event_type);
            const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventItem}
                onPress={() => { setSelectedEvent(event); setModalVisible(true); }}
              >
                <Icon name={name} size={22} color={color} style={{ marginRight: 8 }} />
                <Text style={styles.eventText}>
                  🕒 [{time}] {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} — {event.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {/* Safety Event Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                <Text style={styles.modalTitle}>{selectedEvent.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                <Text style={styles.modalText}>Time: {new Date(selectedEvent.timestamp).toLocaleTimeString()}</Text>
                <Text style={styles.modalText}>Description: {selectedEvent.description}</Text>
                <Text style={styles.modalText}>Location: {selectedEvent.lat.toFixed(5)}, {selectedEvent.lng.toFixed(5)}</Text>
                <Text style={styles.modalAdvice}>{getAdvice(selectedEvent)}</Text>
                <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/*
      <Text style={styles.section}>Speed Chart:</Text>
      <LineChart
        style={{ height: 100, width: 300 }}
        data={speedData}
        svg={{ stroke: 'rgb(134, 65, 244)' }}
        contentInset={{ top: 20, bottom: 20 }}
      />
      */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  map: { width: 340, height: 220, borderRadius: 12, marginBottom: 18 },
  label: { fontSize: 16, marginVertical: 4 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 18, marginBottom: 6 },
  warning: { color: '#d9534f', fontSize: 16 },
  safe: { color: '#5cb85c', fontSize: 16 },
  error: { color: 'red', fontSize: 18, textAlign: 'center', marginTop: 40 },
  eventList: { width: '100%', marginTop: 8 },
  eventItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 },
  eventText: { fontSize: 15, color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 300, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalText: { fontSize: 16, marginBottom: 8 },
  modalAdvice: { fontSize: 15, color: '#007AFF', marginTop: 8, marginBottom: 12, textAlign: 'center' },
  modalClose: { marginTop: 10, padding: 8 },
});

export default RideSummaryScreen; 