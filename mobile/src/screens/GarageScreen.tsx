import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useSelector, useDispatch } from "react-redux";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

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
}

export const GarageScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = Theme;
  const colors = theme.colors;
  const isIOS = Platform.OS === "ios";

  const { user } = useSelector((state: RootState) => state.auth);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Motorcycle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      setMotorcycles([
        {
          id: "1",
          make: "Yamaha",
          model: "R6",
          year: 2020,
          image_url:
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
          ecu_type: "Bosch ME17",
          connection_protocol: "CAN-H/L",
          last_flash_date: "2024-01-20",
          current_tune: "Stage 2 Performance",
          connection_status: "connected",
          battery_level: 85,
          last_connected: "2024-01-22T10:30:00Z",
        },
        {
          id: "2",
          make: "Ducati",
          model: "Panigale V4",
          year: 2021,
          image_url:
            "https://images.unsplash.com/photo-1558618047-3c8c6d99c0d2?w=400",
          ecu_type: "Bosch ME17.3",
          connection_protocol: "CAN-H/L",
          last_flash_date: "2024-01-15",
          current_tune: "Stock ECU",
          connection_status: "disconnected",
          last_connected: "2024-01-20T15:45:00Z",
        },
        {
          id: "3",
          make: "Honda",
          model: "CBR1000RR",
          year: 2019,
          image_url:
            "https://images.unsplash.com/photo-1558618047-fc3c4b4af9e4?w=400",
          ecu_type: "Keihin ECU",
          connection_protocol: "4-pin OBD",
          current_tune: "Stock ECU",
          connection_status: "never_connected",
        },
      ]);
    } catch (error) {
      console.error("Failed to load motorcycles:", error);
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

  const formatLastConnected = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleBikePress = async (bike: Motorcycle) => {
    await Haptics.selectionAsync();
    setSelectedBike(bike);
    setModalVisible(true);
  };

  const handleFlashTune = async (bike: Motorcycle) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      accessibilityLabel={`${bike.make} ${bike.model} ${bike.year}`}
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
            >
              {getConnectionStatusText(bike.connection_status)}
            </Text>
            {bike.battery_level && (
              <>
                <Text
                  style={[
                    isIOS
                      ? theme.typography.ios.labelMedium
                      : theme.typography.material.labelMedium,
                    { color: colors.content.tertiary },
                  ]}
                >
                  •
                </Text>
                <TypedIcon
                  name="battery"
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
          >
            {bike.current_tune}
          </Text>
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
        {motorcycles.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Quick Stats */}
            {renderStatsCards()}

            {/* Motorcycles Section */}
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
              Your Motorcycles
            </Text>

            {/* Bike Cards */}
            {motorcycles.map(renderBikeCard)}

            {/* Add Another Bike */}
            <IntelligentCard
              variant="minimal"
              bloomEnabled={true}
              onPress={handleAddBike}
              style={{
                borderWidth: 2,
                borderColor: colors.content.border,
                borderStyle: "dashed",
                backgroundColor: colors.content.backgroundSubtle,
                alignItems: "center",
                paddingVertical: theme.spacing.xl,
                marginBottom: 0,
              }}
            >
              <TypedIcon
                name="plus-circle-outline"
                size={32}
                color={colors.accent.primary}
              />
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.headlineSmall
                    : theme.typography.material.headlineSmall,
                  {
                    color: colors.content.primary,
                    marginTop: theme.spacing.base,
                    marginBottom: theme.spacing.xs,
                  },
                ]}
              >
                Add Another Bike
              </Text>
              <Text
                style={[
                  isIOS
                    ? theme.typography.ios.bodyMedium
                    : theme.typography.material.bodyMedium,
                  {
                    color: colors.content.secondary,
                    textAlign: "center",
                  },
                ]}
              >
                Expand your garage and track more motorcycles
              </Text>
            </IntelligentCard>
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
                  >
                    {formatLastConnected(selectedBike.last_connected)}
                  </Text>
                </View>
              </View>
            </IntelligentCard>

            <View style={{ flexDirection: "row", gap: theme.spacing.base }}>
              <IntelligentCard
                variant="elevated"
                bloomEnabled={true}
                onPress={() => handleFlashTune(selectedBike)}
                style={{
                  flex: 1,
                  marginBottom: 0,
                  backgroundColor: colors.accent.primary,
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
                  <TypedIcon name="flash" size={16} color="#FFFFFF" />
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelLarge
                        : theme.typography.material.labelLarge,
                      { color: "#FFFFFF", fontWeight: "600" },
                    ]}
                  >
                    Flash Tune
                  </Text>
                </View>
              </IntelligentCard>

              <IntelligentCard
                variant="minimal"
                bloomEnabled={true}
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
                  <TypedIcon name="cog" size={16} color={colors.accent.primary} />
                  <Text
                    style={[
                      isIOS
                        ? theme.typography.ios.labelLarge
                        : theme.typography.material.labelLarge,
                      { color: colors.accent.primary, fontWeight: "600" },
                    ]}
                  >
                    Settings
                  </Text>
                </View>
              </IntelligentCard>
            </View>
          </View>
        )}
      </GestureModal>
    </SafeAreaView>
  );
};
