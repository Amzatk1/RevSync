import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Theme } from '../../styles/theme';

// Type fixes for React 18+ compatibility
const TypedIcon = Icon as any;

interface SettingsHeaderProps {
  onClose?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch?: boolean;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  onClose,
  searchQuery,
  onSearchChange,
  showSearch = true,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.title}>Settings</Text>
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close settings"
            accessibilityRole="button"
          >
            <TypedIcon
              name="close"
              size={24}
              color={Theme.colors.content.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
            isSearchFocused && styles.searchInputFocused
          ]}>
            <TypedIcon
              name="magnify"
              size={20}
              color={Theme.colors.content.tertiary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search settings..."
              placeholderTextColor={Theme.colors.content.tertiary}
              value={searchQuery}
              onChangeText={onSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Search settings"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => onSearchChange('')}
                accessibilityLabel="Clear search"
              >
                <TypedIcon
                  name="close-circle"
                  size={18}
                  color={Theme.colors.content.tertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.content.background,
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.content.primary,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.content.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.content.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInputFocused: {
    borderColor: Theme.colors.accent.primary,
    backgroundColor: Theme.colors.content.background,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.content.primary,
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
});

export default SettingsHeader; 