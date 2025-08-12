/**
 * RevSync Mobile App
 * Main entry point
 */

// Import polyfills first to ensure global compatibility
// import './src/polyfills'; // TEMPORARILY DISABLED - CAUSING HERMES REQUIRE ERROR

// Required for React Native Reanimated & Gesture Handler
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);
