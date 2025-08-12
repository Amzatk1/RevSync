import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivacyPreferences {
  shareUsageData: boolean;
  personalizedAds: boolean;
  partnerLocationAccess: boolean;
  marketingEmails: boolean;
  showInLeaderboards: boolean;
  anonymousAnalytics: boolean;
  performanceData: boolean;
  socialFeatures: boolean;
}

const PrivacyPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    shareUsageData: true,  // Match mobile default
    personalizedAds: false, // Match mobile default
    partnerLocationAccess: false, // Match mobile default
    marketingEmails: false,
    showInLeaderboards: true,
    anonymousAnalytics: true,
    performanceData: false,
    socialFeatures: true,
  });

  // Auth guards - only show for new users
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) navigate('/auth/login');
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  useEffect(() => {
    if (!auth.isLoading && auth.user?.onboardingCompleted) navigate('/dashboard');
  }, [auth.isLoading, auth.user?.onboardingCompleted, navigate]);

  const updatePreference = (key: keyof PrivacyPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAndContinue = () => {
    // Persist preferences locally (matching mobile approach)
    try {
      localStorage.setItem('onboarding_privacy_preferences', JSON.stringify(preferences));
      localStorage.setItem('privacy_preferences_version', '2025.2');
      localStorage.setItem('privacy_preferences_date', new Date().toISOString());
    } catch (error) {
      console.log('Error saving privacy preferences:', error);
    }
    
    navigate('/onboarding');
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900">Privacy Preferences</h1>
            <p className="text-gray-600 mt-2">
              Manage how we use your data. You can change these settings anytime in your account.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Essential Data */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📊 Essential Data & Analytics
            </h2>
            <div className="space-y-4">
              <PrivacyToggle
                label="Share Usage Data"
                description="Help improve RevSync recommendations with anonymous usage patterns and performance metrics."
                checked={preferences.shareUsageData}
                onChange={(checked) => updatePreference('shareUsageData', checked)}
              />
              
              <PrivacyToggle
                label="Anonymous Analytics"
                description="Allow collection of anonymous data to improve app performance and features."
                checked={preferences.anonymousAnalytics}
                onChange={(checked) => updatePreference('anonymousAnalytics', checked)}
              />
              
              <PrivacyToggle
                label="Performance Data"
                description="Share anonymized performance and tuning data to improve AI recommendations."
                checked={preferences.performanceData}
                onChange={(checked) => updatePreference('performanceData', checked)}
              />
            </div>
          </div>

          {/* Marketing & Communications */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📧 Marketing & Communications
            </h2>
            <div className="space-y-4">
              <PrivacyToggle
                label="Marketing Emails"
                description="Receive occasional emails about new features, updates, and tuning tips."
                checked={preferences.marketingEmails}
                onChange={(checked) => updatePreference('marketingEmails', checked)}
              />
              
              <PrivacyToggle
                label="Personalized Ads"
                description="Show ads tailored to your interests and motorcycle preferences."
                checked={preferences.personalizedAds}
                onChange={(checked) => updatePreference('personalizedAds', checked)}
              />
            </div>
          </div>

          {/* Social & Community */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              👥 Social & Community Features
            </h2>
            <div className="space-y-4">
              <PrivacyToggle
                label="Show in Leaderboards"
                description="Appear in community statistics and leaderboards using your display name."
                checked={preferences.showInLeaderboards}
                onChange={(checked) => updatePreference('showInLeaderboards', checked)}
              />
              
              <PrivacyToggle
                label="Social Features"
                description="Enable social features like sharing tunes and following other riders."
                checked={preferences.socialFeatures}
                onChange={(checked) => updatePreference('socialFeatures', checked)}
              />
            </div>
          </div>

          {/* Location & Partners */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📍 Location & Partner Access
            </h2>
            <div className="space-y-4">
              <PrivacyToggle
                label="Partner Location Access"
                description="Allow trusted partners to access location data for local service recommendations."
                checked={preferences.partnerLocationAccess}
                onChange={(checked) => updatePreference('partnerLocationAccess', checked)}
              />
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-600 text-xl mr-3">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Your Privacy Matters</p>
              <p>
                We're committed to protecting your privacy. Your data is encrypted, never sold to third parties, 
                and you maintain full control over these settings. Read our{' '}
                <button className="underline hover:no-underline">Privacy Policy</button> for details.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/onboarding/welcome')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          
          <button
            onClick={handleSaveAndContinue}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Save Preferences & Continue →
          </button>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          You can modify these preferences anytime in Settings → Privacy
        </div>
      </div>
    </div>
  );
};

// Reusable Privacy Toggle Component
interface PrivacyToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1 pr-4">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-600 mt-1">{description}</div>
      </div>
      <div className="flex-shrink-0">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className={`w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-blue-600' : 'bg-gray-200'
          }`}>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
        </label>
      </div>
    </div>
  );
};

export default PrivacyPreferencesPage;
