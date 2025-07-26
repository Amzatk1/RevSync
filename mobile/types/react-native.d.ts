/// <reference types="react" />

declare module 'react-native' {
  import * as React from 'react';
  
  // Fix JSX component type issues for React 19
  interface ComponentType<P = {}> {
    (props: P): React.ReactElement | null;
  }

  // View component
  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
    testID?: string;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    [key: string]: any;
  }
  export const View: React.ComponentType<ViewProps>;

  // Text component  
  export interface TextProps {
    style?: any;
    children?: React.ReactNode;
    testID?: string;
    numberOfLines?: number;
    [key: string]: any;
  }
  export const Text: React.ComponentType<TextProps>;

  // Image component
  export interface ImageProps {
    source?: any;
    style?: any;
    resizeMode?: string;
    testID?: string;
    [key: string]: any;
  }
  export const Image: React.ComponentType<ImageProps>;

  // TouchableOpacity component
  export interface TouchableOpacityProps {
    style?: any;
    children?: React.ReactNode;
    onPress?: () => void;
    activeOpacity?: number;
    disabled?: boolean;
    testID?: string;
    [key: string]: any;
  }
  export const TouchableOpacity: React.ComponentType<TouchableOpacityProps>;

  // ActivityIndicator component
  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    animating?: boolean;
    style?: any;
    [key: string]: any;
  }
  export const ActivityIndicator: React.ComponentType<ActivityIndicatorProps>;

  // SafeAreaView component
  export interface SafeAreaViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const SafeAreaView: React.ComponentType<SafeAreaViewProps>;

  // ScrollView component
  export interface ScrollViewProps {
    style?: any;
    children?: React.ReactNode;
    contentContainerStyle?: any;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    [key: string]: any;
  }
  export const ScrollView: React.ComponentType<ScrollViewProps>;

  // TextInput component
  export interface TextInputProps {
    style?: any;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    keyboardType?: string;
    [key: string]: any;
  }
  export const TextInput: React.ComponentType<TextInputProps>;

  // Modal component
  export interface ModalProps {
    visible?: boolean;
    transparent?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    onRequestClose?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export const Modal: React.ComponentType<ModalProps>;

  // FlatList component
  export interface FlatListProps<T = any> {
    data?: T[];
    renderItem?: ({ item, index }: { item: T; index: number }) => React.ReactElement;
    keyExtractor?: (item: T, index: number) => string;
    style?: any;
    contentContainerStyle?: any;
    showsVerticalScrollIndicator?: boolean;
    [key: string]: any;
  }
  export function FlatList<T = any>(props: FlatListProps<T>): React.ReactElement;

  // Alert
  export interface AlertButton {
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }
  export const Alert: {
    alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  };

  // Dimensions
  export const Dimensions: {
    get: (dimension: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
  };

  // Platform
  export const Platform: {
    OS: 'ios' | 'android' | 'native' | 'web';
    Version: string | number;
    select: <T>(specifics: { ios?: T; android?: T; native?: T; default?: T }) => T;
  };

  // StatusBar
  export interface StatusBarProps {
    backgroundColor?: string;
    barStyle?: 'default' | 'light-content' | 'dark-content';
    hidden?: boolean;
    translucent?: boolean;
    [key: string]: any;
  }
  export const StatusBar: React.ComponentType<StatusBarProps>;

  // StyleSheet
  export const StyleSheet: {
    create: <T extends { [key: string]: any }>(styles: T) => T;
    hairlineWidth: number;
    flatten: (style: any) => any;
  };

  // Keyboard
  export const Keyboard: {
    dismiss: () => void;
    addListener: (eventName: string, callback: Function) => any;
    removeListener: (eventName: string, callback: Function) => void;
  };

  // Linking
  export const Linking: {
    openURL: (url: string) => Promise<void>;
    canOpenURL: (url: string) => Promise<boolean>;
  };
} 