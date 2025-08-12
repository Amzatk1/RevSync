import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;
const TypedLinearGradient = LinearGradient as any;

import { Theme } from "../styles/theme";
import { SectionHeader, Chip, HeaderBar } from "../components/ui";
import Badge from "../components/ui/Badge";
import { RootState } from "../store";
import { loadMarketplaceTunes, Tune } from "../store/slices/tuneSlice";
import { TuneListItem } from "../services/tuneService";
import { MotorcycleDetail } from "../services/motorcycleService";
// import {
//   TuneCardSkeleton,
//   MarketplaceListSkeleton,
// } from "../components/SkeletonLoader"; // Temporarily commented out
import { PerformanceTracker, logError } from "../config/monitoring";
// import FreeReviewManager from "../components/ReviewPrompt"; // Temporarily commented out
import FreeRecommendationService from "../services/freeRecommendationService";
import AIService, { AIRecommendation } from "../services/aiService";
// import { Animated } from "react-native"; // Not available in this RN version

interface MarketplaceScreenProps {
  navigation: any;
}

const formatPrice = (amount?: number, currency: string = "USD") => {
  if (typeof amount !== "number") return "";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount}`;
  }
};

const getSafetyLevel = (item: any): string => {
  try {
    return (item?.safety_rating?.level as string) || "UNRATED";
  } catch {
    return "UNRATED";
  }
};

const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({
  navigation,
}) => {
  const dispatch = useDispatch();
  const { marketplaceTunes, isLoading } = useSelector(
    (state: RootState) => state.tune
  );
  const { selectedMotorcycle } = useSelector(
    (state: RootState) => state.motorcycle
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [filteredTunes, setFilteredTunes] = useState<TuneListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // const fadeAnim = React.useRef(new Animated.Value(0)).current; // Animated not available

  // 🤖 AI-powered recommendations
  const [aiRecommendations, setAiRecommendations] = useState<
    AIRecommendation[]
  >([]);
  const [showingRecommendations, setShowingRecommendations] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const categories = [
    { key: "ALL", label: "All Categories" },
    { key: "PERFORMANCE", label: "Performance" },
    { key: "ECONOMY", label: "Economy" },
    { key: "RACING", label: "Racing" },
    { key: "STREET", label: "Street" },
  ];

  const featuredCollections = [
    {
      id: "1",
      title: "Editor's Choice",
      subtitle: "Hand-picked by our experts",
      gradient: [Theme.colors.accent.primary, Theme.colors.accent.primaryDark],
    },
    {
      id: "2",
      title: "Track Tested",
      subtitle: "Proven on the circuit",
      gradient: [Theme.colors.semantic.error, "#FF6B6B"],
    },
    {
      id: "3",
      title: "New Releases",
      subtitle: "Latest tuning innovations",
      gradient: [Theme.colors.accent.primary, Theme.colors.accent.primaryDark],
    },
  ];

  // 🤖 Load AI recommendations
  const loadAIRecommendations = async () => {
    try {
      setAiLoading(true);

      // Check if user has completed onboarding
      const hasOnboarded = await AIService.hasCompletedOnboarding();
      if (!hasOnboarded) {
        setShowingRecommendations(false);
        return;
      }

      // Get personalized recommendations
      const response = await AIService.getRecommendations("personalized", 5);
      setAiRecommendations(response.recommendations);
      setShowingRecommendations(true);

      PerformanceTracker.trackMarketplaceEvent("ai_recommendations_loaded", {
        count: response.recommendations.length,
        algorithm: response.recommendation_metadata.algorithm,
      });
    } catch (error) {
      logError(error as Error, "load_ai_recommendations");
      setShowingRecommendations(false);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    // 🆓 FREE Performance tracking
    PerformanceTracker.startTransaction(
      "marketplace_load",
      "Loading marketplace screen"
    );

    try {
      dispatch(loadMarketplaceTunes({}) as any);

      // 🤖 Load AI recommendations
      loadAIRecommendations();

      // 🆓 Track marketplace visit
      PerformanceTracker.trackMarketplaceEvent("marketplace_viewed", {
        selectedMotorcycle: selectedMotorcycle?.model_name,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError(error as Error, "marketplace_load");
    }
  }, [dispatch, selectedMotorcycle]);

  useEffect(() => {
    filterTunes();

    // 🆓 Fade in animation when data loads
    if (!isLoading && marketplaceTunes.length > 0) {
      PerformanceTracker.finishTransaction("marketplace_load");
      // Animated.timing(fadeAnim, {
      //   toValue: 1,
      //   duration: 300,
      //   useNativeDriver: true,
      // }).start(); // Animated not available
    }
  }, [marketplaceTunes, debouncedQuery, selectedCategory, isLoading]); // , fadeAnim - commented out

  const filterTunes = () => {
    let filtered = [...marketplaceTunes];

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      filtered = filtered.filter(
        (tune) =>
          tune.name.toLowerCase().includes(q) ||
          tune.short_description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "ALL") {
      // Simple category filtering based on tune name/description
      filtered = filtered.filter(
        (tune) =>
          tune.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          tune.short_description
            .toLowerCase()
            .includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredTunes(filtered);
  };

  const handleTunePress = async (tune: TuneListItem) => {
    try {
      // 🆓 Track tune interaction for recommendations
      await FreeRecommendationService.trackInteraction(tune.id, "view", tune);

      // 🆓 Track tune interaction for analytics
      PerformanceTracker.trackMarketplaceEvent("tune_viewed", {
        tuneId: tune.id,
        tuneName: tune.name,
        creator: tune.creator.username,
        isOpenSource: tune.is_open_source,
        category: tune.category.name,
      });

      // 🆓 Simulate tune download (in real app, this would be actual download)
      if (tune.is_open_source) {
        console.log("🆓 Downloading FREE tune:", tune.name);

        // Track download for both review and recommendation systems
        await Promise.all([
          // FreeReviewManager.trackDownload(), // Temporarily commented out
          FreeRecommendationService.trackInteraction(tune.id, "download", tune),
        ]);

        console.log("✅ Free tune downloaded and tracked!");
      } else {
        console.log("💰 Paid tune selected:", tune.name);
        // For paid tunes, you might navigate to payment flow
      }

      // TODO: Navigate to tune detail screen
      // navigation.navigate('TuneDetail', { tuneId: tune.id });
      console.log("Tune pressed:", tune.name);
    } catch (error) {
      logError(error as Error, "tune_press");
    }
  };

  const renderFeaturedCollection = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.featuredCard} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.subtitle}`}>
      <TypedLinearGradient colors={item.gradient} style={styles.featuredGradient}>
        <Text style={styles.featuredTitle} allowFontScaling>{item.title}</Text>
        <Text style={styles.featuredSubtitle} allowFontScaling>{item.subtitle}</Text>
        <TypedIcon name="arrow-forward" size={20} color={"#FFFFFF"} />
      </TypedLinearGradient>
    </TouchableOpacity>
  );

  const getSafetyRatingColor = (rating: string) => {
    switch (rating) {
      case "LOW":
        return Theme.colors.semantic.success;
      case "MEDIUM":
        return Theme.colors.semantic.warning;
      case "HIGH":
        return Theme.colors.semantic.error;
      case "CRITICAL":
        return "#DC2626";
      default:
        return Theme.colors.content.primarySecondary;
    }
  };

  const renderAIRecommendation = ({ item }: { item: AIRecommendation }) => (
    <TouchableOpacity style={styles.featuredCard} onPress={() => {
      try { Haptics.selectionAsync(); } catch {}
      // Fallback: navigate or log
      console.log("AI rec pressed", item);
    }} accessibilityRole="button" accessibilityLabel={`Recommended: ${item?.name || "Tune"}`}>
      <TypedLinearGradient colors={[Theme.colors.content.primary, Theme.colors.accent.primary]} style={styles.featuredGradient}>
        <Text style={styles.featuredTitle} numberOfLines={1} allowFontScaling>
          {item?.name || "Recommended Tune"}
        </Text>
        <Text style={styles.featuredSubtitle} numberOfLines={1} allowFontScaling>
          {item?.ai_recommendation_reason || item?.description || "Personalized pick for your bike"}
        </Text>
        <TypedIcon name="arrow-right" size={20} color="#FFFFFF" />
      </TypedLinearGradient>
    </TouchableOpacity>
  );

  const renderTuneCard = ({ item }: { item: TuneListItem }) => (
    <TouchableOpacity
      style={styles.tuneCard}
      onPress={() => { try { Haptics.selectionAsync(); } catch {} handleTunePress(item); }}
      accessibilityRole="button"
      accessibilityLabel={`Tune ${item.name}, by ${item.creator.username}${item.is_open_source ? ", free" : ""}`}
    >
      {/* image_url optional in our types; render if present via any cast */}
      {(item as any).image_url ? (
        <Image source={{ uri: (item as any).image_url }} style={{ width: "100%", height: 140, borderRadius: 8, marginBottom: 10 }} resizeMode="cover" />
      ) : null}
      <View style={styles.tuneHeader}>
        <View style={styles.tuneInfo}>
          <Text style={styles.tuneName} allowFontScaling>{item.name}</Text>
          <Text style={styles.tuneCreator} allowFontScaling>
            by {item.creator.username}
            {item.creator.is_verified && (
              <TypedIcon
                name="verified"
                size={14}
                color={Theme.colors.accent.primary}
              />
            )}
          </Text>
        </View>
        <View style={styles.tunePrice}>
          {item.is_open_source ? (
            <Text style={styles.freeText} allowFontScaling>FREE</Text>
          ) : (
            <Text style={styles.priceText} allowFontScaling>
              {formatPrice(item.price as any, (item as any).currency || "USD")}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.tuneDescription} numberOfLines={2} allowFontScaling>
        {item.short_description}
      </Text>

      <View style={styles.tuneStats}>
        <Badge label={getSafetyLevel(item)} color={getSafetyRatingColor(getSafetyLevel(item))} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <TypedIcon
              name="download"
              size={14}
              color={Theme.colors.content.primarySecondary}
            />
            <Text style={styles.statText} allowFontScaling>{item.download_count}</Text>
          </View>
          <View style={styles.statItem}>
            <TypedIcon name="star" size={14} color={Theme.colors.semantic.warning} />
            <Text style={styles.statText} allowFontScaling>{item.average_rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TypedIcon
          name="search"
          size={20}
          color={Theme.colors.content.primarySecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tunes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Theme.colors.content.primarySecondary}
          returnKeyType="search"
          onSubmitEditing={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            // trigger filtering immediately
            setDebouncedQuery(searchQuery.trim());
          }}
          accessibilityLabel="Search tunes"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <TypedIcon name="close-circle" size={18} color={Theme.colors.content.primarySecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Featured Collections */}
      <View style={styles.featuredSection}>
        <SectionHeader title="Featured" />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={featuredCollections}
          keyExtractor={(item) => item.id}
          renderItem={renderFeaturedCollection}
          contentContainerStyle={styles.featuredList}
        />
      </View>

      {showingRecommendations && aiRecommendations.length > 0 && (
        <View style={styles.featuredSection}>
          <SectionHeader title="For You" />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={aiRecommendations}
            keyExtractor={(it, idx) => (it?.id as string) || `${idx}`}
            renderItem={renderAIRecommendation}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      {/* Category Filters */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        >
          {categories.map((category) => (
            <Chip
              key={category.key}
              label={category.label}
              selected={selectedCategory === category.key}
              onPress={() => { try { Haptics.selectionAsync(); } catch {} setSelectedCategory(category.key); }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount} allowFontScaling>
          {filteredTunes.length} tunes{debouncedQuery ? ` for "${debouncedQuery}"` : ""}{selectedCategory !== "ALL" ? ` • ${selectedCategory}` : ""}
        </Text>
        {selectedMotorcycle && (
          <Text style={styles.compatibilityText} allowFontScaling>
            for {selectedMotorcycle.manufacturer.name} {selectedMotorcycle.model_name}
          </Text>
        )}
      </View>
    </View>
  );

  // 🆓 FREE Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    PerformanceTracker.startTransaction(
      "marketplace_refresh",
      "Pull to refresh"
    );

    try {
      await dispatch(loadMarketplaceTunes({}) as any);
      PerformanceTracker.trackMarketplaceEvent("marketplace_refreshed");
    } catch (error) {
      logError(error as Error, "marketplace_refresh");
    } finally {
      setRefreshing(false);
      PerformanceTracker.finishTransaction("marketplace_refresh");
    }
  };

  const renderEmpty = () => (
    <View style={{ padding: 24, alignItems: "center" }}>
      <TypedIcon name="database-search" size={28} color={Theme.colors.content.primarySecondary} />
      <Text style={[styles.sectionTitle, { marginTop: 8 }]} allowFontScaling>No results</Text>
      <Text style={styles.tuneDescription} allowFontScaling>Try a different search or browse Featured and For You.</Text>
    </View>
  );

  const ListEmptyComponent = !isLoading ? renderEmpty : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Marketplace" subtitle="Discover safe, compatible tunes" />
      {isLoading && marketplaceTunes.length === 0 ? (
        // 🆓 FREE Skeleton loading for initial load
        <ScrollView style={styles.container}>
          {renderHeader()}
          {/* <MarketplaceListSkeleton /> */}
        </ScrollView>
      ) : (
        // 🆓 FREE content with basic functionality  
        <View style={[styles.container, { opacity: 1 }]}>
          <FlatList
            data={filteredTunes}
            renderItem={renderTuneCard}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={ListEmptyComponent}
            ListFooterComponent={isLoading ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={Theme.colors.accent.primary} />
              </View>
            ) : null}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              // Optional: dispatch pagination if your slice supports it
              // dispatch(loadMarketplaceTunes({ append: true }) as any);
            }}
            // refreshControl not available in this RN version
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.content.background,
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.content.background,
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
    color: Theme.colors.content.primary,
  },
  featuredSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.content.primary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  featuredGradient: {
    width: 200,
    height: 100,
    padding: 16,
    justifyContent: "space-between",
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  featuredSubtitle: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  filtersSection: {
    paddingTop: 24,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    fontWeight: "500",
  },
  compatibilityText: {
    fontSize: 12,
    color: Theme.colors.accent.primary,
    fontWeight: "500",
  },
  tuneCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    ...{
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  tuneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tuneInfo: {
    flex: 1,
  },
  tuneName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.content.primary,
    marginBottom: 2,
  },
  tuneCreator: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
  },
  tunePrice: {
    alignItems: "flex-end",
  },
  freeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.semantic.success,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.content.primary,
  },
  tuneDescription: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  tuneStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  safetyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  statText: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    marginLeft: 4,
  },
});

export default MarketplaceScreen;
