import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;
const TypedLinearGradient = LinearGradient as any;

import { Theme } from "../styles/theme";

interface Creator {
  id: string;
  username: string;
  avatar_url?: string;
  is_verified: boolean;
  total_downloads: number;
  tune_count: number;
  rating_average: number;
  specialties: string[];
  bio: string;
  joined_date: string;
}

interface CommunityTune {
  id: string;
  name: string;
  description: string;
  creator: Creator;
  download_count: number;
  rating_average: number;
  review_count: number;
  tags: string[];
  is_free: boolean;
  is_open_source: boolean;
  compatibility: string[];
  last_updated: string;
  image_url?: string;
}

const FEATURED_CREATORS: Creator[] = [
  {
    id: "1",
    username: "ProTunerMike",
    avatar_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    is_verified: true,
    total_downloads: 15420,
    tune_count: 47,
    rating_average: 4.8,
    specialties: ["Sport Bikes", "Track Tuning", "Dyno Testing"],
    bio: "Professional motorcycle tuner with 15+ years experience. Specializing in track-focused performance builds.",
    joined_date: "2022-03-15",
  },
  {
    id: "2",
    username: "EcoTuneGuru",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    is_verified: true,
    total_downloads: 8930,
    tune_count: 23,
    rating_average: 4.6,
    specialties: ["Fuel Economy", "Street Legal", "Emissions"],
    bio: "Focused on creating efficient, street-legal tunes that maintain reliability and pass emissions.",
    joined_date: "2023-01-20",
  },
  {
    id: "3",
    username: "RaceShop_Official",
    avatar_url:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100",
    is_verified: true,
    total_downloads: 23450,
    tune_count: 89,
    rating_average: 4.9,
    specialties: ["Racing", "Custom Maps", "Data Logging"],
    bio: "Official tuning division of Championship Racing Team. Professional race-grade calibrations.",
    joined_date: "2021-11-08",
  },
];

const OPEN_SOURCE_TUNES: CommunityTune[] = [
  {
    id: "1",
    name: "Open R6 Street Map",
    description:
      "Community-developed street tune for Yamaha R6. Smooth power delivery with improved throttle response.",
    creator: FEATURED_CREATORS[0],
    download_count: 2340,
    rating_average: 4.3,
    review_count: 89,
    tags: ["Open Source", "Street", "Community"],
    is_free: true,
    is_open_source: true,
    compatibility: ["Yamaha R6 2017-2020"],
    last_updated: "2024-01-15",
    image_url:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  },
  {
    id: "2",
    name: "Universal Eco Tune",
    description:
      "Base map focusing on fuel efficiency while maintaining performance. Fork and customize for your bike.",
    creator: FEATURED_CREATORS[1],
    download_count: 1870,
    rating_average: 4.1,
    review_count: 67,
    tags: ["Open Source", "Eco", "Base Map"],
    is_free: true,
    is_open_source: true,
    compatibility: ["Multiple Makes"],
    last_updated: "2024-01-10",
    image_url:
      "https://images.unsplash.com/photo-1558618047-3c8c6d99c0d2?w=400",
  },
];

