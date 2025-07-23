import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Platform } from "react-native";

import { AwardWinningTheme as Theme } from "../styles/awardWinningTheme";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import { GarageScreen } from "../screens/GarageScreen";
import { CommunityScreen } from "../screens/CommunityScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import SafetyDisclaimerScreen from "../screens/SafetyDisclaimerScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC = () => {
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

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Theme.colors.accent.primary,
        tabBarInactiveTintColor: Theme.colors.content.primarySecondary,
        tabBarStyle: {
          backgroundColor: Theme.colors.content.backgroundElevated,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.border,
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
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
