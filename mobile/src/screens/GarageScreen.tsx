import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';

import { Theme } from '../styles/theme';
import { RootState } from '../store';

interface Motorcycle {
  id: string;
  make: string;
  model: string;
  year: number;
  image_url?: string;
  ecu_type: string;
  connection_protocol: string;
  last_flash_date?: string;
  current_tune: string;
  connection_status: 'connected' | 'disconnected' | 'never_connected';
  battery_level?: number;
  last_connected?: string;
}

export const GarageScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      setMotorcycles([
        {
          id: '1',
          make: 'Yamaha',
          model: 'R6',
          year: 2020,
          image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          ecu_type: 'Bosch ME17',
          connection_protocol: 'CAN-H/L',
          last_flash_date: '2024-01-20',
          current_tune: 'Stage 2 Performance',
          connection_status: 'connected',
          battery_level: 85,
          last_connected: '2024-01-22T10:30:00Z',
        },
        {
          id: '2',
          make: 'Ducati',
          model: 'Panigale V4',
          year: 2021,
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c6d99c0d2?w=400',
          ecu_type: 'Bosch ME17.3',
          connection_protocol: 'CAN-H/L',
          last_flash_date: '2024-01-15',
          current_tune: 'Stock ECU',
          connection_status: 'disconnected',
          last_connected: '2024-01-20T15:45:00Z',
        },
        {
          id: '3',
          make: 'Honda',
          model: 'CBR1000RR',
          year: 2019,
          image_url: 'https://images.unsplash.com/photo-1558618047-fc3c4b4af9e4?w=400',
          ecu_type: 'Keihin ECU',
          connection_protocol: '4-pin OBD',
          current_tune: 'Stock ECU',
          connection_status: 'never_connected',
        },
      ]);
    } catch (error) {
      console.error('Failed to load motorcycles:', error);
      Alert.alert('Error', 'Failed to load garage. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMotorcycles();
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return Theme.colors.success;
      case 'disconnected': return Theme.colors.warning;
      case 'never_connected': return Theme.colors.textSecondary;
      default: return Theme.colors.textSecondary;
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'never_connected': return 'Never Connected';
      default: return 'Unknown';
    }
  };

  const formatLastConnected = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleBikePress = (bike: Motorcycle) => {
    // navigation.navigate('BikeDetail', { bikeId: bike.id });
    console.log('Bike pressed:', bike.make, bike.model);
  };

  const handleAddBike = () => {
    // navigation.navigate('AddBike');
    console.log('Add bike pressed');
  };

  const handleFlashTune = (bike: Motorcycle) => {
    // navigation.navigate('SafeFlash', { 
    //   motorcycleId: bike.id,
    //   currentTune: bike.current_tune 
    // });
    console.log('Flash tune pressed for:', bike.make, bike.model);
  };

  const renderBikeCard = (bike: Motorcycle) => (
    <TouchableOpacity
      key={bike.id}
      style={styles.bikeCard}
      onPress={() => handleBikePress(bike)}
    >
      <Image
        source={{ uri: bike.image_url || 'https://via.placeholder.com/120x80' }}
        style={styles.bikeImage}
      />
      
      <View style={styles.bikeInfo}>
        <View style={styles.bikeHeader}>
          <Text style={styles.bikeName}>
            {bike.make} {bike.model}
          </Text>
          <Text style={styles.bikeYear}>{bike.year}</Text>
        </View>

        <View style={styles.connectionStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getConnectionStatusColor(bike.connection_status) }
          ]} />
          <Text style={[
            styles.statusText,
            { color: getConnectionStatusColor(bike.connection_status) }
          ]}>
            {getConnectionStatusText(bike.connection_status)}
          </Text>
          {bike.battery_level && (
            <View style={styles.batteryInfo}>
              <Icon name="battery" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.batteryText}>{bike.battery_level}%</Text>
            </View>
          )}
        </View>

        <View style={styles.tuneInfo}>
          <Text style={styles.currentTuneLabel}>Current Tune:</Text>
          <Text style={styles.currentTune}>{bike.current_tune}</Text>
        </View>

        <View style={styles.lastConnected}>
          <Icon name="clock-outline" size={14} color={Theme.colors.textSecondary} />
          <Text style={styles.lastConnectedText}>
            Last connected {formatLastConnected(bike.last_connected)}
          </Text>
        </View>

        <View style={styles.bikeActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.flashButton]}
            onPress={() => handleFlashTune(bike)}
          >
            <Icon name="flash" size={16} color={Theme.colors.white} />
            <Text style={styles.actionButtonText}>Flash Tune</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => handleBikePress(bike)}
          >
            <Icon name="cog" size={16} color={Theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: Theme.colors.primary }]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="garage-open" size={80} color={Theme.colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>Your garage is empty</Text>
      <Text style={styles.emptyStateText}>
        Add your first motorcycle to start tuning and tracking performance
      </Text>
      <TouchableOpacity style={styles.addFirstBikeButton} onPress={handleAddBike}>
        <Icon name="plus" size={20} color={Theme.colors.white} />
        <Text style={styles.addFirstBikeText}>Add Your First Bike</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>My Garage</Text>
          <Text style={styles.headerSubtitle}>
            {motorcycles.length} {motorcycles.length === 1 ? 'motorcycle' : 'motorcycles'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddBike}>
          <Icon name="plus" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={motorcycles.length === 0 ? styles.emptyContent : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {motorcycles.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Icon name="flash" size={24} color={Theme.colors.primary} />
                <Text style={styles.statNumber}>
                  {motorcycles.filter(b => b.current_tune !== 'Stock ECU').length}
                </Text>
                <Text style={styles.statLabel}>Tuned</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="wifi" size={24} color={Theme.colors.success} />
                <Text style={styles.statNumber}>
                  {motorcycles.filter(b => b.connection_status === 'connected').length}
                </Text>
                <Text style={styles.statLabel}>Connected</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="shield-check" size={24} color={Theme.colors.info} />
                <Text style={styles.statNumber}>
                  {motorcycles.filter(b => b.last_flash_date).length}
                </Text>
                <Text style={styles.statLabel}>Backed Up</Text>
              </View>
            </View>

            {/* Bike Cards */}
            <View style={styles.bikesSection}>
              <Text style={styles.sectionTitle}>Your Motorcycles</Text>
              {motorcycles.map(renderBikeCard)}
            </View>

            {/* Add Another Bike */}
            <TouchableOpacity style={styles.addAnotherCard} onPress={handleAddBike}>
              <View style={styles.addAnotherContent}>
                <Icon name="plus-circle-outline" size={32} color={Theme.colors.primary} />
                <Text style={styles.addAnotherTitle}>Add Another Bike</Text>
                <Text style={styles.addAnotherSubtitle}>
                  Expand your garage and track more motorcycles
                </Text>
              </View>
            </TouchableOpacity>
          </>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstBikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addFirstBikeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.white,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  bikesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  bikeCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    flexDirection: 'row',
  },
  bikeImage: {
    width: 120,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  bikeYear: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  batteryText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginLeft: 4,
  },
  tuneInfo: {
    marginBottom: 8,
  },
  currentTuneLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  currentTune: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  lastConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastConnectedText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginLeft: 4,
  },
  bikeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  flashButton: {
    backgroundColor: Theme.colors.primary,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.white,
    marginLeft: 4,
  },
  addAnotherCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    margin: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  addAnotherContent: {
    alignItems: 'center',
  },
  addAnotherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  addAnotherSubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
}); 