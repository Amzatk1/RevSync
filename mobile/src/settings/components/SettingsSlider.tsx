import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
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
  const decrease = () => onValueChange(Math.max(minimumValue, value - step));
  const increase = () => onValueChange(Math.min(maximumValue, value + step));

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={decrease} style={styles.button} accessibilityLabel="Decrease">
        <Text style={styles.buttonText}>-</Text>
      </TouchableOpacity>
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
      <TouchableOpacity onPress={increase} style={styles.button} accessibilityLabel="Increase">
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.content.backgroundSubtle,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  button: {
    width: 32,
    height: 28,
    borderRadius: 6,
    backgroundColor: Theme.colors.content.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Theme.colors.content.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  valueText: {
    color: Theme.colors.content.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsSlider; 