export const CommunityScreen: React.FC = () => {
  // const navigation = useNavigation(); // Commented out - not currently used

  const [activeTab, setActiveTab] = useState<"creators" | "tunes" | "upload">(
    "creators"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [creators, setCreators] = useState<Creator[]>(FEATURED_CREATORS);
  const [communityTunes, setCommunityTunes] =
    useState<CommunityTune[]>(OPEN_SOURCE_TUNES);
  const [refreshing, setRefreshing] = useState(false);

  const filterOptions = [
    "Open Source",
    "Free",
    "Verified Creator",
    "Sport Bikes",
    "Eco",
    "Track",
  ];

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      // Load community data from API
      // For now using mock data
    } catch (error) {
      console.error("Failed to load community data:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCommunityData().finally(() => setRefreshing(false));
  };

  const handleCreatorPress = (creator: Creator) => {
    // navigation.navigate('CreatorProfile', { creatorId: creator.id });
    console.log("Creator pressed:", creator.username);
  };

  const handleTunePress = (tune: CommunityTune) => {
    // navigation.navigate('TuneDetail', { tuneId: tune.id });
    console.log("Tune pressed:", tune.name);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Member since ${date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })}`;
  };

  const renderCreatorCard = (creator: Creator) => (
    <TouchableOpacity
      key={creator.id}
      style={styles.creatorCard}
      onPress={() => handleCreatorPress(creator)}
    >
      <Image
        source={{
          uri: creator.avatar_url || "https://via.placeholder.com/60x60",
        }}
        style={styles.creatorAvatar}
      />

      <View style={styles.creatorInfo}>
        <View style={styles.creatorHeader}>
          <Text style={styles.creatorName}>{creator.username}</Text>
          {creator.is_verified && (
            <TypedIcon
              name="check-decagram"
              size={18}
              color={Theme.colors.accent.primary}
            />
          )}
        </View>

        <Text style={styles.creatorBio} numberOfLines={2}>
          {creator.bio}
        </Text>

        <View style={styles.creatorSpecialties}>
          {creator.specialties.slice(0, 2).map((specialty, index) => (
            <View key={index} style={styles.specialtyChip}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
          {creator.specialties.length > 2 && (
            <Text style={styles.moreSpecialties}>
              +{creator.specialties.length - 2} more
            </Text>
          )}
        </View>

        <View style={styles.creatorStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{creator.tune_count}</Text>
            <Text style={styles.statLabel}>Tunes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(creator.total_downloads / 1000).toFixed(1)}K
            </Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <TypedIcon
                name="star"
                size={14}
                color={Theme.colors.semantic.warning}
              />
              <Text style={styles.statValue}>
                {creator.rating_average.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <Text style={styles.joinDate}>
          {formatJoinDate(creator.joined_date)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTuneCard = (tune: CommunityTune) => (
    <TouchableOpacity
      key={tune.id}
      style={styles.tuneCard}
      onPress={() => handleTunePress(tune)}
    >
      <Image
        source={{ uri: tune.image_url || "https://via.placeholder.com/100x80" }}
        style={styles.tuneImage}
      />

      <View style={styles.tuneInfo}>
        <View style={styles.tuneHeader}>
          <Text style={styles.tuneName} numberOfLines={1}>
            {tune.name}
          </Text>

          <View style={styles.tuneBadges}>
            {tune.is_open_source && (
              <View style={[styles.badge, styles.openSourceBadge]}>
                <TypedIcon name="code-tags" size={10} color={"#FFFFFF"} />
                <Text style={styles.badgeText}>Open</Text>
              </View>
            )}
            {tune.is_free && (
              <View style={[styles.badge, styles.freeBadge]}>
                <Text style={styles.badgeText}>Free</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.tuneDescription} numberOfLines={2}>
          {tune.description}
        </Text>

        <View style={styles.tuneCreator}>
          <Image
            source={{
              uri:
                tune.creator.avatar_url || "https://via.placeholder.com/20x20",
            }}
            style={styles.tuneCreatorAvatar}
          />
          <Text style={styles.tuneCreatorName}>{tune.creator.username}</Text>
          {tune.creator.is_verified && (
            <Icon
              name="check-decagram"
              size={12}
              color={Theme.colors.accent.primary}
            />
          )}
        </View>

        <View style={styles.tuneFooter}>
          <View style={styles.tuneStats}>
            <Icon
              name="download"
              size={14}
              color={Theme.colors.content.primarySecondary}
            />
            <Text style={styles.tuneStatText}>{tune.download_count}</Text>

            <Icon
              name="star"
              size={14}
              color={Theme.colors.semantic.warning}
              style={{ marginLeft: 12 }}
            />
            <Text style={styles.tuneStatText}>
              {tune.rating_average.toFixed(1)} ({tune.review_count})
            </Text>
          </View>

          <Text style={styles.tuneUpdated}>
            Updated {new Date(tune.last_updated).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUploadFlow = () => (
    <View style={styles.uploadContainer}>
      <TypedLinearGradient
        colors={[Theme.colors.accent.primary, Theme.colors.accent.primaryDark]}
        style={styles.uploadHeader}
      >
        <TypedIcon name="upload" size={32} color={"#FFFFFF"} />
        <Text style={styles.uploadTitle}>Share Your Tune</Text>
        <Text style={styles.uploadSubtitle}>
          Contribute to the community and earn from your expertise
        </Text>
      </TypedLinearGradient>

      <View style={styles.uploadSteps}>
        <View style={styles.uploadStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Prepare Your Tune</Text>
            <Text style={styles.stepDescription}>
              Test thoroughly, document changes, and gather dyno data if
              available
            </Text>
          </View>
        </View>

        <View style={styles.uploadStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Upload & Describe</Text>
            <Text style={styles.stepDescription}>
              Add tune file, compatibility info, pricing, and detailed
              description
            </Text>
          </View>
        </View>

        <View style={styles.uploadStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Safety Review</Text>
            <Text style={styles.stepDescription}>
              Our team reviews for safety compliance and compatibility accuracy
            </Text>
          </View>
        </View>

        <View style={styles.uploadStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Go Live & Earn</Text>
            <Text style={styles.stepDescription}>
              Once approved, start earning 70% revenue share from sales
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startUploadButton}
        onPress={() => console.log("Upload tune pressed")}
      >
        <TypedIcon name="plus" size={20} color={"#FFFFFF"} />
        <Text style={styles.startUploadText}>Start Upload Process</Text>
      </TouchableOpacity>

      <View style={styles.uploadBenefits}>
        <Text style={styles.benefitsTitle}>Creator Benefits</Text>

        <View style={styles.benefitItem}>
          <TypedIcon name="cash" size={20} color={Theme.colors.semantic.success} />
          <Text style={styles.benefitText}>70% revenue share on all sales</Text>
        </View>

        <View style={styles.benefitItem}>
          <TypedIcon name="trophy" size={20} color={Theme.colors.semantic.warning} />
          <Text style={styles.benefitText}>Featured creator opportunities</Text>
        </View>

        <View style={styles.benefitItem}>
          <Icon
            name="account-group"
            size={20}
            color={Theme.colors.semantic.info}
          />
          <Text style={styles.benefitText}>Build community following</Text>
        </View>

        <View style={styles.benefitItem}>
          <Icon
            name="shield-check"
            size={20}
            color={Theme.colors.accent.primary}
          />
          <Text style={styles.benefitText}>Safety validation & support</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <TypedLinearGradient
        colors={[Theme.colors.accent.primary, Theme.colors.accent.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>
          Creators, tunes & collaboration
        </Text>
      </TypedLinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: "creators", label: "Creators", icon: "account-star" },
          { key: "tunes", label: "Open Source", icon: "code-tags" },
          { key: "upload", label: "Upload", icon: "upload" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={
                activeTab === tab.key
                  ? Theme.colors.accent.primary
                  : Theme.colors.content.primarySecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab !== "upload" && (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Icon
                name="magnify"
                size={20}
                color={Theme.colors.content.primarySecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Theme.colors.content.primarySecondary}
              />
            </View>
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilters.includes(filter) && styles.filterChipSelected,
                ]}
                onPress={() => toggleFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilters.includes(filter) &&
                      styles.filterChipTextSelected,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "creators" && (
          <View style={styles.creatorsSection}>
            <Text style={styles.sectionTitle}>Featured Creators</Text>
            {creators.map(renderCreatorCard)}
          </View>
        )}

        {activeTab === "tunes" && (
          <View style={styles.tunesSection}>
            <Text style={styles.sectionTitle}>Open Source Tunes</Text>
            <Text style={styles.sectionSubtitle}>
              Community-developed tunes you can download, modify, and
              redistribute
            </Text>
            {communityTunes.map(renderTuneCard)}
          </View>
        )}

        {activeTab === "upload" && renderUploadFlow()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.content.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: #FFFFFF,
  },
  headerSubtitle: {
    fontSize: 16,
    color: #FFFFFF,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Theme.colors.content.backgroundElevated,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Theme.colors.content.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Theme.colors.content.primarySecondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: Theme.colors.accent.primary,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.content.primary,
    marginLeft: 12,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipSelected: {
    backgroundColor: Theme.colors.accent.primary,
    borderColor: Theme.colors.accent.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Theme.colors.content.primary,
    fontWeight: "500",
  },
  filterChipTextSelected: {
    color: #FFFFFF,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  creatorsSection: {
    paddingHorizontal: 20,
  },
  creatorCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: "row",
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginRight: 6,
  },
  creatorBio: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  creatorSpecialties: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  specialtyChip: {
    backgroundColor: Theme.colors.accent.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  specialtyText: {
    fontSize: 10,
    fontWeight: "600",
    color: #FFFFFF,
  },
  moreSpecialties: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    fontStyle: "italic",
  },
  creatorStats: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statItem: {
    marginRight: 20,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  joinDate: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    fontStyle: "italic",
  },
  tunesSection: {
    paddingHorizontal: 20,
  },
  tuneCard: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: "row",
  },
  tuneImage: {
    width: 100,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  tuneInfo: {
    flex: 1,
  },
  tuneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  tuneName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    flex: 1,
    marginRight: 8,
  },
  tuneBadges: {
    flexDirection: "row",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  openSourceBadge: {
    backgroundColor: Theme.colors.semantic.info,
  },
  freeBadge: {
    backgroundColor: Theme.colors.semantic.success,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: #FFFFFF,
    marginLeft: 2,
  },
  tuneDescription: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  tuneCreator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tuneCreatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  tuneCreatorName: {
    fontSize: 14,
    fontWeight: "500",
    color: Theme.colors.content.primary,
    marginRight: 4,
  },
  tuneFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tuneStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  tuneStatText: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
    marginLeft: 4,
  },
  tuneUpdated: {
    fontSize: 12,
    color: Theme.colors.content.primarySecondary,
  },
  uploadContainer: {
    padding: 20,
  },
  uploadHeader: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: #FFFFFF,
    marginTop: 12,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: #FFFFFF,
    opacity: 0.9,
    textAlign: "center",
  },
  uploadSteps: {
    marginBottom: 24,
  },
  uploadStep: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: #FFFFFF,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Theme.colors.content.primarySecondary,
    lineHeight: 20,
  },
  startUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.accent.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  startUploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: #FFFFFF,
    marginLeft: 8,
  },
  uploadBenefits: {
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.content.primary,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: Theme.colors.content.primary,
    marginLeft: 12,
    flex: 1,
  },
});
