import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
const ExpoMCIcon: any = Icon;
import AIService from '../services/aiService';
import motorcycleService, { MotorcycleListItem } from '../services/motorcycleService';
import { Theme } from '../styles/theme';
import { Button } from '../components/ui';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';

import * as Haptics from 'expo-haptics';

const getSafetyColor = (level?: string) => {
  switch ((level || '').toUpperCase()) {
    case 'SAFE':
      return '#16A34A';
    case 'MODERATE':
      return '#F59E0B';
    case 'EXPERT':
    case 'EXPERT ONLY':
      return '#DC2626';
    case 'EXPERIMENTAL':
      return '#7C3AED';
    default:
      return '#6B7280';
  }
};

const AITunesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [goal, setGoal] = useState('performance');
  const [notes, setNotes] = useState('');
  const [bikeId, setBikeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const [garageModalVisible, setGarageModalVisible] = useState(false);
  const [bikes, setBikes] = useState<MotorcycleListItem[]>([]);
  const [bikesLoading, setBikesLoading] = useState(false);
  const [selectedBike, setSelectedBike] = useState<MotorcycleListItem | null>(null);

  const safeLoadBike = async (id: number): Promise<MotorcycleListItem | undefined> => {
    try {
      return await motorcycleService.getMotorcycleDetail(id);
    } catch {
      return undefined;
    }
  };

  const openGaragePicker = async () => {
    try {
      try { await Haptics.selectionAsync(); } catch {}
      setGarageModalVisible(true);
      setBikesLoading(true);
      const res = await motorcycleService.getMotorcycles({ ordering: '-year,-max_power_hp', page_size: 50 });
      setBikes(res.results || []);
    } catch (e) {
      Alert.alert('Garage', 'Unable to load your motorcycles right now.');
    } finally {
      setBikesLoading(false);
    }
  };

  React.useEffect(() => {
    (async () => {
      try {
        const res = await AIService.getAITuneHistory();
        setHistory(res.results || []);
      } catch {}
    })();
  }, []);

  const handleSelectBike = async (bike: MotorcycleListItem) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelectedBike(bike);
    setBikeId(String(bike.id));
    setGarageModalVisible(false);
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      let snapshotPayload: API.BikeSnapshot | undefined;
      if (selectedBike) {
        snapshotPayload = {
          id: selectedBike.id,
          manufacturer: selectedBike.manufacturer?.name,
          model_name: selectedBike.model_name,
          year: selectedBike.year,
          displacement_cc: selectedBike.displacement_cc,
        };
      } else if (bikeId) {
        const detail = await safeLoadBike(parseInt(bikeId, 10));
        if (detail) {
          snapshotPayload = {
            id: detail.id,
            manufacturer: detail.manufacturer?.name,
            model_name: detail.model_name,
            year: detail.year,
            displacement_cc: detail.displacement_cc,
          };
        }
      }

      const { tunes } = await AIService.createAITuneRequest({ goal, notes }, snapshotPayload);
      setResults(tunes);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate AI tunes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} allowFontScaling>AI Tunes</Text>
        <Text style={styles.subtitle} allowFontScaling>Describe the tune you want. We’ll generate safe, compatible options.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label} allowFontScaling>Tune Goal</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., performance, economy, smoothness"
          value={goal}
          onChangeText={setGoal}
          autoCapitalize="none"
        />

        <Text style={styles.label} allowFontScaling>Bike (optional)</Text>
        {selectedBike ? (
          <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={{ color: Theme.colors.content.primary }} allowFontScaling>
              {selectedBike.manufacturer?.name} {selectedBike.model_name} ({selectedBike.year})
            </Text>
            <TouchableOpacity onPress={() => { setSelectedBike(null); setBikeId(''); }} accessibilityRole="button" accessibilityLabel="Clear selected bike">
              <ExpoMCIcon name="close-circle" size={18} color={Theme.colors.content.primarySecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
          onPress={openGaragePicker}
          accessibilityRole="button"
          accessibilityLabel="Choose a bike from your garage"
        >
          <ExpoMCIcon name="garage" size={18} color={Theme.colors.content.primarySecondary} />
          <Text style={{ marginLeft: 8, color: Theme.colors.content.primarySecondary }} allowFontScaling>
            {selectedBike ? 'Change bike' : 'Choose from Garage'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 4 }]} allowFontScaling>Or enter Bike ID</Text>
        <TextInput
          style={styles.input}
          placeholder="ID from your Garage (optional)"
          value={bikeId}
          onChangeText={setBikeId}
          keyboardType="numeric"
          accessibilityLabel="Enter bike ID manually"
        />

        <Text style={styles.label} allowFontScaling>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Any extra preferences (fuel, riding style, track use, etc.)"
        />

        <Button
          title={loading ? 'Generating…' : 'Generate AI Tunes'}
          onPress={handleGenerate}
          loading={loading}
          leftIcon={<ExpoMCIcon name="robot" color={loading ? Theme.colors.content.primary : '#fff'} size={18} />}
          accessibilityLabel="Generate AI tunes"
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {history.length > 0 ? (
          <View style={{ marginBottom: 8 }}>
            <SectionHeader title="Recent AI Sessions" />
            {history.map((h) => (
              <View key={h.id} style={[styles.card, { backgroundColor: Theme.colors.content.backgroundElevated, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={{ color: Theme.colors.content.primary }} allowFontScaling>
                  {new Date(h.created_at).toLocaleString()}
                </Text>
                <Badge label={(h.preferences?.goal || 'custom').toUpperCase()} color={Theme.colors.semantic.info} />
              </View>
            ))}
          </View>
        ) : null}
        {results.map((tune: any) => (
          <View key={tune.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle} allowFontScaling>{tune.name}</Text>
              {(() => {
                const level = (tune.ai_analysis?.safety_level || tune.safety_level) as string | undefined;
                return level ? (
                  <View style={[styles.badge, { backgroundColor: getSafetyColor(level) }]}>
                    <Text style={styles.badgeText} allowFontScaling>{String(level).toUpperCase()}</Text>
                  </View>
                ) : null;
              })()}
            </View>
            <Text style={styles.cardMeta} allowFontScaling>{tune.category?.name || tune.category}</Text>
            {tune.ai_explanation ? (
              <Text style={styles.cardExplanation} allowFontScaling>{tune.ai_explanation}</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal visible={garageModalVisible} animationType="slide" transparent onRequestClose={() => setGarageModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.modalTitle} allowFontScaling>Select a Bike</Text>
              <TouchableOpacity onPress={() => setGarageModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close garage picker">
                <ExpoMCIcon name="close" size={22} color={Theme.colors.content.primary} />
              </TouchableOpacity>
            </View>
            {bikesLoading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Theme.colors.accent.primary} />
              </View>
            ) : (
              <FlatList
                data={bikes}
                keyExtractor={(b) => String(b.id)}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bikeRow}
                    onPress={() => handleSelectBike(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${item.manufacturer?.name} ${item.model_name}`}
                  >
                    <Text style={styles.bikeRowText} allowFontScaling>
                      {item.manufacturer?.name} {item.model_name} ({item.year})
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.content.background },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Theme.colors.content.primary },
  subtitle: { fontSize: 14, color: Theme.colors.content.primarySecondary, marginTop: 4 },
  form: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.content.primary, marginTop: 8 },
  input: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.content.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.content.primary,
  },
  button: {
    marginTop: 12,
    backgroundColor: Theme.colors.accent.primary,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.content.primary },
  cardMeta: { fontSize: 12, color: Theme.colors.content.primarySecondary, marginTop: 2 },
  cardExplanation: { fontSize: 13, color: Theme.colors.content.primary, marginTop: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Theme.colors.content.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  bikeRow: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 10,
    padding: 12,
  },
  bikeRowText: { color: Theme.colors.content.primary },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.content.primary },
});

export default AITunesScreen;


