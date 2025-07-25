import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

import { Theme } from "../styles/theme";
import { RootState } from "../store";
import { PerformanceTracker } from "../config/monitoring";

interface ProfileScreenProps {
  navigation?: any;
}

interface UserStats {
  tunesApplied: number;
  bikesOwned: number;
  achievements: number;
  milesRidden: number;
  memberSince: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  color: string;
}

interface RecentActivity {
  id: string;
  type: "tune_applied" | "tune_purchased" | "account_connected" | "achievement_earned";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const theme = Theme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    tunesApplied: 0,
    bikesOwned: 0,
    achievements: 0,
    milesRidden: 0,
    memberSince: "2024",
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "1",
      name: "First Tune",
      description: "Apply your first performance tune successfully",
      icon: "wrench",
      earned: false,
      color: "#FFB84D", // Orange
    },
    {
      id: "2",
      name: "Safety First",
      description: "Complete comprehensive safety training course",
      icon: "shield-check",
      earned: false,
      color: "#4ECDC4", // Teal
    },
    {
      id: "3",
      name: "Community Contributor", 
      description: "Share helpful tune reviews with the community",
      icon: "account-group",
      earned: false,
      color: "#45B7D1", // Blue
    },
    {
      id: "4",
      name: "Performance Pro",
      description: "Apply multiple performance tunes with good results",
      icon: "speedometer",
      earned: false,
      color: "#96CEB4", // Green
    },
    {
      id: "5",
      name: "Track Day Veteran",
      description: "Use track-optimized tunes on track days",
      icon: "racing-helmet",
      earned: false,
      color: "#FFEAA7", // Yellow
    },
    {
      id: "6",
      name: "Eco Warrior",
      description: "Improve fuel efficiency with eco tunes",
      icon: "leaf",
      earned: false,
      color: "#74B9FF", // Light Blue
    },
    {
      id: "7",
      name: "Data Scientist",
      description: "Contribute valuable performance data to AI training",
      icon: "chart-line",
      earned: false,
      color: "#A29BFE", // Purple
    },
    {
      id: "8",
      name: "Mentor",
      description: "Help other riders with tuning guidance",
      icon: "school",
      earned: false,
      color: "#FD79A8", // Pink
    },
    {
      id: "9",
      name: "Master Tuner",
      description: "Successfully apply many tunes across different bikes",
      icon: "certificate",
      earned: false,
      color: "#FDCB6E", // Gold
    },
    {
      id: "10",
      name: "Global Explorer",
      description: "Use RevSync in multiple countries",
      icon: "earth",
      earned: false,
      color: "#E17055", // Red-Orange
    },
  ]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // In a real app, this would fetch data from your API
      console.log("Loading user data...");
      
      PerformanceTracker.trackMarketplaceEvent("profile_viewed", {
        user_id: user?.id || "unknown",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isIOS) {
      await Haptics.selectionAsync();
    }
    await loadUserData();
    setRefreshing(false);
  };

  const handleSettingsPress = async () => {
    if (isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (navigation) {
      navigation.navigate("Settings");
    }
  };

  const handleActivityPress = async (activity: RecentActivity) => {
    if (isIOS) {
      await Haptics.selectionAsync();
    }
    Alert.alert(activity.title, activity.description);
  };

  const handleAchievementPress = async (achievement: Achievement) => {
    if (isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const status = achievement.earned ? "Earned" : "Not yet earned";
    const date = achievement.earnedDate ? `\nEarned: ${new Date(achievement.earnedDate).toLocaleDateString()}` : "";
    Alert.alert(achievement.name, `${achievement.description}\n\nStatus: ${status}${date}`);
  };

  const getActivityIcon = (type: RecentActivity["type"]): string => {
    switch (type) {
      case "tune_applied":
        return "motorcycle";
      case "tune_purchased":
        return "shopping";
      case "account_connected":
        return "link";
      case "achievement_earned":
        return "trophy";
      default:
        return "information";
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            onPress={handleSettingsPress} 
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <TypedIcon name="cog" size={24} color={colors.content.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>Your Name</Text>
          <Text style={styles.userMeta}>Member since {userStats.memberSince}</Text>
          <Text style={styles.userMeta}>{userStats.milesRidden.toLocaleString()} miles ridden</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.tunesApplied}</Text>
            <Text style={styles.statLabel}>Tunes{'\n'}Applied</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.bikesOwned}</Text>
            <Text style={styles.statLabel}>Bikes{'\n'}Owned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.achievements}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementBadge,
                  { backgroundColor: achievement.earned ? achievement.color + "20" : colors.content.backgroundSubtle },
                  { borderColor: achievement.earned ? achievement.color : colors.content.border },
                ]}
                onPress={() => handleAchievementPress(achievement)}
                activeOpacity={0.8}
              >
                <TypedIcon
                  name={achievement.icon}
                  size={28}
                  color={
                    achievement.earned
                      ? achievement.color
                      : colors.content.tertiary
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityItem}
                onPress={() => handleActivityPress(activity)}
                activeOpacity={0.8}
              >
                <View style={styles.activityIcon}>
                  <TypedIcon
                    name={getActivityIcon(activity.type)}
                    size={24}
                    color={colors.accent.primary}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: theme.spacing.content.hero }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Matches HTML background-color
  },

  // Header
  header: {
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#212529", // Matches HTML --text-primary
    textAlign: "center",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },

  // Content
  content: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 16,
    color: "#495057", // Matches HTML --text-secondary
    marginBottom: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#495057",
    textAlign: "center",
    lineHeight: 14,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  // Achievements
  achievementsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: "space-between",
  },
  achievementBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Activity
  activityList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e6f2ff", // Matches HTML --secondary-color
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: "#495057",
  },
});

export { ProfileScreen };
export default ProfileScreen;
