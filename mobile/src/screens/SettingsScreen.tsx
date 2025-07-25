import React from "react";
import { SettingsScreen as NewSettingsScreen } from "../settings";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  return (
    <NewSettingsScreen 
      navigation={navigation} 
      onClose={() => navigation.goBack()}
    />
  );
};

export default SettingsScreen;