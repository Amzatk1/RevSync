# RevSync Mobile App

React Native mobile application for the RevSync motorcycle tuning platform.

## 📱 Features

- **Motorcycle Database**: Browse and search 17+ motorcycles from 12+ manufacturers
- **Tune Marketplace**: Access verified ECU tunes with safety ratings
- **Real-time Analytics**: Performance monitoring and telemetry (coming soon)
- **Community Features**: Reviews, ratings, and social interactions
- **Professional Tools**: Advanced tuning capabilities for professionals

## 🏗️ Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services and data management
│   │   ├── api.ts         # Main API client configuration
│   │   ├── motorcycleService.ts  # Motorcycle data service
│   │   ├── tuneService.ts      # Tune data service
│   │   └── connectionTest.ts   # Connection testing utilities
│   ├── store/             # Redux store configuration
│   ├── types/             # TypeScript type definitions
│   ├── styles/            # Styling and theme configuration
│   ├── utils/             # Utility functions
│   ├── config/            # Environment configuration
│   └── App.tsx            # Main app component
├── android/               # Android-specific code
├── ios/                  # iOS-specific code
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the backend server:**
   ```bash
   # In the backend directory
   cd ../backend
   python manage.py runserver 8000
   ```

3. **Start the React Native metro server:**
   ```bash
   npm start
   ```

4. **Run the app:**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## 🔧 Backend Integration

The mobile app connects to the Django REST API backend running on:
- **Development**: `http://localhost:8000/api` (iOS) or `http://10.0.2.2:8000/api` (Android Emulator)
- **Production**: `https://api.revsync.com/api`

### API Configuration

The API configuration is centralized in `src/config/environment.ts`:

```typescript
const config = {
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT: __DEV__ ? 15000 : 10000,
  ENABLE_LOGGING: __DEV__,
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
};
```

### Connection Testing

Use the built-in connection test utility to verify backend connectivity:

```typescript
import { DevelopmentHelper } from './src/utils/developmentHelper';

// Run comprehensive diagnostics
await DevelopmentHelper.runDiagnostics();

// Test specific API endpoint
await DevelopmentHelper.testApiCall('/bikes/stats/');
```

## 📊 Data Services

### Motorcycle Service

Handles all motorcycle-related data:
- Manufacturers
- Categories
- Engine types
- Motorcycle listings with filtering
- Detailed motorcycle information

### Tune Service

Manages tuning-related functionality:
- Tune categories and types
- Safety ratings
- Creator profiles
- Tune marketplace
- Reviews and ratings

## 🎨 Development

### Environment Variables

The app automatically detects the environment and configures itself accordingly:

- **Development**: Full logging, longer timeouts, localhost connections
- **Production**: Optimized settings, external API URLs

### Debugging

1. **Enable React Native Debugger**
2. **Use development helper utilities:**
   ```typescript
   import DevelopmentHelper from './src/utils/developmentHelper';
   
   // In your component
   useEffect(() => {
     DevelopmentHelper.runDiagnostics();
   }, []);
   ```

3. **Check network requests in Metro logs**

## 🔐 Authentication

The app supports token-based authentication:
- Tokens are stored securely using `@react-native-async-storage/async-storage`
- Automatic token refresh on API requests
- Logout on 401 responses

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API level 21+
- **React Native**: 0.73.2

## 🛠️ Build Process

### Development Builds

```bash
# Debug builds
npm run android
npm run ios
```

### Production Builds

```bash
# Android Release
npm run build:android

# iOS Release (requires Xcode)
npm run build:ios
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Lint code
npm run lint
```

## 📚 API Endpoints

The mobile app integrates with these main backend endpoints:

### Motorcycles
- `GET /api/bikes/manufacturers/` - List manufacturers
- `GET /api/bikes/categories/` - List categories
- `GET /api/bikes/motorcycles/` - List motorcycles with filters
- `GET /api/bikes/motorcycles/{id}/` - Motorcycle details
- `GET /api/bikes/stats/` - Database statistics

### Tunes
- `GET /api/tunes/categories/` - Tune categories
- `GET /api/tunes/types/` - Tune types
- `GET /api/tunes/tunes/` - List tunes with filters
- `GET /api/tunes/tunes/{id}/` - Tune details
- `GET /api/tunes/creators/` - Tune creators

## 🚀 Next-Generation Features (Roadmap)

1. **Live Telemetry Dashboard** - Real-time performance monitoring
2. **Parts Marketplace** - Integrated parts and services
3. **Gamification** - Achievements and leaderboards
4. **Social Features** - Community sharing and messaging
5. **AI Recommendations** - Smart tune suggestions
6. **Hardware Integration** - OBD2 and professional ECU tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

See the main project LICENSE file for details. 