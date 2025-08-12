import React, { useState } from "react";
import { View, Switch } from "react-native";
import GestureModal from "../components/ui/GestureModal";
import IntelligentCard from "../components/ui/IntelligentCard";
import SettingsRow from "../components/ui/SettingsRow";
import { Theme } from "../styles/theme";

interface PrivacyPreferencesScreenProps {
  visible: boolean;
  onClose: () => void;
}

const PrivacyPreferencesScreen: React.FC<PrivacyPreferencesScreenProps> = ({
  visible,
  onClose,
}) => {
  const [shareUsage, setShareUsage] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [partnerLocation, setPartnerLocation] = useState(false);

  return (
    <GestureModal
      visible={visible}
      onClose={onClose}
      title="Privacy Preferences"
      subtitle="Manage how we use your data"
      gestureEnabled
      glassType="medium"
    >
      <View style={{ gap: Theme.spacing.content.section }}>
        <IntelligentCard>
          <SettingsRow
            label="Share Usage Data"
            right={<Switch value={shareUsage} onValueChange={setShareUsage} />}
          />
          <SettingsRow
            label="Personalized Ads"
            right={<Switch value={personalizedAds} onValueChange={setPersonalizedAds} />}
          />
          <SettingsRow
            label="Partner Location Access"
            right={<Switch value={partnerLocation} onValueChange={setPartnerLocation} />}
          />
        </IntelligentCard>
      </View>
    </GestureModal>
  );
};

export default PrivacyPreferencesScreen;
