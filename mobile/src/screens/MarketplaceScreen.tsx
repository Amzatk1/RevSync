import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

import { Theme } from '../styles/theme';
import { RootState } from '../store';
import { loadMarketplaceTunes, Tune } from '../store/slices/tuneSlice';

interface MarketplaceScreenProps {
  navigation: any;
}

const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { marketplaceTunes, isLoading } = useSelector((state: RootState) => state.tune);
  const { selectedMotorcycle } = useSelector((state: RootState) => state.motorcycle);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filteredTunes, setFilteredTunes] = useState<Tune[]>([]);

  const categories = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'PERFORMANCE', label: 'Performance' },
    { key: 'ECONOMY', label: 'Economy' },
    { key: 'RACING', label: 'Racing' },
    { key: 'STREET', label: 'Street' },
  ];

  const featuredCollections = [
    {
      id: '1',
      title: 'Editor\'s Choice',
      subtitle: 'Hand-picked by our experts',
      gradient: [Theme.colors.primary, Theme.colors.primaryDark],
    },
    {
      id: '2',
      title: 'Track Tested',
      subtitle: 'Proven on the circuit',
      gradient: [Theme.colors.danger, '#FF6B6B'],
    },
    {
      id: '3',
      title: 'New Releases',
      subtitle: 'Latest tuning innovations',
      gradient: [Theme.colors.secondary, Theme.colors.secondaryDark],
    },
  ];

  useEffect(() => {
    dispatch(loadMarketplaceTunes({}) as any);
  }, [dispatch]);

  useEffect(() => {
    filterTunes();
  }, [marketplaceTunes, searchQuery, selectedCategory]);

  const filterTunes = () => {
    let filtered = [...marketplaceTunes];

    if (searchQuery) {
      filtered = filtered.filter(tune =>
        tune.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tune.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'ALL') {
      // Simple category filtering based on tune name/description
      filtered = filtered.filter(tune =>
        tune.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        tune.description.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredTunes(filtered);
  };

  const handleTunePress = (tune: Tune) => {
    // navigation.navigate('TuneDetail', { tuneId: tune.id });
    console.log('Tune pressed:', tune.name);
  };

  const renderFeaturedCollection = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.featuredCard}>
      <LinearGradient
        colors={item.gradient}
        style={styles.featuredGradient}
      >
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
        <Icon name="arrow-forward" size={20} color={Theme.colors.white} />
      </LinearGradient>
    </TouchableOpacity>
  );

  const getSafetyRatingColor = (rating: string) => {
    switch (rating) {
      case 'LOW': return Theme.colors.success;
      case 'MEDIUM': return Theme.colors.warning;
      case 'HIGH': return Theme.colors.danger;
      case 'CRITICAL': return '#DC2626';
      default: return Theme.colors.textSecondary;
    }
  };

  const renderTuneCard = ({ item }: { item: Tune }) => (
    <TouchableOpacity
      style={styles.tuneCard}
      onPress={() => handleTunePress(item)}
    >
      <View style={styles.tuneHeader}>
        <View style={styles.tuneInfo}>
          <Text style={styles.tuneName}>{item.name}</Text>
          <Text style={styles.tuneCreator}>
            by {item.creator.username}
            {item.creator.is_verified && (
              <Icon name="verified" size={14} color={Theme.colors.primary} />
            )}
          </Text>
        </View>
        <View style={styles.tunePrice}>
          {item.is_free ? (
            <Text style={styles.freeText}>FREE</Text>
          ) : (
            <Text style={styles.priceText}>${item.price}</Text>
          )}
        </View>
      </View>

      <Text style={styles.tuneDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.tuneStats}>
        <View style={[styles.safetyBadge, { backgroundColor: getSafetyRatingColor(item.safety_rating) + '20' }]}>
          <Text style={[styles.safetyText, { color: getSafetyRatingColor(item.safety_rating) }]}>
            {item.safety_rating}
          </Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="download" size={14} color={Theme.colors.textSecondary} />
            <Text style={styles.statText}>{item.download_count}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={14} color={Theme.colors.warning} />
            <Text style={styles.statText}>{item.rating_average}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={Theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tunes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Theme.colors.textSecondary}
        />
      </View>

      {/* Featured Collections */}
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={featuredCollections}
          keyExtractor={item => item.id}
          renderItem={renderFeaturedCollection}
          contentContainerStyle={styles.featuredList}
        />
      </View>

      {/* Category Filters */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.filterChip,
                selectedCategory === category.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === category.key && styles.filterTextActive
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredTunes.length} tunes found
        </Text>
        {selectedMotorcycle && (
          <Text style={styles.compatibilityText}>
            for {selectedMotorcycle.make} {selectedMotorcycle.model}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredTunes}
        renderItem={renderTuneCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: Theme.colors.surface,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    margin: 16,
    marginBottom: 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Theme.colors.text,
  },
  featuredSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredGradient: {
    width: 200,
    height: 100,
    padding: 16,
    justifyContent: 'space-between',
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  featuredSubtitle: {
    fontSize: 12,
    color: Theme.colors.white,
    opacity: 0.8,
  },
  filtersSection: {
    paddingTop: 24,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    backgroundColor: Theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Theme.colors.white,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  compatibilityText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  tuneCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    ...Theme.shadows.base,
  },
  tuneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tuneInfo: {
    flex: 1,
  },
  tuneName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 2,
  },
  tuneCreator: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  tunePrice: {
    alignItems: 'flex-end',
  },
  freeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.success,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  tuneDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  tuneStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginLeft: 4,
  },
});

export default MarketplaceScreen; 