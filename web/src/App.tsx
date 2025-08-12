/**
 * Main App Component - World-class routing that mirrors mobile navigation
 * Perfect parity with mobile app structure and authentication flow
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import all pages with proper structure
import * as Pages from './pages';
import './App.css';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Loading Component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-white/70">Loading RevSync...</p>
    </div>
  </div>
);

// Navigation wrapper with world-class web navigation
const MainNavigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Top Navigation Bar (Web equivalent of mobile bottom tabs) */}
      <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">RevSync</h1>
            </div>
            
            {/* Navigation Links (Web equivalent of mobile tabs) */}
            <div className="hidden md:flex space-x-8">
              <a href="/dashboard" className="text-white/70 hover:text-white transition-colors">Dashboard</a>
              <a href="/dashboard/ai-tunes" className="text-white/70 hover:text-white transition-colors">AI Tunes</a>
              <a href="/marketplace" className="text-white/70 hover:text-white transition-colors">Marketplace</a>
              <a href="/garage" className="text-white/70 hover:text-white transition-colors">Garage</a>
              <a href="/community" className="text-white/70 hover:text-white transition-colors">Community</a>
              <a href="/profile" className="text-white/70 hover:text-white transition-colors">Profile</a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-white/70 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
};

// Route Guards and Navigation Logic (mirrors mobile App.tsx structure)
const AppNavigator: React.FC = () => {
  const { auth } = useAuth();
  
  // Show loading screen while auth is initializing (same as mobile)
  if (auth.isLoading || !auth.isInitialized) {
    return <LoadingScreen />;
  }

  // User is not authenticated - show auth flow (same as mobile)
  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth/welcome" element={<Pages.WelcomePage />} />
        <Route path="/auth/login" element={<Pages.LoginPage />} />
        <Route path="/auth/register" element={<Pages.RegisterPage />} />
        <Route path="/auth/forgot-password" element={<Pages.ForgotPasswordPage />} />
        <Route path="/legal/*" element={<Pages.LegalDocumentsPage />} />
        <Route path="*" element={<Navigate to="/auth/welcome" replace />} />
      </Routes>
    );
  }

  // User is authenticated but hasn't completed onboarding (same as mobile)
  if (!auth.user?.onboardingCompleted) {
    return (
      <Routes>
        <Route path="/onboarding/welcome" element={<Pages.WelcomeOnboardingPage />} />
        <Route path="/onboarding" element={<Pages.OnboardingPage />} />
        <Route path="/onboarding/safety-disclaimer" element={<Pages.SafetyDisclaimerPage />} />
        <Route path="/onboarding/privacy-preferences" element={<Pages.PrivacyPreferencesPage />} />
        <Route path="*" element={<Navigate to="/onboarding/welcome" replace />} />
      </Routes>
    );
  }

  // User is authenticated and has completed onboarding - show main app (same as mobile)
  return (
    <MainNavigation>
      <Routes>
        {/* Dashboard Routes (mirrors mobile BottomTabNavigator) */}
        <Route path="/dashboard" element={<Pages.DashboardHomePage />} />
        <Route path="/dashboard/ai-tunes" element={<Pages.AITunesPage />} />
        <Route path="/dashboard/connected-ride" element={<Pages.ConnectedRidePage />} />
        
        {/* Main Navigation Pages (equivalent to mobile tabs) */}
        <Route path="/marketplace" element={<Pages.MarketplacePage />} />
        <Route path="/garage" element={<Pages.GaragePage />} />
        <Route path="/community" element={<Pages.CommunityPage />} />
        <Route path="/profile" element={<Pages.DashboardProfilePage />} />
        
        {/* Extended Routes (same as mobile stack navigation) */}
        <Route path="/garage/add" element={<Pages.AddBikePage />} />
        <Route path="/garage/:bikeId" element={<Pages.BikeDetailPage />} />
        <Route path="/marketplace/tune/:tuneId" element={<Pages.TuneDetailPage />} />
        <Route path="/marketplace/library" element={<Pages.TuneLibraryPage />} />
        <Route path="/marketplace/compare" element={<Pages.TuneComparePage />} />
        <Route path="/marketplace/upload" element={<Pages.UploadTunePage />} />
        <Route path="/marketplace/creator/:creatorId" element={<Pages.CreatorProfilePage />} />
        <Route path="/flashing/safe-flash/:motorcycleId" element={<Pages.SafeFlashPage />} />
        <Route path="/community/upload" element={<Pages.UploadTunePage />} />
        
        {/* Settings Routes */}
        <Route path="/settings" element={<Pages.SettingsPage />} />
        <Route path="/settings/profile" element={<Pages.EditProfilePage />} />
        <Route path="/settings/security" element={<Pages.SecuritySettingsPage />} />
        <Route path="/settings/privacy" element={<Pages.PrivacySettingsPage />} />
        <Route path="/settings/payments" element={<Pages.PaymentMethodsPage />} />
        
        {/* User Routes */}
        <Route path="/user/purchase-history" element={<Pages.PurchaseHistoryPage />} />
        <Route path="/user/flash-history" element={<Pages.FlashHistoryPage />} />
        <Route path="/user/creator-application" element={<Pages.CreatorApplicationPage />} />
        
        {/* Legal & Support */}
        <Route path="/legal/*" element={<Pages.LegalDocumentsPage />} />
        <Route path="/support" element={<Pages.SupportPage />} />
        <Route path="/about" element={<Pages.AboutPage />} />
        
        {/* Search & Analytics */}
        <Route path="/search" element={<Pages.SearchResultsPage />} />
        <Route path="/search/advanced" element={<Pages.AdvancedSearchPage />} />
        <Route path="/search/recommendations" element={<Pages.RecommendationsPage />} />
        <Route path="/analytics" element={<Pages.AnalyticsPage />} />
        <Route path="/analytics/reports" element={<Pages.ReportsPage />} />
        <Route path="/analytics/trending" element={<Pages.TrendingPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Pages.AdminDashboardPage />} />
        <Route path="/admin/dashboard" element={<Pages.AdminDashboardPage />} />
        <Route path="/admin/tune-moderation" element={<Pages.TuneModerationPage />} />
        <Route path="/admin/user-management" element={<Pages.UserManagementPage />} />
        <Route path="/admin/analytics" element={<Pages.AnalyticsAdminPage />} />
        
        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainNavigation>
  );
};

// Main App component with proper providers
const App: React.FC = () => {
  useEffect(() => {
    // Set CSS custom properties for consistent theming
    document.documentElement.style.setProperty('--rs-bg', '#0b0b0c');
    document.documentElement.style.setProperty('--rs-fg', '#e8e8ea');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppNavigator />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;