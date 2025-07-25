// Navigation type fixes for React Navigation v6 + React 18 compatibility

declare module '@react-navigation/stack' {
  import { ComponentType } from 'react';
  
  export interface StackNavigatorProps {
    screenOptions?: any;
    children?: React.ReactNode;
  }
  
  export interface StackScreenProps {
    name: string;
    component: ComponentType<any>;
    options?: any;
    initialParams?: any;
  }
  
  export const Stack: {
    Navigator: ComponentType<StackNavigatorProps>;
    Screen: ComponentType<StackScreenProps>;
  };
  
  export function createStackNavigator(): typeof Stack;
}

declare module '@react-navigation/native' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface NavigationContainerProps {
    children?: ReactNode;
    theme?: any;
    linking?: any;
    fallback?: ReactNode;
    onReady?: () => void;
  }
  
  export const NavigationContainer: ComponentType<NavigationContainerProps>;
} 