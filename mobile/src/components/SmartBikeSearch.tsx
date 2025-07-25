import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

import { Theme } from "../styles/theme";
import { MotorcycleListItem } from "../services/motorcycleService";
import motorcycleService from "../services/motorcycleService";
import { PerformanceTracker, logError } from "../config/monitoring";

const { width } = Dimensions.get("window");

interface SmartBikeSearchProps {
  onBikeSelected: (bike: MotorcycleListItem) => void;
  onManualBikeAdded?: (bike: ManualBike) => void;
  onSkip?: () => void;
  placeholder?: string;
  showSkipOption?: boolean;
  initialQuery?: string;
}

interface ManualBike {
  id: string;
  manufacturer: { name: string };
  model_name: string;
  year: number;
  engine_displacement_cc?: number;
  max_power_hp?: number;
  is_manual_entry: true;
}

interface SearchSuggestion {
  type: "suggestion" | "bike";
  text: string;
  bike?: MotorcycleListItem;
  count?: number;
}

const SmartBikeSearch: React.FC<SmartBikeSearchProps> = ({
  onBikeSelected,
  onManualBikeAdded,
  onSkip,
  placeholder = "Search for your bike (e.g., 'Yamaha R1', 'Du'...)...",
  showSkipOption = false,
  initialQuery = "",
}) => {
  const theme = Theme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  // State management
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [bikes, setBikes] = useState<MotorcycleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBikeData, setManualBikeData] = useState({
    manufacturer: "",
    model: "",
    year: "",
    displacement: "",
  });

  // Animation values
  const searchScale = useSharedValue(1);
  const suggestionsOpacity = useSharedValue(0);
  const searchInputRef = useRef<TextInput>(null);

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Smart search with fuzzy matching and intelligent suggestions
  const performSmartSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setBikes([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      PerformanceTracker.startTransaction("smart_bike_search", "Searching motorcycles");

      // Get search suggestions from backend
      const [searchSuggestionsResult, bikesResult] = await Promise.all([
        motorcycleService.getSearchSuggestions(searchQuery),
        motorcycleService.getMotorcycles({
          search: searchQuery,
          ordering: "-year,-max_power_hp",
        }),
      ]);

      // Create intelligent suggestions combining text suggestions and actual bikes
      const intelligentSuggestions: SearchSuggestion[] = [];

      // Add text-based suggestions for quick completion
      searchSuggestionsResult.slice(0, 3).forEach((suggestion) => {
        intelligentSuggestions.push({
          type: "suggestion",
          text: suggestion,
        });
      });

      // Add actual bike matches
      bikesResult.results.slice(0, 8).forEach((bike) => {
        intelligentSuggestions.push({
          type: "bike",
          text: `${bike.manufacturer.name} ${bike.model_name} (${bike.year})`,
          bike: bike,
        });
      });

      setSuggestions(intelligentSuggestions);
      setBikes(bikesResult.results);
      setShowSuggestions(true);
      setSelectedIndex(-1);

      // Animate suggestions in
      suggestionsOpacity.value = withTiming(1, { duration: 200 });

      PerformanceTracker.trackMarketplaceEvent("smart_search_performed", {
        query: searchQuery,
        suggestions_count: intelligentSuggestions.length,
        bikes_found: bikesResult.results.length,
      });

      PerformanceTracker.finishTransaction("smart_bike_search");
    } catch (error) {
      logError(error as Error, "smart_bike_search");
      Alert.alert("Search Error", "Failed to search motorcycles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleQueryChange = (text: string) => {
    setQuery(text);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSmartSearch(text);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionPress = async (suggestion: SearchSuggestion) => {
    if (isIOS) {
      await Haptics.selectionAsync();
    }

    if (suggestion.type === "bike" && suggestion.bike) {
      // Direct bike selection
      onBikeSelected(suggestion.bike);
      setShowSuggestions(false);
      
      PerformanceTracker.trackMarketplaceEvent("bike_selected", {
        bike_id: suggestion.bike.id,
        manufacturer: suggestion.bike.manufacturer.name,
        model: suggestion.bike.model_name,
        year: suggestion.bike.year,
        selection_method: "smart_search",
      });
    } else {
      // Text suggestion - update query and search
      setQuery(suggestion.text);
      handleQueryChange(suggestion.text);
      searchInputRef.current?.focus();
    }
  };

  // Handle direct bike selection from expanded results
  const handleBikePress = async (bike: MotorcycleListItem) => {
    if (isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation for selection feedback
    searchScale.value = withSpring(1.05, theme.animations.spring.snappy, () => {
      searchScale.value = withSpring(1, theme.animations.spring.gentle);
    });

    onBikeSelected(bike);
    setShowSuggestions(false);

    PerformanceTracker.trackMarketplaceEvent("bike_selected", {
      bike_id: bike.id,
      manufacturer: bike.manufacturer.name,
      model: bike.model_name,
      year: bike.year,
      selection_method: "direct_tap",
    });
  };

  // Handle skip action
  const handleSkip = async () => {
    if (isIOS) {
      await Haptics.selectionAsync();
    }

    if (onSkip) {
      onSkip();
    }

    PerformanceTracker.trackMarketplaceEvent("bike_search_skipped", {
      query_length: query.length,
      had_suggestions: suggestions.length > 0,
    });
  };

  // Clear search
  const handleClear = async () => {
    if (isIOS) {
      await Haptics.selectionAsync();
    }

    setQuery("");
    setSuggestions([]);
    setBikes([]);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Handle search submission
  const handleSearch = () => {
    if (query.trim()) {
      performSmartSearch(query.trim());
    }
  };

  // Handle manual bike entry
  const handleManualEntry = () => {
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowManualEntry(true);
    setShowSuggestions(false);
  };

  // Handle manual bike save
  const handleSaveManualBike = async () => {
    const { manufacturer, model, year, displacement } = manualBikeData;
    
    if (!manufacturer.trim() || !model.trim() || !year.trim()) {
      Alert.alert("Missing Information", "Please fill in at least the manufacturer, model, and year.");
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert("Invalid Year", "Please enter a valid year.");
      return;
    }

    try {
      if (isIOS) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const manualBike: ManualBike = {
        id: `manual_${Date.now()}`,
        manufacturer: { name: manufacturer.trim() },
        model_name: model.trim(),
        year: yearNum,
        engine_displacement_cc: displacement ? parseInt(displacement) : undefined,
        is_manual_entry: true,
      };

      // Convert to MotorcycleListItem format for compatibility
      const bikeForOnboarding: MotorcycleListItem = {
        id: parseInt(manualBike.id.replace('manual_', '')),
        manufacturer: {
          id: 0,
          name: manualBike.manufacturer.name,
          country: "Unknown",
        },
        model_name: manualBike.model_name,
        year: manualBike.year,
        category: { 
          id: 1, 
          name: "Unknown", 
          description: "Manually entered motorcycle category" 
        },
        engine_type: { 
          id: 1, 
          name: "Unknown", 
          description: "Manually entered engine type" 
        },
        displacement_cc: manualBike.engine_displacement_cc || 0,
        cylinders: 0, // Default value
        max_power_hp: null,
        max_torque_nm: null,
        dry_weight_kg: null,
        msrp_usd: null,
        image_url: null,
      };

      onBikeSelected(bikeForOnboarding);
      if (onManualBikeAdded) {
        onManualBikeAdded(manualBike);
      }

      PerformanceTracker.trackMarketplaceEvent("manual_bike_added", {
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        year: yearNum,
      });

      // Reset form
      setManualBikeData({ manufacturer: "", model: "", year: "", displacement: "" });
      setShowManualEntry(false);

    } catch (error) {
      logError(error as Error, "manual_bike_entry");
      Alert.alert("Error", "Failed to save bike information. Please try again.");
    }
  };

  // Handle manual entry cancel
  const handleCancelManualEntry = () => {
    setShowManualEntry(false);
    setManualBikeData({ manufacturer: "", model: "", year: "", displacement: "" });
  };

  // Focus animations
  const handleFocus = () => {
    searchScale.value = withSpring(1.02, theme.animations.spring.snappy);
    if (query.length >= 2) {
      setShowSuggestions(true);
      suggestionsOpacity.value = withTiming(1, { duration: 200 });
    }
  };

  const handleBlur = () => {
    searchScale.value = withSpring(1, theme.animations.spring.gentle);
    // Keep suggestions visible for selection
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Animated styles
  const searchInputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  const suggestionsStyle = useAnimatedStyle(() => ({
    opacity: suggestionsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Enhanced Search Input */}
      <Animated.View style={[styles.searchContainer, searchInputStyle]}>
        <TypedIcon
          name="magnify"
          size={20}
          color={colors.content.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.content.secondary}
          value={query}
          onChangeText={handleQueryChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.accent.primary}
            style={styles.loadingIndicator}
          />
        )}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <TypedIcon
              name="close-circle"
              size={20}
              color={colors.content.secondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Enhanced Search Results */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.suggestionsContainer}
        >
          <ScrollView
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion.type}-${index}`}
                style={[
                  styles.suggestionItem,
                  suggestion.type === "bike" && styles.bikeItem,
                  selectedIndex === index && styles.selectedSuggestion,
                  index === suggestions.length - 1 && styles.lastItem,
                ]}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                {suggestion.type === "bike" && suggestion.bike ? (
                  <View style={styles.bikeResultItem}>
                    <View style={styles.bikeImageContainer}>
                      <Image
                        source={{ 
                          uri: suggestion.bike.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm_Dypw3uBJiJI4CHSqO9L4a9nuAD6vCYyM2QF51qAS-KSC0jhAGP9yWKiw_NsYJ04AAUl0xoWDyNme-47RWES32yYcKbbenuX4y20CSaBJGVHEAgQTpYiaKig085-TJAcK1lV0g-wBIDcdAi9x9i3iLA8HTaKjBKtmeLfVopyDXf7T-eiIziFQHyKg6mS3PQuuG27zStZbu1FK35-ARjEF2dJfrCU63ZoMBh3pXOFQh6k7tDu6T2Vuxdz5QV5g3W0mszolfBZiQ'
                        }}
                        style={styles.bikeImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.bikeDetails}>
                      <Text style={styles.bikeTitle}>
                        {suggestion.bike.manufacturer.name} {suggestion.bike.model_name}
                      </Text>
                      <Text style={styles.bikeSubtitle}>
                        {suggestion.bike.year} • {suggestion.bike.displacement_cc}cc
                      </Text>
                    </View>
                    <TypedIcon
                      name="chevron-right"
                      size={20}
                      color={colors.content.secondary}
                    />
                  </View>
                ) : (
                  <View style={styles.suggestionContent}>
                    <TypedIcon
                      name="magnify"
                      size={16}
                      color={colors.content.secondary}
                      style={styles.suggestionIcon}
                    />
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Manual Bike Entry */}
      {showManualEntry && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.manualEntryContainer}
        >
          <View style={styles.manualEntryHeader}>
            <Text style={styles.manualEntryTitle}>Add Your Bike Manually</Text>
            <Text style={styles.manualEntryDescription}>
              Can't find your bike? Add it manually and we'll still provide great recommendations.
            </Text>
          </View>

          <View style={styles.manualEntryForm}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Manufacturer *</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g., Yamaha, Honda, Ducati"
                value={manualBikeData.manufacturer}
                onChangeText={(text) => setManualBikeData(prev => ({ ...prev, manufacturer: text }))}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Model *</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g., R1, CBR1000RR, Panigale"
                value={manualBikeData.model}
                onChangeText={(text) => setManualBikeData(prev => ({ ...prev, model: text }))}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Year *</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g., 2023"
                value={manualBikeData.year}
                onChangeText={(text) => setManualBikeData(prev => ({ ...prev, year: text }))}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Engine Size (CC)</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g., 1000 (optional)"
                value={manualBikeData.displacement}
                onChangeText={(text) => setManualBikeData(prev => ({ ...prev, displacement: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.manualEntryButtons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancelManualEntry}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveManualBike}
            >
              <Text style={styles.saveButtonText}>Save Bike</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Add Manual Entry Option */}
      {!showManualEntry && !showSuggestions && query.length > 0 && bikes.length === 0 && !loading && (
        <TouchableOpacity style={styles.manualEntryTrigger} onPress={handleManualEntry}>
          <TypedIcon
            name="plus-circle"
            size={20}
            color={colors.accent.primary}
            style={styles.manualEntryIcon}
          />
          <Text style={styles.manualEntryTriggerText}>
            Can't find your bike? Add it manually
          </Text>
        </TouchableOpacity>
      )}

      {/* Skip Option */}
      {showSkipOption && !showManualEntry && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip - I'll add my bike later</Text>
          <TypedIcon
            name="arrow-right"
            size={16}
            color={colors.content.secondary}
          />
        </TouchableOpacity>
      )}

      {/* Search Tips */}
      {!showSuggestions && query.length === 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Search Tips:</Text>
          <Text style={styles.tipText}>• Try "Yamaha R1" or just "R1"</Text>
          <Text style={styles.tipText}>• Start with manufacturer: "Du" for Ducati</Text>
          <Text style={styles.tipText}>• Include year: "2023 MT-09"</Text>
          <Text style={styles.tipText}>• We'll find the closest matches!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Enhanced Search Input
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 50, // Full rounded like HTML
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
  },

  searchIcon: {
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111418",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  loadingIndicator: {
    marginLeft: 12,
  },

  clearButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Enhanced Search Results
  suggestionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: 400,
  },

  suggestionsList: {
    flex: 1,
  },

  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  lastItem: {
    borderBottomWidth: 0,
  },

  bikeItem: {
    backgroundColor: "transparent",
  },

  selectedSuggestion: {
    backgroundColor: "#F0F7FF",
  },

  // Bike Result Item (matches HTML design)
  bikeResultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  bikeImageContainer: {
    width: 64,
    height: 48,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    overflow: "hidden",
  },

  bikeImage: {
    width: "100%",
    height: "100%",
  },

  bikeDetails: {
    flex: 1,
  },

  bikeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111418",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  bikeSubtitle: {
    fontSize: 14,
    color: "#637488",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  // Text Suggestions
  suggestionContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  suggestionIcon: {
    marginRight: 12,
  },

  suggestionText: {
    fontSize: 16,
    color: "#111418",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  // Skip Button
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },

  skipText: {
    fontSize: 16,
    color: "#637488",
    marginRight: 8,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  // Tips Container
  tipsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111418",
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  tipText: {
    fontSize: 14,
    color: "#637488",
    marginBottom: 4,
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  // Manual Bike Entry Styles
  manualEntryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  manualEntryHeader: {
    marginBottom: 20,
  },

  manualEntryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111418",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  manualEntryDescription: {
    fontSize: 14,
    color: "#637488",
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  manualEntryForm: {
    gap: 16,
  },

  inputRow: {
    gap: 8,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111418",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  manualInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111418",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  manualEntryButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#637488",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#0b80ee",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },

  manualEntryTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#0b80ee",
    borderStyle: "dashed",
  },

  manualEntryIcon: {
    marginRight: 8,
  },

  manualEntryTriggerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0b80ee",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
});

export default SmartBikeSearch; 