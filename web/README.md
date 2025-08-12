# RevSync Web Frontend

A React TypeScript web frontend for the RevSync motorcycle tuning platform, sharing authentication and API infrastructure with the mobile app.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Running RevSync backend on port 8000
- Supabase project configured (shared with mobile)

### Installation & Setup

1. **Navigate to web directory**
   ```bash
   cd web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start development server**
   ```bash
   npm start
   ```

The web app will open at `http://localhost:3000`

## 🏗️ Architecture

### Tech Stack
- **React 19** with TypeScript
- **React Router** for navigation
- **TanStack React Query** for API state management
- **Zustand** for local state management
- **Axios** for HTTP requests
- **Supabase** for authentication
- **Tailwind CSS** for styling

### Authentication Flow
1. **Supabase Auth** - Primary authentication layer
2. **Token Exchange** - Convert Supabase tokens to Django REST Framework tokens
3. **API Authorization** - Use DRF tokens for all backend requests

This matches the mobile app's auth architecture exactly.

### Folder Structure
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── community/      # Community features
│   ├── dashboard/      # Dashboard pages
│   ├── garage/         # Motorcycle management
│   ├── marketplace/    # Tune marketplace
│   └── profile/        # User profile
├── services/           # API and external services
│   ├── apiClient.ts    # Main API client
│   └── supabaseClient.ts # Supabase configuration
├── store/              # Global state management
├── styles/             # Global styles and themes
├── types/              # TypeScript type definitions
│   └── auth.ts         # Authentication types
└── utils/              # Utility functions
```

## 🔧 Development

### Running with Backend
Ensure all three services are running:

1. **Backend (Django)**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver 8000
   ```

2. **Mobile (Expo)** - Optional
   ```bash
   cd mobile
   npm start -- --port 8082
   ```

3. **Web (React)**
   ```bash
   cd web
   npm start
   ```

### Environment Configuration

The web frontend shares configuration with mobile where possible:

| Variable | Purpose | Shared with Mobile |
|----------|---------|-------------------|
| `REACT_APP_API_URL` | Backend API endpoint | ✅ |
| `REACT_APP_SUPABASE_URL` | Supabase project URL | ✅ |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `REACT_APP_AUTH_REDIRECT_URL` | OAuth redirect URL | ❌ (web-specific) |

### API Integration

The web app uses the same backend APIs as mobile:

- **Authentication**: `/api/auth/`
- **Motorcycles**: `/api/motorcycles/`
- **Tunes**: `/api/tunes/`
- **Community**: `/api/community/`
- **AI Services**: `/api/ai/`
- **Safety**: `/api/safety/`

### Authentication State

The `AuthContext` provides:
- User authentication status
- Profile data
- Session management
- Token refresh
- Error handling

Usage:
```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { isLoggedIn, user, login, logout } = useAuth();
  
  if (!isLoggedIn) {
    return <LoginForm onLogin={login} />;
  }
  
  return <Dashboard user={user} onLogout={logout} />;
}
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### E2E Testing
```bash
npm run test:e2e
```

## 📦 Building

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build
```

## 🔒 Security

### Authentication
- Supabase handles secure authentication
- JWTs are stored securely
- Automatic token refresh
- CSRF protection enabled

### API Security
- All requests include authentication headers
- CORS configured for web domain
- Request/response interceptors for error handling

### Environment Variables
- Sensitive keys stored in environment variables
- No secrets committed to repository
- Different configs for dev/staging/production

## 🚧 Current Status

### ✅ Implemented
- [x] Basic React TypeScript setup
- [x] Authentication system (Supabase + DRF)
- [x] API client with interceptors
- [x] Environment configuration
- [x] Basic UI structure
- [x] CORS configuration

### 🚧 In Progress
- [ ] Page-specific UI components
- [ ] Motorcycle management interface
- [ ] Tune library and marketplace
- [ ] Community features
- [ ] AI recommendations integration

### 📋 Planned
- [ ] OpenAPI type generation
- [ ] Advanced state management
- [ ] Real-time features
- [ ] Progressive Web App features
- [ ] Advanced testing suite

## 🤝 Integration with Mobile

The web frontend is designed to share:
- Authentication system
- API endpoints
- Data models
- Business logic
- Environment configuration

This ensures consistency across platforms and reduces maintenance overhead.

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query](https://tanstack.com/query)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS settings include `http://localhost:3000`
   - Check network tab for actual request URLs

2. **Authentication Failures**
   - Verify Supabase configuration in `.env.local`
   - Check backend `/api/auth/supabase-exchange/` endpoint

3. **API Connection Issues**
   - Ensure backend is running on port 8000
   - Check `REACT_APP_API_URL` in environment

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check TypeScript errors: `npm run type-check`

### Support
- Check backend logs for API errors
- Use browser dev tools for frontend debugging
- Review network requests in dev tools