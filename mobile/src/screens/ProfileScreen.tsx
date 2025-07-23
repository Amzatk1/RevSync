import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useSelector, useDispatch } from "react-redux";

import {
  IntelligentCard,
  MomentumScrollView,
  GestureModal,
  AwardWinningTheme,
} from "../components/awardWinning";
import { RootState } from "../store";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_creator: boolean;
  creator_verified: boolean;
  total_purchases: number;
  total_downloads: number;
  member_since: string;
  subscription_type: "free" | "premium" | "creator";
}

interface UserSettings {
  notifications: {
    tune_updates: boolean;
    flash_status: boolean;
    marketplace_deals: boolean;
    safety_alerts: boolean;
  };
  safety: {
    require_manual_consent: boolean;
    enable_safety_mode: boolean;
    auto_backup: boolean;
    temperature_warnings: boolean;
  };
  privacy: {
    public_profile: boolean;
    share_flash_logs: boolean;
    anonymous_telemetry: boolean;
  };
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = AwardWinningTheme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  const { user } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Mock profile data
      setProfile({
        id: "1",
        username: "RiderDev",
        email: "rider@revsync.app",
        avatar_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        is_creator: true,
        creator_verified: true,
        total_purchases: 12,
        total_downloads: 248,
        member_since: "2023-03-15",
        subscription_type: "premium",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Mock settings data
      setSettings({
        notifications: {
          tune_updates: true,
          flash_status: true,
          marketplace_deals: false,
          safety_alerts: true,
        },
        safety: {
          require_manual_consent: true,
          enable_safety_mode: true,
          auto_backup: true,
          temperature_warnings: true,
        },
        privacy: {
          public_profile: false,
          share_flash_logs: true,
          anonymous_telemetry: true,
        },
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSettingToggle = async (
    category: string,
    setting: string,
    value: boolean
  ) => {
    await Haptics.selectionAsync();
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category as keyof UserSettings],
          [setting]: value,
        },
      };
    });
  };

  const handleEditProfile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Edit Profile", "Navigate to profile editor");
  };

  const handleSubscription = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Subscription", "Manage subscription settings");
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => console.log("Logout"),
      },
    ]);
  };

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getSubscriptionBadgeColor = (type: string) => {
    switch (type) {
      case "premium":
        return colors.accent.primaryGlow;
      case "creator":
        return colors.semantic.success;
      default:
        return colors.content.tertiary;
    }
  };

  const renderStatsCards = () => {
    if (!profile) return null;

    const stats = [
      {
        icon: "download",
        count: profile.total_downloads,
        label: "Downloads",
        color: colors.semantic.info,
      },
      {
        icon: "cart",
        count: profile.total_purchases,
        label: "Purchases",
        color: colors.accent.primary,
      },
      {
        icon: "star",
        count: profile.creator_verified ? 1 : 0,
        label: "Verified",
        color: colors.semantic.success,
      },
    ];

    return (
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.content.cardOuter,
          marginBottom: theme.spacing.content.section,
        }}
      >
        {stats.map((stat, index) => (
          <IntelligentCard
            key={index}
            variant="minimal"
            bloomEnabled={false}
            style={{
              flex: 1,
              marginBottom: 0,
              alignItems: "center",
            }}
          >
            <Icon name={stat.icon} size={24} color={stat.color} />
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.headlineSmall
                  : theme.typography.material.headlineSmall,
                {
                  color: colors.content.primary,
                  marginTop: theme.spacing.xs,
                  marginBottom: theme.spacing.xxxs,
                },
              ]}
            >
              {stat.count}
            </Text>
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.labelMedium
                  : theme.typography.material.labelMedium,
                { color: colors.content.secondary },
              ]}
            >
              {stat.label}
            </Text>
          </IntelligentCard>
        ))}
      </View>
    );
  };

  const renderSettingsSection = (
    title: string,
    items: any,
    category: string
  ) => (
    <View style={{ marginBottom: theme.spacing.content.section }}>
      <Text
        style={[
          isIOS
            ? theme.typography.ios.headlineSmall
            : theme.typography.material.headlineSmall,
          {
            color: colors.content.primary,
            marginBottom: theme.spacing.base,
          },
        ]}
      >
        {title}
      </Text>

      <IntelligentCard
        variant="elevated"
        textContent={true}
        bloomEnabled={false}
        style={{ marginBottom: 0 }}
      >
        <View style={{ gap: theme.spacing.base }}>
          {Object.entries(items).map(([key, value], index, array) => (
            <View key={key}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelLarge
                        : theme.typography.material.labelLarge,
                      { color: colors.content.primary },
                    ]}
                  >
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
                <Switch
                  value={value as boolean}
                  onValueChange={(newValue) =>
                    handleSettingToggle(category, key, newValue)
                  }
                  trackColor={{
                    false: colors.content.border,
                    true: colors.accent.primarySoft,
                  }}
                  thumbColor={
                    value ? colors.accent.primary : colors.content.tertiary
                  }
                />
              </View>
              {index < array.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.content.divider,
                    marginTop: theme.spacing.base,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </IntelligentCard>
    </View>
  );

  if (!profile || !settings) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.content.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={[
            isIOS
              ? theme.typography.ios.bodyLarge
              : theme.typography.material.bodyLarge,
            { color: colors.content.secondary },
          ]}
        >
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.content.background,
      }}
    >
      <MomentumScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: theme.spacing.content.hero,
        }}
        rubberbandEnabled={true}
        elasticOverscroll={true}
        hapticFeedback={true}
        contentRevealStagger={true}
        intelligentBounce={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Profile Section */}
        <IntelligentCard
          variant="hero"
          bloomEnabled={false}
          style={{
            marginHorizontal: theme.spacing.base,
            marginTop: theme.spacing.content.section,
            marginBottom: theme.spacing.content.section,
            alignItems: "center",
          }}
        >
          {/* Profile Avatar */}
          <View
            style={{
              width: theme.device.isTablet ? 120 : 100,
              height: theme.device.isTablet ? 120 : 100,
              borderRadius: theme.device.isTablet ? 60 : 50,
              overflow: "hidden",
              marginBottom: theme.spacing.content.paragraph,
              backgroundColor: colors.content.backgroundElevated,
            }}
          >
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.accent.primarySubtle,
                }}
              >
                <Icon
                  name="account"
                  size={theme.device.isTablet ? 60 : 50}
                  color={colors.accent.primary}
                />
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View
            style={{
              alignItems: "center",
              marginBottom: theme.spacing.content.paragraph,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.xs,
              }}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.headlineLarge
                    : theme.typography.material.headlineLarge,
                  { color: colors.content.primary },
                ]}
              >
                {profile.username}
              </Text>
              {profile.creator_verified && (
                <Icon
                  name="check-decagram"
                  size={24}
                  color={colors.semantic.success}
                />
              )}
            </View>

            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodyLarge
                  : theme.typography.material.bodyLarge,
                {
                  color: colors.content.secondary,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              {profile.email}
            </Text>

            {/* Subscription Badge */}
            <View
              style={{
                paddingHorizontal: theme.spacing.base,
                paddingVertical: theme.spacing.xs,
                backgroundColor: getSubscriptionBadgeColor(
                  profile.subscription_type
                ),
                borderRadius: theme.spacing.base,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelMedium
                    : theme.typography.material.labelMedium,
                  {
                    color: "#FFFFFF",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  },
                ]}
              >
                {profile.subscription_type}
              </Text>
            </View>

            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodyMedium
                  : theme.typography.material.bodyMedium,
                { color: colors.content.tertiary },
              ]}
            >
              Member since {formatMemberSince(profile.member_since)}
            </Text>
          </View>

          {/* Profile Actions */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.base,
              width: "100%",
            }}
          >
            <IntelligentCard
              variant="minimal"
              bloomEnabled={true}
              onPress={handleEditProfile}
              style={{
                flex: 1,
                marginBottom: 0,
                alignItems: "center",
                backgroundColor: colors.accent.primary,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                }}
              >
                <Icon name="pencil" size={16} color="#FFFFFF" />
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    { color: "#FFFFFF", fontWeight: "600" },
                  ]}
                >
                  Edit Profile
                </Text>
              </View>
            </IntelligentCard>

            <IntelligentCard
              variant="minimal"
              bloomEnabled={true}
              onPress={handleSubscription}
              style={{
                flex: 1,
                marginBottom: 0,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                }}
              >
                <Icon name="crown" size={16} color={colors.accent.primary} />
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    { color: colors.accent.primary, fontWeight: "600" },
                  ]}
                >
                  Subscription
                </Text>
              </View>
            </IntelligentCard>
          </View>
        </IntelligentCard>

        <View style={{ paddingHorizontal: theme.spacing.base }}>
          {/* Stats Cards */}
          {renderStatsCards()}

          {/* Quick Actions */}
          <Text
            style={[
              isIOS
                ? theme.typography.ios.headlineMedium
                : theme.typography.material.headlineMedium,
              {
                color: colors.content.primary,
                marginBottom: theme.spacing.content.section,
              },
            ]}
          >
            Quick Actions
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: theme.spacing.content.cardOuter,
              marginBottom: theme.spacing.content.section,
            }}
          >
            {[
              {
                icon: "cog",
                title: "Settings",
                action: () => setSettingsModalVisible(true),
              },
              {
                icon: "shield-check",
                title: "Safety",
                action: () => Alert.alert("Safety", "Safety settings"),
              },
              {
                icon: "help-circle",
                title: "Help",
                action: () => Alert.alert("Help", "Help & Support"),
              },
              {
                icon: "star",
                title: "Rate App",
                action: () => Alert.alert("Rate", "Rate RevSync"),
              },
            ].map((item, index) => (
              <IntelligentCard
                key={index}
                variant="elevated"
                bloomEnabled={true}
                onPress={item.action}
                style={{
                  width: `${(100 - 4) / 2}%`,
                  marginBottom: 0,
                  alignItems: "center",
                  paddingVertical: theme.spacing.content.paragraph,
                }}
              >
                <Icon
                  name={item.icon}
                  size={32}
                  color={colors.accent.primary}
                />
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelLarge
                      : theme.typography.material.labelLarge,
                    {
                      color: colors.content.primary,
                      marginTop: theme.spacing.sm,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </IntelligentCard>
            ))}
          </View>

          {/* Sign Out */}
          <IntelligentCard
            variant="minimal"
            bloomEnabled={true}
            onPress={handleLogout}
            style={{
              borderWidth: 2,
              borderColor: colors.semantic.error,
              backgroundColor: colors.semantic.errorBg,
              alignItems: "center",
              marginBottom: 0,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <Icon name="logout" size={20} color={colors.semantic.error} />
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.labelLarge
                    : theme.typography.material.labelLarge,
                  { color: colors.semantic.error, fontWeight: "600" },
                ]}
              >
                Sign Out
              </Text>
            </View>
          </IntelligentCard>
        </View>
      </MomentumScrollView>

      {/* Settings Modal */}
      <GestureModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        variant="sheet"
        title="Settings"
        subtitle="Manage your app preferences"
        gestureEnabled={true}
        intelligentGlass={true}
        bloomFeedback={true}
        glassType="textHeavy"
        textContent={true}
      >
        <View>
          {renderSettingsSection(
            "Notifications",
            settings.notifications,
            "notifications"
          )}
          {renderSettingsSection("Safety", settings.safety, "safety")}
          {renderSettingsSection("Privacy", settings.privacy, "privacy")}

          <IntelligentCard
            variant="minimal"
            bloomEnabled={true}
            style={{
              alignItems: "center",
              backgroundColor: colors.accent.primarySubtle,
              marginBottom: 0,
            }}
          >
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodyMedium
                  : theme.typography.material.bodyMedium,
                {
                  color: colors.accent.primary,
                  textAlign: "center",
                  fontStyle: "italic",
                },
              ]}
            >
              Settings are automatically saved
            </Text>
          </IntelligentCard>
        </View>
      </GestureModal>
    </SafeAreaView>
  );
};
