import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-chart-kit';

import { Theme } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface TelemetryData {
  rpm: number;
  speed: number;
  throttle: number;
  afr: number;
  egt: number;
  boost: number;
  oilTemp: number;
  waterTemp: number;
  batteryVoltage: number;
  gear: number;
  timestamp: number;
}

interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  protocol: string;
  deviceName: string;
  signalStrength: number;
  lastDataReceived: number;
}

const MOCK_TELEMETRY_HISTORY = {
  rpm: [3500, 4200, 5800, 7200, 8500, 9200, 8800, 7500],
  speed: [45, 52, 68, 85, 92, 98, 95, 78],
  throttle: [30, 45, 70, 85, 95, 100, 90, 65],
  afr: [14.2, 13.8, 13.5, 13.2, 12.9, 12.8, 13.1, 13.6],
};

export const ConnectedRideScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connected',
    protocol: 'CAN-H/L',
    deviceName: 'Yamaha R6 2020',
    signalStrength: 85,
    lastDataReceived: Date.now(),
  });

  const [currentData, setCurrentData] = useState<TelemetryData>({
    rpm: 3500,
    speed: 45,
    throttle: 30,
    afr: 14.2,
    egt: 650,
    boost: 0,
    oilTemp: 85,
    waterTemp: 82,
    batteryVoltage: 12.6,
    gear: 3,
    timestamp: Date.now(),
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('rpm');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Simulate real-time data updates
    const dataInterval = setInterval(() => {
      if (connectionStatus.status === 'connected') {
        updateTelemetryData();
      }
    }, 500);

    // Animate connection indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (connectionStatus.status === 'connected') {
      pulseAnimation.start();
    }

    return () => {
      clearInterval(dataInterval);
      pulseAnimation.stop();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [connectionStatus.status]);

  const updateTelemetryData = () => {
    setCurrentData(prev => ({
      ...prev,
      rpm: Math.max(800, Math.min(12000, prev.rpm + (Math.random() - 0.5) * 500)),
      speed: Math.max(0, Math.min(200, prev.speed + (Math.random() - 0.5) * 10)),
      throttle: Math.max(0, Math.min(100, prev.throttle + (Math.random() - 0.5) * 20)),
      afr: Math.max(10, Math.min(18, prev.afr + (Math.random() - 0.5) * 0.5)),
      egt: Math.max(200, Math.min(1200, prev.egt + (Math.random() - 0.5) * 50)),
      boost: Math.max(-5, Math.min(25, prev.boost + (Math.random() - 0.5) * 2)),
      oilTemp: Math.max(60, Math.min(150, prev.oilTemp + (Math.random() - 0.5) * 5)),
      waterTemp: Math.max(60, Math.min(120, prev.waterTemp + (Math.random() - 0.5) * 3)),
      batteryVoltage: Math.max(11, Math.min(14.5, prev.batteryVoltage + (Math.random() - 0.5) * 0.2)),
      gear: Math.max(1, Math.min(6, Math.round(prev.gear + (Math.random() - 0.5) * 0.3))),
      timestamp: Date.now(),
    }));

    setConnectionStatus(prev => ({
      ...prev,
      lastDataReceived: Date.now(),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return Theme.colors.success;
      case 'connecting': return Theme.colors.warning;
      case 'disconnected': return Theme.colors.textSecondary;
      case 'error': return Theme.colors.danger;
      default: return Theme.colors.textSecondary;
    }
  };

  const getValueColor = (value: number, metric: string) => {
    switch (metric) {
      case 'rpm':
        return value > 9000 ? Theme.colors.danger : value > 7000 ? Theme.colors.warning : Theme.colors.success;
      case 'afr':
        return value < 12 || value > 16 ? Theme.colors.danger : value < 13 || value > 15 ? Theme.colors.warning : Theme.colors.success;
      case 'egt':
        return value > 900 ? Theme.colors.danger : value > 750 ? Theme.colors.warning : Theme.colors.success;
      case 'oilTemp':
        return value > 120 ? Theme.colors.danger : value > 100 ? Theme.colors.warning : Theme.colors.success;
      case 'waterTemp':
        return value > 100 ? Theme.colors.danger : value > 90 ? Theme.colors.warning : Theme.colors.success;
      default:
        return Theme.colors.text;
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    recordingTimer.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    Alert.alert('Recording Started', 'Telemetry data recording has begun');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }

    Alert.alert('Recording Stopped', `Session saved: ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')}`);
  };

  const handleConnect = () => {
    setConnectionStatus(prev => ({ ...prev, status: 'connecting' }));
    
    setTimeout(() => {
      setConnectionStatus(prev => ({ ...prev, status: 'connected' }));
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMetricCard = (
    title: string,
    value: number,
    unit: string,
    metric: string,
    icon: string,
    precision: number = 0
  ) => (
    <TouchableOpacity
      style={[
        styles.metricCard,
        selectedMetric === metric && styles.selectedMetricCard
      ]}
      onPress={() => setSelectedMetric(metric)}
    >
      <View style={styles.metricHeader}>
        <Icon name={icon} size={20} color={Theme.colors.primary} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      
      <Text style={[
        styles.metricValue,
        { color: getValueColor(value, metric) }
      ]}>
        {value.toFixed(precision)}
      </Text>
      
      <Text style={styles.metricUnit}>{unit}</Text>
    </TouchableOpacity>
  );

  const renderChart = () => {
    const data = MOCK_TELEMETRY_HISTORY[selectedMetric as keyof typeof MOCK_TELEMETRY_HISTORY] || [];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {selectedMetric.toUpperCase()} Trend
        </Text>
        
        <LineChart
          data={{
            labels: ['', '', '', '', '', '', '', ''],
            datasets: [{
              data: data,
              color: () => Theme.colors.primary,
              strokeWidth: 3,
            }],
          }}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            backgroundColor: Theme.colors.surface,
            backgroundGradientFrom: Theme.colors.surface,
            backgroundGradientTo: Theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: () => Theme.colors.textSecondary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: Theme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>Live Ride</Text>
          <Text style={styles.headerSubtitle}>Real-time telemetry</Text>
        </View>

        <View style={styles.headerActions}>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <Animated.View style={[
                styles.recordingDot,
                { transform: [{ scale: pulseAnim }] }
              ]} />
              <Text style={styles.recordingText}>
                {formatDuration(recordingDuration)}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.connectionInfo}>
              <View style={[
                styles.connectionDot,
                { backgroundColor: getStatusColor(connectionStatus.status) }
              ]} />
              <View>
                <Text style={styles.connectionDevice}>
                  {connectionStatus.deviceName}
                </Text>
                <Text style={styles.connectionProtocol}>
                  {connectionStatus.protocol} • Signal: {connectionStatus.signalStrength}%
                </Text>
              </View>
            </View>

            {connectionStatus.status === 'disconnected' ? (
              <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
                <Icon name="bluetooth-connect" size={16} color={Theme.colors.white} />
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.signalBars}>
                {[1, 2, 3, 4].map(bar => (
                  <View
                    key={bar}
                    style={[
                      styles.signalBar,
                      {
                        backgroundColor: bar <= Math.floor(connectionStatus.signalStrength / 25)
                          ? Theme.colors.success
                          : Theme.colors.border
                      }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {connectionStatus.status === 'connected' && (
            <Text style={styles.lastDataText}>
              Last data: {Math.floor((Date.now() - connectionStatus.lastDataReceived) / 1000)}s ago
            </Text>
          )}
        </View>

        {/* Primary Metrics */}
        <View style={styles.primaryMetrics}>
          <View style={styles.primaryMetricRow}>
            {renderMetricCard('RPM', currentData.rpm, 'rpm', 'rpm', 'tachometer', 0)}
            {renderMetricCard('Speed', currentData.speed, 'mph', 'speed', 'speedometer', 0)}
          </View>
          <View style={styles.primaryMetricRow}>
            {renderMetricCard('Throttle', currentData.throttle, '%', 'throttle', 'gas-station', 0)}
            {renderMetricCard('Gear', currentData.gear, '', 'gear', 'car-shift-pattern', 0)}
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Secondary Metrics */}
        <View style={styles.secondaryMetrics}>
          <Text style={styles.sectionTitle}>Engine Data</Text>
          
          <View style={styles.metricGrid}>
            {renderMetricCard('AFR', currentData.afr, ':1', 'afr', 'air-filter', 1)}
            {renderMetricCard('EGT', currentData.egt, '°F', 'egt', 'thermometer', 0)}
            {renderMetricCard('Boost', currentData.boost, 'psi', 'boost', 'turbo', 1)}
          </View>

          <View style={styles.metricGrid}>
            {renderMetricCard('Oil Temp', currentData.oilTemp, '°C', 'oilTemp', 'oil', 0)}
            {renderMetricCard('Coolant', currentData.waterTemp, '°C', 'waterTemp', 'water', 0)}
            {renderMetricCard('Battery', currentData.batteryVoltage, 'V', 'battery', 'battery', 1)}
          </View>
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingControls}>
          {!isRecording ? (
            <TouchableOpacity
              style={styles.startRecordingButton}
              onPress={handleStartRecording}
              disabled={connectionStatus.status !== 'connected'}
            >
              <Icon name="record" size={20} color={Theme.colors.white} />
              <Text style={styles.recordingButtonText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopRecordingButton}
              onPress={handleStopRecording}
            >
              <Icon name="stop" size={20} color={Theme.colors.white} />
              <Text style={styles.recordingButtonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Safety Alerts */}
        {(currentData.egt > 900 || currentData.oilTemp > 120 || currentData.waterTemp > 100) && (
          <View style={styles.alertCard}>
            <Icon name="alert-circle" size={24} color={Theme.colors.danger} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Temperature Warning</Text>
              <Text style={styles.alertText}>
                Engine temperatures are elevated. Consider reducing load.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.white,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.danger,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  content: {
    flex: 1,
  },
  connectionCard: {
    backgroundColor: Theme.colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  connectionDevice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  connectionProtocol: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.white,
    marginLeft: 4,
  },
  signalBars: {
    flexDirection: 'row',
    gap: 2,
  },
  signalBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  lastDataText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  primaryMetrics: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryMetricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedMetricCard: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginLeft: 6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricUnit: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  secondaryMetrics: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  recordingControls: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  startRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.danger,
    paddingVertical: 16,
    borderRadius: 12,
  },
  stopRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.textSecondary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  recordingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.white,
    marginLeft: 8,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.danger,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.danger,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
  },
}); 