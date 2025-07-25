import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

import { Theme } from "../styles/theme";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import { GarageScreen } from "../screens/GarageScreen";
import { CommunityScreen } from "../screens/CommunityScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case "Marketplace":
              iconName = focused ? "store" : "store-outline";
              break;
            case "Garage":
              iconName = focused ? "garage" : "garage-open";
              break;
            case "Community":
              iconName = focused ? "account-group" : "account-group-outline";
              break;
            case "Profile":
              iconName = focused ? "account-circle" : "account-circle-outline";
              break;
            default:
              iconName = "help-circle-outline";
          }

          return <TypedIcon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Theme.colors.accent.primary,
        tabBarInactiveTintColor: Theme.colors.content.primarySecondary,
        tabBarStyle: {
          backgroundColor: Theme.colors.content.backgroundElevated,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.content.border,
          paddingTop: 5,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          height: Platform.OS === "ios" ? 85 : 65,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: "Tunes",
          tabBarBadge: undefined, // Can be used for notifications
        }}
      />
      <Tab.Screen
        name="Garage"
        component={GarageScreen}
        options={{
          tabBarLabel: "Garage",
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: "Community",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
