// cSpell:words Ducati Panigale Keihin xxxs rubberband
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as Haptics from "expo-haptics";
import { useSelector, useDispatch } from "react-redux";
// Navigation prop will be received from React Navigation instead of using useNavigation

import IntelligentCard from "../components/ui/IntelligentCard";
import { Button, SectionHeader, Badge } from "../components/ui";
import MomentumScrollView from "../components/ui/MomentumScrollView";
import GestureModal from "../components/ui/GestureModal";

//

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

// Supabase client (Expo public env)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

import { Theme } from "../styles/theme";
import { RootState } from "../store";

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
  connection_status: "connected" | "disconnected" | "never_connected";
  battery_level?: number;
  last_connected?: string;
  vin?: string;
  mileage_km?: number;
}

interface GarageScreenProps { navigation?: any }
export const GarageScreen: React.FC<GarageScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = Theme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  const { user } = useSelector((state: RootState) => state.auth);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Motorcycle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // navigation provided via props (avoids type issues with useNavigation in this setup)

  // Locale‑aware relative time
  const formatRelativeTime = (iso?: string) => {
    if (!iso) return "Never";
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const sec = Math.round(diffMs / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    if (Math.abs(sec) < 60) return rtf.format(-sec, "second");
    if (Math.abs(min) < 60) return rtf.format(-min, "minute");
    if (Math.abs(hr) < 24) return rtf.format(-hr, "hour");
    return rtf.format(-day, "day");
  };

  const getBatteryIcon = (level?: number) => {
    if (typeof level !== "number") return "battery";
    if (level >= 90) return "battery";
    if (level >= 80) return "battery-90";
    if (level >= 60) return "battery-70";
    if (level >= 40) return "battery-50";
    if (level >= 20) return "battery-30";
    if (level > 0) return "battery-20";
    return "battery-outline";
  };

  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      if (!supabase || !user) {
        // If Supabase not configured or user not loaded, show empty state gracefully
        setMotorcycles([]);
        return;
      }

      const { data, error } = await supabase
        .from("user_motorcycles_view")
        .select(
          "id,make,model,year,image_url,ecu_type,connection_protocol,last_flash_date,current_tune,connection_status,battery_level,last_connected,vin,mileage_km"
        )
        .eq("user_id", user.id)
        .order("last_connected", { ascending: false, nullsFirst: true });

      if (error) throw error;

      setMotorcycles((data as any[]) || []);
    } catch (err: any) {
      console.error("Failed to load motorcycles:", err);
      setErrorMessage(err?.message || "Failed to load garage.");
      Alert.alert("Error", "Failed to load garage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return colors.semantic.success;
      case "disconnected":
        return colors.semantic.warning;
      case "never_connected":
        return colors.content.tertiary;
      default:
        return colors.content.tertiary;
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
      case "never_connected":
        return "Never Connected";
      default:
        return "Unknown";
    }
  };

  const formatLastConnected = (dateString?: string) => formatRelativeTime(dateString);

  const handleBikePress = async (bike: Motorcycle) => {
    try { await Haptics.selectionAsync(); } catch {}
    setSelectedBike(bike);
    setModalVisible(true);
  };

  const handleFlashTune = async (bike: Motorcycle) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    Alert.alert(
      "🏍️ Flash Tune",
      `Ready to flash ${bike.make} ${bike.model}?\n\nThis will upload your selected tune to the ECU.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Flash",
          style: "default",
          onPress: () => Alert.alert("Success", "Tune flashed successfully!"),
        },
      ]
    );
  };

  const handleAddBike = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    Alert.alert("Add Motorcycle", "Navigate to bike scanner/setup");
  };

  const handleRefresh = async () => {
    await Haptics.selectionAsync();
    loadMotorcycles();
  };

  const renderBikeCard = (bike: Motorcycle) => (
      <IntelligentCard
      key={bike.id}
      variant="elevated"
      bloomEnabled={true}
      momentumEnabled={true}
      gestureEnabled={true}
      adaptiveGlass={true}
      glassType="subtle"
      onPress={() => handleBikePress(bike)}
      onLongPress={() => handleFlashTune(bike)}
      style={{
        marginBottom: theme.spacing.content.cardOuter,
      }}
      accessibilityLabel={`${bike.make} ${bike.model} ${bike.year}. ${getConnectionStatusText(bike.connection_status)}${typeof bike.battery_level === "number" ? `, battery ${bike.battery_level}%` : ""}. Current tune: ${bike.current_tune}.`}
      accessibilityHint="Tap for details, long press to flash tune"
    >
      <View style={{ flexDirection: "row", gap: theme.spacing.base }}>
        {/* Bike Image */}
        <View
          style={{
            width: theme.device.isTablet ? 120 : 80,
            height: theme.device.isTablet ? 90 : 60,
            borderRadius: theme.spacing.sm,
            overflow: "hidden",
            backgroundColor: colors.content.backgroundSubtle,
          }}
        >
          {bike.image_url ? (
            <Image
              source={{ uri: bike.image_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.content.backgroundElevated,
              }}
            >
              <TypedIcon
                name="motorcycle"
                size={theme.device.isTablet ? 40 : 32}
                color={colors.content.tertiary}
              />
            </View>
          )}
        </View>

        {/* Bike Info */}
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          {/* Bike Title */}
          <Text
            style={[
              isIOS
                ? theme.typography.ios.headlineSmall
                : theme.typography.material.headlineSmall,
              { color: colors.content.primary },
            ]}
            allowFontScaling
          >
            {bike.make} {bike.model}
          </Text>

          <Text
            style={[
              isIOS
                ? theme.typography.ios.bodyMedium
                : theme.typography.material.bodyMedium,
              { color: colors.content.secondary },
            ]}
            allowFontScaling
          >
            {bike.year} • {bike.ecu_type}
          </Text>

          {/* Connection Status */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: getConnectionStatusColor(
                  bike.connection_status
                ),
              }}
            />
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.labelMedium
                  : theme.typography.material.labelMedium,
                { color: getConnectionStatusColor(bike.connection_status) },
              ]}
              allowFontScaling
            >
              {getConnectionStatusText(bike.connection_status)}
            </Text>
            {typeof bike.battery_level === "number" && (
              <>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelMedium
                      : theme.typography.material.labelMedium,
                    { color: colors.content.tertiary },
                  ]}
                  allowFontScaling
                >
                  •
                </Text>
                <TypedIcon
                  name={getBatteryIcon(bike.battery_level)}
                  size={14}
                  color={colors.content.tertiary}
                />
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelMedium
                      : theme.typography.material.labelMedium,
                    { color: colors.content.tertiary },
                  ]}
                  allowFontScaling
                >
                  {bike.battery_level}%
                </Text>
              </>
            )}
          </View>

          {/* Current Tune */}
          <Text
            style={[
              isIOS
                ? theme.typography.ios.labelLarge
                : theme.typography.material.labelLarge,
              {
                color:
                  bike.current_tune === "Stock ECU"
                    ? colors.content.tertiary
                    : colors.accent.primary,
                fontWeight: "600",
              },
            ]}
            allowFontScaling
          >
            {bike.current_tune}
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
            <TouchableOpacity
              onPress={() => handleFlashTune(bike)}
              accessibilityRole="button"
              accessibilityLabel={`Flash tune for ${bike.make} ${bike.model}`}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.accent.primary, flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <TypedIcon name="flash" size={14} color="#FFFFFF" />
              <Text style={[isIOS ? theme.typography.ios.labelMedium : theme.typography.material.labelMedium, { color: "#FFFFFF", fontWeight: "600" }]} allowFontScaling>
                Flash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert("Diagnostics", "Opening diagnostics…")}
              accessibilityRole="button"
              accessibilityLabel={`Open diagnostics for ${bike.make} ${bike.model}`}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.content.backgroundElevated, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.content.border }}
            >
              <TypedIcon name="stethoscope" size={14} color={colors.content.primary} />
              <Text style={[isIOS ? theme.typography.ios.labelMedium : theme.typography.material.labelMedium, { color: colors.content.primary, fontWeight: "600" }]} allowFontScaling>
                Diagnostics
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </IntelligentCard>
  );

  const renderStatsCards = () => {
    const tunedCount = motorcycles.filter(
      (b) => b.current_tune !== "Stock ECU"
    ).length;
    const connectedCount = motorcycles.filter(
      (b) => b.connection_status === "connected"
    ).length;
    const backedUpCount = motorcycles.filter((b) => b.last_flash_date).length;

    const stats = [
      {
        icon: "flash",
        count: tunedCount,
        label: "Tuned",
        color: colors.accent.primary,
      },
      {
        icon: "wifi",
        count: connectedCount,
        label: "Connected",
        color: colors.semantic.success,
      },
      {
        icon: "shield-check",
        count: backedUpCount,
        label: "Backed Up",
        color: colors.semantic.info,
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
            <TypedIcon name={stat.icon} size={24} color={stat.color} />
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
              allowFontScaling
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
              allowFontScaling
            >
              {stat.label}
            </Text>
          </IntelligentCard>
        ))}
      </View>
    );
  };

  const renderSkeletons = () => (
    <View style={{ gap: theme.spacing.content.cardOuter, marginBottom: theme.spacing.content.section }}>
      {[0, 1, 2].map((i) => (
        <IntelligentCard key={`sk_${i}`} variant="elevated" bloomEnabled={false} style={{ marginBottom: 0 }}>
          <View style={{ flexDirection: "row", gap: theme.spacing.base }}>
            <View style={{ width: theme.device.isTablet ? 120 : 80, height: theme.device.isTablet ? 90 : 60, borderRadius: theme.spacing.sm, backgroundColor: colors.content.backgroundElevated }} />
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <View style={{ height: 18, width: "60%", borderRadius: 6, backgroundColor: colors.content.backgroundElevated }} />
              <View style={{ height: 14, width: "40%", borderRadius: 6, backgroundColor: colors.content.backgroundElevated }} />
              <View style={{ height: 12, width: "30%", borderRadius: 6, backgroundColor: colors.content.backgroundElevated }} />
            </View>
          </View>
        </IntelligentCard>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.base,
        minHeight: theme.device.height * 0.5,
      }}
    >
      <TypedIcon name="garage-open" size={80} color={colors.content.tertiary} />
      <Text
        style={[
          isIOS
            ? theme.typography.ios.headlineLarge
            : theme.typography.material.headlineLarge,
          {
            color: colors.content.primary,
            textAlign: "center",
            marginTop: theme.spacing.content.section,
            marginBottom: theme.spacing.base,
          },
        ]}
        allowFontScaling
      >
        Your garage is empty
      </Text>
      <Text
        style={[
          isIOS
            ? theme.typography.ios.bodyLarge
            : theme.typography.material.bodyLarge,
          {
            color: colors.content.secondary,
            textAlign: "center",
            lineHeight: 28,
            marginBottom: theme.spacing.content.section,
          },
        ]}
        allowFontScaling
      >
        Add your first motorcycle to start tuning and tracking performance
      </Text>
      <IntelligentCard
        variant="elevated"
        bloomEnabled={true}
        onPress={handleAddBike}
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.base,
          marginBottom: 0,
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
          <TypedIcon name="plus" size={20} color="#FFFFFF" />
          <Text
            style={[
              isIOS
                ? theme.typography.ios.labelLarge
                : theme.typography.material.labelLarge,
              {
                color: "#FFFFFF",
                fontWeight: "600",
              },
            ]}
            allowFontScaling
          >
            Add Your First Bike
          </Text>
        </View>
      </IntelligentCard>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.content.background,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: theme.spacing.base,
          paddingTop: theme.spacing.content.section,
          paddingBottom: theme.spacing.base,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.heroTitle
                  : theme.typography.material.heroTitle,
                {
                  color: colors.content.primary,
                  marginBottom: theme.spacing.xs,
                },
              ]}
              allowFontScaling
            >
              My Garage
            </Text>
            <Text
              style={[
                isIOS
                  ? theme.typography.ios.bodyLarge
                  : theme.typography.material.bodyLarge,
                { color: colors.content.secondary },
              ]}
              allowFontScaling
            >
              {motorcycles.length}{" "}
              {motorcycles.length === 1 ? "motorcycle" : "motorcycles"}
            </Text>
          </View>

          <IntelligentCard
            variant="minimal"
            bloomEnabled={true}
            onPress={handleAddBike}
            style={{
              marginBottom: 0,
              padding: theme.spacing.sm,
              backgroundColor: colors.accent.primary,
              borderRadius: theme.spacing.base,
            }}
          >
            <TypedIcon name="plus" size={24} color="#FFFFFF" />
          </IntelligentCard>
        </View>
      </View>

      {/* Content */}
      <MomentumScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.base,
          paddingBottom: theme.spacing.content.hero,
        }}
        rubberbandEnabled={true}
        elasticOverscroll={true}
        hapticFeedback={true}
        contentRevealStagger={true}
        intelligentBounce={true}
        onOverscrollTop={handleRefresh}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage && (
          <IntelligentCard variant="minimal" bloomEnabled={false} style={{ marginBottom: theme.spacing.base, borderLeftWidth: 3, borderLeftColor: colors.semantic.error }}>
            <Text style={[isIOS ? theme.typography.ios.bodyMedium : theme.typography.material.bodyMedium, { color: colors.semantic.error }] } allowFontScaling>
              {errorMessage}
            </Text>
            <View style={{ flexDirection: "row", marginTop: theme.spacing.xs }}>
              <TouchableOpacity onPress={loadMotorcycles} accessibilityRole="button" accessibilityLabel="Retry loading garage">
                <Text style={[isIOS ? theme.typography.ios.labelLarge : theme.typography.material.labelLarge, { color: colors.accent.primary, fontWeight: "600" }]} allowFontScaling>Retry</Text>
              </TouchableOpacity>
            </View>
          </IntelligentCard>
        )}
        {motorcycles.length === 0 ? (
          loading ? renderSkeletons() : renderEmptyState()
        ) : (
          <>
            {/* Quick Stats */}
            {renderStatsCards()}

            {/* Motorcycles Section */}
            <SectionHeader title="Your Motorcycles" />

            {/* Bike Cards */}
            {motorcycles.map(renderBikeCard)}

            {/* Add Another Bike */}
            <Button title="Add Another Bike" onPress={handleAddBike} leftIcon={<TypedIcon name="plus" size={18} color="#fff" />} />
          </>
        )}
      </MomentumScrollView>

      {/* Bike Details Modal */}
      <GestureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        variant="sheet"
        title={
          selectedBike
            ? `${selectedBike.make} ${selectedBike.model}`
            : "Bike Details"
        }
        subtitle={
          selectedBike ? `${selectedBike.year} • ${selectedBike.ecu_type}` : ""
        }
        gestureEnabled={true}
        intelligentGlass={true}
        bloomFeedback={true}
        glassType="adaptLight"
        textContent={true}
      >
        {selectedBike && (
          <View style={{ gap: theme.spacing.content.paragraph }}>
            <IntelligentCard
              variant="minimal"
              style={{ marginBottom: 0 }}
              textContent={true}
            >
              <View style={{ gap: theme.spacing.base }}>
                <View>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelLarge
                        : theme.typography.material.labelLarge,
                      { color: colors.content.primary },
                    ]}
                    allowFontScaling
                  >
                    Connection Status
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.bodyLarge
                        : theme.typography.material.bodyLarge,
                      {
                        color: getConnectionStatusColor(
                          selectedBike.connection_status
                        ),
                      },
                    ]}
                    allowFontScaling
                  >
                    {getConnectionStatusText(selectedBike.connection_status)}
                  </Text>
                </View>

                <View>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelLarge
                        : theme.typography.material.labelLarge,
                      { color: colors.content.primary },
                    ]}
                    allowFontScaling
                  >
                    Current Tune
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.bodyLarge
                        : theme.typography.material.bodyLarge,
                      { color: colors.content.secondary },
                    ]}
                    allowFontScaling
                  >
                    {selectedBike.current_tune}
                  </Text>
                </View>

                <View>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelLarge
                        : theme.typography.material.labelLarge,
                      { color: colors.content.primary },
                    ]}
                    allowFontScaling
                  >
                    Last Connected
                  </Text>
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.bodyLarge
                        : theme.typography.material.bodyLarge,
                      { color: colors.content.secondary },
                    ]}
                    allowFontScaling
                  >
                    {formatRelativeTime(selectedBike.last_connected)}
                  </Text>
                </View>
              </View>
            </IntelligentCard>

            <View style={{ flexDirection: "row", gap: theme.spacing.base }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Flash Tune"
                  onPress={() => handleFlashTune(selectedBike)}
                  leftIcon={<TypedIcon name="flash" size={18} color="#FFFFFF" />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Settings"
                  variant="secondary"
                  onPress={() => {
                    if (navigation && typeof navigation.navigate === "function" && selectedBike) {
                      try { Haptics.selectionAsync(); } catch {}
                      navigation.navigate("MotorcycleSettings", { id: selectedBike.id });
                    } else {
                      Alert.alert("Settings", "Opening motorcycle settings…");
                    }
                  }}
                  leftIcon={<TypedIcon name="cog" size={18} color={colors.content.primary} />}
                />
              </View>
            </View>
          </View>
        )}
      </GestureModal>
    </SafeAreaView>
  );
};
