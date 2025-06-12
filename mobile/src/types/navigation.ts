import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Bottom Tab Navigator
export type BottomTabParamList = {
  Marketplace: undefined;
  Garage: undefined;
  ConnectedRide: undefined;
  Community: undefined;
  Profile: undefined;
};

// Stack Navigator (for modal screens, etc.)
export type RootStackParamList = {
  Main: undefined;
  TuneDetail: { tuneId: string };
  BikeDetail: { bikeId: string };
  AddBike: undefined;
  SafeFlash: { motorcycleId: string; currentTune: string };
  CreatorProfile: { creatorId: string };
  UploadTune: undefined;
  EditProfile: undefined;
  PurchaseHistory: undefined;
  FlashHistory: undefined;
  PaymentMethods: undefined;
  CreatorApplication: undefined;
  SafetyTutorial: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  SafetyDisclaimer: undefined;
  Support: undefined;
  About: undefined;
};

// Navigation prop types
export type BottomTabNavigationProps<T extends keyof BottomTabParamList> = 
  BottomTabNavigationProp<BottomTabParamList, T>;

export type RootStackNavigationProps<T extends keyof RootStackParamList> = 
  StackNavigationProp<RootStackParamList, T>;

export type CompositeNavigationProps<T extends keyof BottomTabParamList> = 
  CompositeNavigationProp<
    BottomTabNavigationProp<BottomTabParamList, T>,
    StackNavigationProp<RootStackParamList>
  >;

// Route prop types
export type BottomTabRouteProps<T extends keyof BottomTabParamList> = 
  RouteProp<BottomTabParamList, T>;

export type RootStackRouteProps<T extends keyof RootStackParamList> = 
  RouteProp<RootStackParamList, T>;

// Screen props
export type ScreenProps<T extends keyof BottomTabParamList> = {
  navigation: CompositeNavigationProps<T>;
  route: BottomTabRouteProps<T>;
}; 