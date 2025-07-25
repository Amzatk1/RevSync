import React from 'react';
import { View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Theme } from '../../styles/theme';

interface SettingsSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
}

const SettingsSlider: React.FC<SettingsSliderProps> = ({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
}) => {
  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor={Theme.colors.accent.primary}
        maximumTrackTintColor={Theme.colors.content.backgroundSubtle}
        thumbStyle={styles.thumb}
        trackStyle={styles.track}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    backgroundColor: Theme.colors.accent.primary,
    width: 20,
    height: 20,
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
});

export default SettingsSlider; 