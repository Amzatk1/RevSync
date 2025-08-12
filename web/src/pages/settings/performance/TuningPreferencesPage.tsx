import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Tuning Preferences Page - World-class performance and safety preferences
interface TuningPreferences {
  // Performance Settings
  performanceLevel: 'conservative' | 'balanced' | 'aggressive' | 'custom';
  safetyTolerance: 'maximum' | 'high' | 'standard' | 'custom';
  
  // Custom Performance Settings
  customPerformance: {
    powerGainTarget: number; // Percentage increase
    torqueGainTarget: number; // Percentage increase
    fuelEconomyPriority: number; // 1-5 scale
    responseOptimization: number; // 1-5 scale
    temperatureThreshold: number; // °C
  };
  
  // Custom Safety Settings
  customSafety: {
    maxAfrDeviation: number; // Air-fuel ratio deviation %
    maxIgnitionAdvance: number; // Degrees
    maxBoostPressure: number; // PSI or bar
    temperatureLimit: number; // °C
    knockSensitivity: number; // 1-5 scale
  };
  
  // AI Preferences
  aiRecommendations: boolean;
  aiLearningMode: 'aggressive' | 'balanced' | 'conservative';
  personalizedTuning: boolean;
  adaptiveTuning: boolean;
  
  // Compatibility & Warnings
  warnOnIncompatible: boolean;
  autoCheckCompatibility: boolean;
  showPerformanceImpact: boolean;
  requireConfirmation: boolean;
  
  // Data Collection
  sharePerformanceData: boolean;
  allowTelemetry: boolean;
  anonymousAnalytics: boolean;
  
  // Advanced Settings
  expertMode: boolean;
  showAdvancedMetrics: boolean;
  logDetailLevel: 'basic' | 'detailed' | 'verbose';
  backupBeforeTune: boolean;
}

// Auth hook
const useAuthHeaders = () => {
  try {
    const { useAuth } = require('../../../contexts/AuthContext');
    const { auth } = useAuth?.() ?? {};
    return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
  } catch {
    return {};
  }
};

// Tuning preferences hook
const useTuningPreferences = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['user', 'tuning_preferences'],
    queryFn: async (): Promise<TuningPreferences> => {
      // Mock tuning preferences (replace with real API)
      return {
        performanceLevel: 'balanced',
        safetyTolerance: 'high',
        customPerformance: {
          powerGainTarget: 15,
          torqueGainTarget: 12,
          fuelEconomyPriority: 3,
          responseOptimization: 4,
          temperatureThreshold: 85,
        },
        customSafety: {
          maxAfrDeviation: 5,
          maxIgnitionAdvance: 20,
          maxBoostPressure: 15,
          temperatureLimit: 90,
          knockSensitivity: 3,
        },
        aiRecommendations: true,
        aiLearningMode: 'balanced',
        personalizedTuning: true,
        adaptiveTuning: false,
        warnOnIncompatible: true,
        autoCheckCompatibility: true,
        showPerformanceImpact: true,
        requireConfirmation: true,
        sharePerformanceData: true,
        allowTelemetry: true,
        anonymousAnalytics: true,
        expertMode: false,
        showAdvancedMetrics: false,
        logDetailLevel: 'detailed',
        backupBeforeTune: true,
      };
    },
    staleTime: 300_000, // 5 minutes
    enabled: !!authHeaders.Authorization,
  });
};

const TuningPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const preferences = useTuningPreferences();
  
  const [formData, setFormData] = useState<Partial<TuningPreferences>>({});
  const [activeTab, setActiveTab] = useState<'performance' | 'safety' | 'ai' | 'advanced'>('performance');

  useEffect(() => {
    document.title = 'Tuning Preferences • Settings • RevSync';
  }, []);

  useEffect(() => {
    if (preferences.data) {
      setFormData(preferences.data);
    }
  }, [preferences.data]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<TuningPreferences>) => {
      // Mock API call to update preferences
      console.log('Updating tuning preferences:', data);
      return data;
    },
    onSuccess: () => {
      // Show success toast
    },
  });

  const handleInputChange = (field: keyof TuningPreferences, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parent: 'customPerformance' | 'customSafety', field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (formData) {
      updatePreferencesMutation.mutate(formData);
    }
  };

  const getPerformanceLevelDescription = (level: string) => {
    switch (level) {
      case 'conservative': return 'Prioritizes reliability and longevity over maximum power';
      case 'balanced': return 'Optimal balance between performance and safety';
      case 'aggressive': return 'Maximum performance with calculated risks';
      case 'custom': return 'Custom settings tailored to your specific needs';
      default: return '';
    }
  };

  const getSafetyToleranceDescription = (level: string) => {
    switch (level) {
      case 'maximum': return 'Strictest safety limits with conservative margins';
      case 'high': return 'High safety standards with proven limits';
      case 'standard': return 'Standard safety margins for experienced users';
      case 'custom': return 'Custom safety parameters for expert users';
      default: return '';
    }
  };

  if (!preferences.data) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading tuning preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white/90">Tuning Preferences</h1>
                <p className="text-sm text-white/60">Configure your performance and safety preferences</p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              {[
                { id: 'performance', label: 'Performance', icon: '⚡' },
                { id: 'safety', label: 'Safety', icon: '🛡️' },
                { id: 'ai', label: 'AI & Learning', icon: '🤖' },
                { id: 'advanced', label: 'Advanced', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/30'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Level */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Performance Level</h2>
              
              <div className="space-y-4">
                {[
                  { value: 'conservative', label: 'Conservative', icon: '🐌', color: 'green' },
                  { value: 'balanced', label: 'Balanced', icon: '⚖️', color: 'blue' },
                  { value: 'aggressive', label: 'Aggressive', icon: '🚀', color: 'red' },
                  { value: 'custom', label: 'Custom', icon: '🔧', color: 'purple' },
                ].map((level) => (
                  <label key={level.value} className="flex items-center p-4 bg-white/[0.03] rounded-xl border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors">
                    <input
                      type="radio"
                      name="performanceLevel"
                      value={level.value}
                      checked={formData.performanceLevel === level.value}
                      onChange={(e) => handleInputChange('performanceLevel', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.performanceLevel === level.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-white/30'
                    }`}>
                      {formData.performanceLevel === level.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span className="text-2xl mr-3">{level.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white/90">{level.label}</div>
                      <div className="text-sm text-white/60">{getPerformanceLevelDescription(level.value)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Performance Settings */}
            {formData.performanceLevel === 'custom' && (
              <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white/90 mb-6">Custom Performance Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Power Gain Target: {formData.customPerformance?.powerGainTarget}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={formData.customPerformance?.powerGainTarget || 15}
                      onChange={(e) => handleNestedInputChange('customPerformance', 'powerGainTarget', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Torque Gain Target: {formData.customPerformance?.torqueGainTarget}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={formData.customPerformance?.torqueGainTarget || 12}
                      onChange={(e) => handleNestedInputChange('customPerformance', 'torqueGainTarget', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Fuel Economy Priority (1-5): {formData.customPerformance?.fuelEconomyPriority}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.customPerformance?.fuelEconomyPriority || 3}
                      onChange={(e) => handleNestedInputChange('customPerformance', 'fuelEconomyPriority', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Response Optimization (1-5): {formData.customPerformance?.responseOptimization}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.customPerformance?.responseOptimization || 4}
                      onChange={(e) => handleNestedInputChange('customPerformance', 'responseOptimization', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-6">
            {/* Safety Tolerance */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Safety Tolerance</h2>
              
              <div className="space-y-4">
                {[
                  { value: 'maximum', label: 'Maximum Safety', icon: '🛡️', color: 'green' },
                  { value: 'high', label: 'High Safety', icon: '✅', color: 'blue' },
                  { value: 'standard', label: 'Standard Safety', icon: '⚠️', color: 'yellow' },
                  { value: 'custom', label: 'Custom Safety', icon: '🔧', color: 'purple' },
                ].map((level) => (
                  <label key={level.value} className="flex items-center p-4 bg-white/[0.03] rounded-xl border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors">
                    <input
                      type="radio"
                      name="safetyTolerance"
                      value={level.value}
                      checked={formData.safetyTolerance === level.value}
                      onChange={(e) => handleInputChange('safetyTolerance', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.safetyTolerance === level.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-white/30'
                    }`}>
                      {formData.safetyTolerance === level.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span className="text-2xl mr-3">{level.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white/90">{level.label}</div>
                      <div className="text-sm text-white/60">{getSafetyToleranceDescription(level.value)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Warning Settings */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Safety Warnings</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'warnOnIncompatible', label: 'Warn on Incompatible Tunes', description: 'Show warnings when selecting tunes not optimized for your motorcycle' },
                  { key: 'autoCheckCompatibility', label: 'Auto-Check Compatibility', description: 'Automatically verify tune compatibility before installation' },
                  { key: 'showPerformanceImpact', label: 'Show Performance Impact', description: 'Display estimated performance changes before applying tunes' },
                  { key: 'requireConfirmation', label: 'Require Confirmation', description: 'Require manual confirmation for all tune installations' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                    <div>
                      <div className="font-medium text-white/90">{setting.label}</div>
                      <div className="text-sm text-white/60 mt-1">{setting.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[setting.key as keyof TuningPreferences] as boolean || false}
                        onChange={(e) => handleInputChange(setting.key as keyof TuningPreferences, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">AI-Powered Features</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'aiRecommendations', label: 'AI Tune Recommendations', description: 'Get personalized tune suggestions based on your riding style and preferences' },
                  { key: 'personalizedTuning', label: 'Personalized Tuning', description: 'Allow AI to learn from your preferences and riding patterns' },
                  { key: 'adaptiveTuning', label: 'Adaptive Tuning', description: 'Automatically adjust tune parameters based on real-time performance data' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🤖</span>
                      <div>
                        <div className="font-medium text-white/90">{setting.label}</div>
                        <div className="text-sm text-white/60 mt-1">{setting.description}</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[setting.key as keyof TuningPreferences] as boolean || false}
                        onChange={(e) => handleInputChange(setting.key as keyof TuningPreferences, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Learning Mode */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">AI Learning Mode</h2>
              
              <div className="space-y-4">
                {[
                  { value: 'conservative', label: 'Conservative Learning', description: 'AI learns slowly with proven, safe recommendations' },
                  { value: 'balanced', label: 'Balanced Learning', description: 'Optimal balance between innovation and safety' },
                  { value: 'aggressive', label: 'Aggressive Learning', description: 'AI explores new possibilities more quickly' },
                ].map((mode) => (
                  <label key={mode.value} className="flex items-center p-4 bg-white/[0.03] rounded-xl border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors">
                    <input
                      type="radio"
                      name="aiLearningMode"
                      value={mode.value}
                      checked={formData.aiLearningMode === mode.value}
                      onChange={(e) => handleInputChange('aiLearningMode', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.aiLearningMode === mode.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-white/30'
                    }`}>
                      {formData.aiLearningMode === mode.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white/90">{mode.label}</div>
                      <div className="text-sm text-white/60">{mode.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Expert Settings */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Expert Settings</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'expertMode', label: 'Expert Mode', description: 'Enable advanced tuning options and detailed technical information' },
                  { key: 'showAdvancedMetrics', label: 'Show Advanced Metrics', description: 'Display detailed performance metrics and diagnostic data' },
                  { key: 'backupBeforeTune', label: 'Backup Before Tune', description: 'Automatically create backups before applying any tune modifications' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚙️</span>
                      <div>
                        <div className="font-medium text-white/90">{setting.label}</div>
                        <div className="text-sm text-white/60 mt-1">{setting.description}</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[setting.key as keyof TuningPreferences] as boolean || false}
                        onChange={(e) => handleInputChange(setting.key as keyof TuningPreferences, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Data & Privacy</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'sharePerformanceData', label: 'Share Performance Data', description: 'Help improve RevSync by sharing anonymous performance data' },
                  { key: 'allowTelemetry', label: 'Allow Telemetry', description: 'Send usage data to help improve app performance and features' },
                  { key: 'anonymousAnalytics', label: 'Anonymous Analytics', description: 'Contribute to research with anonymized usage patterns' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <div className="font-medium text-white/90">{setting.label}</div>
                        <div className="text-sm text-white/60 mt-1">{setting.description}</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[setting.key as keyof TuningPreferences] as boolean || false}
                        onChange={(e) => handleInputChange(setting.key as keyof TuningPreferences, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Logging Level */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Logging Level</h2>
              
              <div className="space-y-4">
                {[
                  { value: 'basic', label: 'Basic Logging', description: 'Essential information only' },
                  { value: 'detailed', label: 'Detailed Logging', description: 'Comprehensive logging for troubleshooting' },
                  { value: 'verbose', label: 'Verbose Logging', description: 'Maximum detail for development and debugging' },
                ].map((level) => (
                  <label key={level.value} className="flex items-center p-4 bg-white/[0.03] rounded-xl border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors">
                    <input
                      type="radio"
                      name="logDetailLevel"
                      value={level.value}
                      checked={formData.logDetailLevel === level.value}
                      onChange={(e) => handleInputChange('logDetailLevel', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.logDetailLevel === level.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-white/30'
                    }`}>
                      {formData.logDetailLevel === level.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white/90">{level.label}</div>
                      <div className="text-sm text-white/60">{level.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TuningPreferencesPage;
