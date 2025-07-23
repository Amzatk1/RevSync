import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  TextInput,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { AwardWinningTheme as Theme } from "../styles/awardWinningTheme";
import {
  IntelligentCard,
  MomentumScrollView,
} from "../components/awardWinning";
import SettingsRow from "../components/awardWinning/SettingsRow";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PrivacyPreferencesScreen from "./PrivacyPreferencesScreen";

const version = "1.2.3";

export const SettingsScreen: React.FC<{
  asModal?: boolean;
  onClose?: () => void;
}> = ({ asModal, onClose }) => {
  // State for toggles and search
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [theme, setTheme] = useState("system");
  const [textSize, setTextSize] = useState(1);
  const [layoutDensity, setLayoutDensity] = useState("comfortable");
  const [privacyPrefsVisible, setPrivacyPrefsVisible] = useState(false);

  // Placeholder handlers
  const handleSignOut = () =>
    Alert.alert("Sign Out", "You have been signed out.");
  const handleDeleteAccount = () =>
    Alert.alert("Delete Account", "Account deletion not implemented.");

  // Predictive search suggestions (placeholder)
  const suggestions = ["Theme", "Privacy", "Notifications", "Account", "Help"];
  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <MomentumScrollView
        style={{ flex: 1, backgroundColor: Theme.colors.content.background }}
      >
      {/* Header */}
      <View
        style={{
          padding: Theme.spacing.content.section,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={[Theme.typography.ios.heroTitle, { flex: 1 }]}>
          Settings
        </Text>
        {asModal && (
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Close settings"
            style={{ marginLeft: Theme.spacing.base, padding: 8 }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="close" size={28} color={Theme.colors.content.primary} />
          </TouchableOpacity>
        )}
      </View>
      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: Theme.spacing.content.section,
          marginBottom: Theme.spacing.content.section,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Theme.colors.content.backgroundElevated,
            borderRadius: Theme.spacing.base,
            paddingHorizontal: Theme.spacing.base,
            height: 48,
          }}
        >
          <Icon
            name="magnify"
            size={22}
            color={Theme.colors.content.secondary}
            style={{ marginRight: Theme.spacing.base }}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search settings…"
            placeholderTextColor={Theme.colors.content.secondary}
            style={{
              flex: 1,
              color: Theme.colors.content.primary,
              fontSize: 17,
              height: 48,
            }}
            accessibilityLabel="Search settings"
            returnKeyType="search"
          />
        </View>
        {search.length > 0 && (
          <View
            style={{
              backgroundColor: Theme.colors.content.backgroundElevated,
              borderRadius: Theme.spacing.base,
              marginTop: 4,
            }}
          >
            {filteredSuggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={{ padding: Theme.spacing.base }}
                onPress={() => setSearch(s)}
              >
                <Text style={{ color: Theme.colors.content.primary }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quick Toggle Row */}
      <View
        style={{
          flexDirection: "row",
          gap: Theme.spacing.base,
          paddingHorizontal: Theme.spacing.content.section,
          marginBottom: Theme.spacing.content.section,
        }}
      >
        <IntelligentCard
          style={{
            flex: 1,
            alignItems: "center",
            flexDirection: "row",
            gap: Theme.spacing.base,
          }}
        >
          <Icon
            name="moon-waning-crescent"
            size={22}
            color={Theme.colors.accent.primary}
          />
          <SettingsRow
            label="Dark Mode"
            right={<Switch value={darkMode} onValueChange={setDarkMode} />}
          />
        </IntelligentCard>
        <IntelligentCard
          style={{
            flex: 1,
            alignItems: "center",
            flexDirection: "row",
            gap: Theme.spacing.base,
          }}
        >
          <Icon name="bell" size={22} color={Theme.colors.accent.primary} />
          <SettingsRow
            label="Notifications"
            right={
              <Switch value={notifications} onValueChange={setNotifications} />
            }
          />
        </IntelligentCard>
        <IntelligentCard
          style={{
            flex: 1,
            alignItems: "center",
            flexDirection: "row",
            gap: Theme.spacing.base,
          }}
        >
          <Icon
            name="shield-check"
            size={22}
            color={Theme.colors.accent.primary}
          />
          <SettingsRow
            label="Privacy Mode"
            right={
              <Switch value={privacyMode} onValueChange={setPrivacyMode} />
            }
          />
        </IntelligentCard>
      </View>

      {/* Section: Account */}
      <IntelligentCard style={{ marginBottom: Theme.spacing.content.section }}>
        <Text
          style={[
            Theme.typography.ios.labelLarge,
            {
              marginBottom: Theme.spacing.base,
              color: Theme.colors.content.secondary,
            },
          ]}
        >
          ◆ Account
        </Text>
        <SettingsRow
          label="Profile & Personal Info"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
        <SettingsRow
          label="Password & Security"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
        <SettingsRow
          label="Connected Services"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
      </IntelligentCard>

      {/* Section: Notifications & Behavior */}
      <IntelligentCard style={{ marginBottom: Theme.spacing.content.section }}>
        <Text
          style={[
            Theme.typography.ios.labelLarge,
            {
              marginBottom: Theme.spacing.base,
              color: Theme.colors.content.secondary,
            },
          ]}
        >
          ◆ Notifications & Behavior
        </Text>
        <SettingsRow
          label="Push Notifications"
          right={
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          }
        />
        <SettingsRow
          label="Auto Download Media"
          right={
            <Switch value={autoDownload} onValueChange={setAutoDownload} />
          }
        />
        <SettingsRow
          label="Language & Timezone"
          right={
            <Icon
              name="chevron-down"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
          onPress={() => {}}
        />
      </IntelligentCard>

      {/* Section: Appearance */}
      <IntelligentCard style={{ marginBottom: Theme.spacing.content.section }}>
        <Text
          style={[
            Theme.typography.ios.labelLarge,
            {
              marginBottom: Theme.spacing.base,
              color: Theme.colors.content.secondary,
            },
          ]}
        >
          ◆ Appearance
        </Text>
        <SettingsRow
          label="Theme"
          right={
            <Icon
              name="chevron-down"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
          onPress={() => {}}
        />
        <SettingsRow
          label="Text Size"
          right={
            <Text>
              {textSize === 1 ? "Normal" : textSize > 1 ? "Large" : "Small"}
            </Text>
          }
          onPress={() => {}}
        />
        <SettingsRow
          label="Layout Density"
          right={
            <Text>
              {layoutDensity.charAt(0).toUpperCase() + layoutDensity.slice(1)}
            </Text>
          }
          onPress={() => {}}
        />
      </IntelligentCard>

      {/* Section: Data & Privacy */}
      <IntelligentCard style={{ marginBottom: Theme.spacing.content.section }}>
        <Text
          style={[
            Theme.typography.ios.labelLarge,
            {
              marginBottom: Theme.spacing.base,
              color: Theme.colors.content.secondary,
            },
          ]}
        >
          ◆ Data & Privacy
        </Text>
        <SettingsRow
          label="Location Access"
          right={
            <Switch value={locationAccess} onValueChange={setLocationAccess} />
          }
        />
        <SettingsRow
          label="Analytics"
          right={<Switch value={analytics} onValueChange={setAnalytics} />}
        />
        <SettingsRow
          label="Privacy Preferences"
          onPress={() => setPrivacyPrefsVisible(true)}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
      </IntelligentCard>

      {/* Section: Support & Info */}
      <IntelligentCard style={{ marginBottom: Theme.spacing.content.section }}>
        <Text
          style={[
            Theme.typography.ios.labelLarge,
            {
              marginBottom: Theme.spacing.base,
              color: Theme.colors.content.secondary,
            },
          ]}
        >
          ◆ Support & Info
        </Text>
        <SettingsRow
          label="Help & Feedback"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
        <SettingsRow
          label="Rate & Share"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
        <SettingsRow label={`App Version ${version}`} disabled right={null} />
      </IntelligentCard>

      {/* Section: Legal */}
      <IntelligentCard style={{ marginBottom: Theme.spacing.content.section }}>
        <Text
          style={[
            Theme.typography.ios.labelLarge,
            {
              marginBottom: Theme.spacing.base,
              color: Theme.colors.content.secondary,
            },
          ]}
        >
          ◆ Legal
        </Text>
        <SettingsRow
          label="Terms & Conditions"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
        <SettingsRow
          label="Privacy Policy"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
        <SettingsRow
          label="EULA"
          onPress={() => {}}
          right={
            <Icon
              name="chevron-right"
              size={22}
              color={Theme.colors.content.secondary}
            />
          }
        />
      </IntelligentCard>

      {/* Footer Actions */}
      <View
        style={{
          paddingHorizontal: Theme.spacing.content.section,
          marginBottom: Theme.spacing.content.section,
        }}
      >
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={{
            backgroundColor: Theme.colors.semantic.error,
            borderRadius: Theme.spacing.base,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: Theme.spacing.base,
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete Account"
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 17 }}>
            Delete Account
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: Theme.colors.accent.primary,
            borderRadius: Theme.spacing.base,
            paddingVertical: 16,
            alignItems: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 17 }}>
            Sign Out
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            textAlign: "center",
            color: Theme.colors.content.tertiary,
            marginTop: Theme.spacing.base,
          }}
        >
          Version {version}
        </Text>
      </View>
    </MomentumScrollView>
    <PrivacyPreferencesScreen
      visible={privacyPrefsVisible}
      onClose={() => setPrivacyPrefsVisible(false)}
    />
    </>
  );
};

export default SettingsScreen;
