// Shared TypeScript types for RevSync Platform

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
}

export interface Motorcycle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  engineType: string;
  displacement: number;
  ecuType: ECUType;
  vinNumber?: string;
  nickname?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ECUType {
  id: string;
  name: string;
  manufacturer: string;
  protocolType: 'OBD2' | 'CAN' | 'K_LINE' | 'UART';
  connectionType: 'BLUETOOTH' | 'USB' | 'WIFI';
  supportedCommands: string[];
  flashSupported: boolean;
  readSupported: boolean;
}

export interface TuneFile {
  id: string;
  name: string;
  description?: string;
  version: string;
  creatorId: string;
  motorcycleId: string;
  ecuTypeId: string;
  fileUrl: string;
  fileSize: number;
  checksum: string;
  category: TuneCategory;
  status: TuneStatus;
  isPublic: boolean;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TuneCategory = 
  | 'PERFORMANCE'
  | 'ECONOMY'
  | 'RACING'
  | 'STREET'
  | 'CUSTOM'
  | 'STOCK';

export type TuneStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface FlashSession {
  id: string;
  userId: string;
  motorcycleId: string;
  tuneFileId: string;
  status: FlashStatus;
  startTime: string;
  endTime?: string;
  progress: number;
  errorMessage?: string;
  backupFileUrl?: string;
  logs: FlashLog[];
}

export type FlashStatus = 
  | 'PREPARING'
  | 'BACKING_UP'
  | 'VALIDATING'
  | 'FLASHING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface FlashLog {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  data?: any;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
  isConnected: boolean;
  services: string[];
}

export interface OBDCommand {
  command: string;
  description: string;
  expectedBytes: number;
  unit?: string;
  formula?: string;
}

export interface TelemetryData {
  timestamp: string;
  rpm: number;
  speed: number;
  throttlePosition: number;
  engineLoad: number;
  coolantTemp: number;
  intakeTemp: number;
  airFuelRatio?: number;
  boostPressure?: number;
  fuelPressure?: number;
  oilPressure?: number;
  oilTemp?: number;
  batteryVoltage: number;
  fuelLevel?: number;
}

export interface SafetyLimits {
  maxRpm: number;
  maxBoost: number;
  minAirFuelRatio: number;
  maxAirFuelRatio: number;
  maxCoolantTemp: number;
  maxIntakeTemp: number;
  maxOilTemp: number;
  minOilPressure: number;
}

export interface HardwareConnection {
  deviceId: string;
  deviceType: 'OBD2' | 'CUSTOM_CAN' | 'ESP32';
  connectionType: 'BLUETOOTH' | 'USB' | 'WIFI';
  isConnected: boolean;
  lastSeen?: string;
  firmwareVersion?: string;
  capabilities: string[];
}

export interface CommunityPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  tuneFileId?: string;
  motorcycleId?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string; // For nested comments
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface MotorcycleForm {
  make: string;
  model: string;
  year: number;
  engineType: string;
  displacement: number;
  ecuTypeId: string;
  vinNumber?: string;
  nickname?: string;
}

export interface TuneUploadForm {
  name: string;
  description?: string;
  version: string;
  motorcycleId: string;
  category: TuneCategory;
  tags: string[];
  file: File | null;
  isPublic: boolean;
}

// Store/State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MotorcycleState {
  motorcycles: Motorcycle[];
  selectedMotorcycle: Motorcycle | null;
  ecuTypes: ECUType[];
  isLoading: boolean;
  error: string | null;
}

export interface TuneState {
  tunes: TuneFile[];
  selectedTune: TuneFile | null;
  flashSession: FlashSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface HardwareState {
  devices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  connection: HardwareConnection | null;
  telemetry: TelemetryData | null;
  isScanning: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface CommunityState {
  posts: CommunityPost[];
  selectedPost: CommunityPost | null;
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
} 