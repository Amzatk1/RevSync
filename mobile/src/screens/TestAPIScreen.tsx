import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import tuneService from '../services/tuneService';
import motorcycleService from '../services/motorcycleService';

const TestAPIScreen: React.FC = () => {
  const [tuneStats, setTuneStats] = useState<any>(null);
  const [motorcycleStats, setMotorcycleStats] = useState<any>(null);
  const [featuredTunes, setFeaturedTunes] = useState<any[]>([]);
  const [popularMotorcycles, setPopularMotorcycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testTuneStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await tuneService.getTuneStats();
      setTuneStats(stats);
      Alert.alert('Success', 'Tune stats loaded successfully!');
    } catch (err: any) {
      setError('Failed to load tune stats: ' + err.message);
      Alert.alert('Error', 'Failed to load tune stats');
    } finally {
      setLoading(false);
    }
  };

  const testMotorcycleStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await motorcycleService.getMotorcycleStats();
      setMotorcycleStats(stats);
      Alert.alert('Success', 'Motorcycle stats loaded successfully!');
    } catch (err: any) {
      setError('Failed to load motorcycle stats: ' + err.message);
      Alert.alert('Error', 'Failed to load motorcycle stats');
    } finally {
      setLoading(false);
    }
  };

  const testFeaturedTunes = async () => {
    try {
      setLoading(true);
      setError(null);
      const tunes = await tuneService.getFeaturedTunes();
      setFeaturedTunes(tunes);
      Alert.alert('Success', `Loaded ${tunes.length} featured tunes!`);
    } catch (err: any) {
      setError('Failed to load featured tunes: ' + err.message);
      Alert.alert('Error', 'Failed to load featured tunes');
    } finally {
      setLoading(false);
    }
  };

  const testPopularMotorcycles = async () => {
    try {
      setLoading(true);
      setError(null);
      const motorcycles = await motorcycleService.getPopularMotorcycles();
      setPopularMotorcycles(motorcycles);
      Alert.alert('Success', `Loaded ${motorcycles.length} popular motorcycles!`);
    } catch (err: any) {
      setError('Failed to load popular motorcycles: ' + err.message);
      Alert.alert('Error', 'Failed to load popular motorcycles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Endpoints</Text>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testTuneStats}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Tune Stats API</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testMotorcycleStats}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Motorcycle Stats API</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testFeaturedTunes}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Featured Tunes API</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testPopularMotorcycles}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Popular Motorcycles API</Text>
        </TouchableOpacity>
      </View>

      {tuneStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tune Stats</Text>
          <Text style={styles.dataText}>Total Tunes: {tuneStats.total_tunes}</Text>
          <Text style={styles.dataText}>Free Tunes: {tuneStats.free_tunes}</Text>
          <Text style={styles.dataText}>Verified Creators: {tuneStats.verified_creators}</Text>
          <Text style={styles.dataText}>Total Downloads: {tuneStats.total_downloads}</Text>
        </View>
      )}

      {motorcycleStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motorcycle Stats</Text>
          <Text style={styles.dataText}>Total Motorcycles: {motorcycleStats.total_motorcycles}</Text>
          <Text style={styles.dataText}>Manufacturers: {motorcycleStats.manufacturers}</Text>
          <Text style={styles.dataText}>Categories: {motorcycleStats.categories}</Text>
          <Text style={styles.dataText}>Latest Year: {motorcycleStats.latest_year}</Text>
        </View>
      )}

      {featuredTunes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Tunes ({featuredTunes.length})</Text>
          {featuredTunes.slice(0, 3).map((tune, index) => (
            <View key={index} style={styles.itemContainer}>
              <Text style={styles.itemTitle}>{tune.name}</Text>
              <Text style={styles.itemDetail}>Creator: {tune.creator.business_name || tune.creator.username}</Text>
              <Text style={styles.itemDetail}>Price: ${tune.price}</Text>
            </View>
          ))}
        </View>
      )}

      {popularMotorcycles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Motorcycles ({popularMotorcycles.length})</Text>
          {popularMotorcycles.slice(0, 3).map((motorcycle, index) => (
            <View key={index} style={styles.itemContainer}>
              <Text style={styles.itemTitle}>
                {motorcycle.manufacturer.name} {motorcycle.model_name} ({motorcycle.year})
              </Text>
              <Text style={styles.itemDetail}>
                {motorcycle.displacement_cc}cc, {motorcycle.max_power_hp}hp
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  itemContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});

export default TestAPIScreen; 