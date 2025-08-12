import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Security Settings Page - Comprehensive security controls
interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricAuthEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  trustedDevices: TrustedDevice[];
  loginHistory: LoginAttempt[];
  connectedServices: ConnectedService[];
}

interface TrustedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  lastUsed: string;
  isCurrentDevice: boolean;
}

interface LoginAttempt {
  id: string;
  timestamp: string;
  location: string;
  device: string;
  success: boolean;
  ipAddress: string;
}

interface ConnectedService {
  id: string;
  name: string;
  type: 'oauth' | 'api';
  permissions: string[];
  connectedAt: string;
  lastUsed: string;
}

const SecuritySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'devices' | 'activity' | 'services'>('overview');

  useEffect(() => {
    document.title = 'Security Settings • RevSync';
  }, []);

  // Mock security data
  const mockSecurityData: SecuritySettings = {
    twoFactorEnabled: true,
    biometricAuthEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30,
    trustedDevices: [
      {
        id: '1',
        name: 'MacBook Pro',
        type: 'desktop',
        browser: 'Chrome',
        location: 'San Francisco, CA',
        lastUsed: '2024-02-15T14:30:00Z',
        isCurrentDevice: true,
      },
    ],
    loginHistory: [
      {
        id: '1',
        timestamp: '2024-02-15T14:30:00Z',
        location: 'San Francisco, CA',
        device: 'Chrome on macOS',
        success: true,
        ipAddress: '192.168.1.100',
      },
    ],
    connectedServices: [
      {
        id: '1',
        name: 'GitHub',
        type: 'oauth',
        permissions: ['Read profile', 'Access repositories'],
        connectedAt: '2024-01-15T10:00:00Z',
        lastUsed: '2024-02-10T12:00:00Z',
      },
    ],
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return '💻';
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      default: return '💻';
    }
  };

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
                <h1 className="text-2xl font-bold text-white/90">Security Settings</h1>
                <p className="text-sm text-white/60">Manage your account security and privacy</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'devices', label: 'Trusted Devices' },
                { id: 'activity', label: 'Login Activity' },
                { id: 'services', label: 'Connected Services' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Security Status */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Security Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <h3 className="font-medium text-green-400">Account Secured</h3>
                      <p className="text-sm text-green-300/80">Your account is well protected</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h3 className="font-medium text-yellow-400">Biometric Auth Disabled</h3>
                      <p className="text-sm text-yellow-300/80">Enable for enhanced security</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔐</span>
                    <div>
                      <div className="font-medium text-white/90">Two-Factor Authentication</div>
                      <div className="text-sm text-white/60 mt-1">
                        Extra layer of security for your account
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-sm">✓ Enabled</span>
                    <Link
                      to="/settings/security/two-factor"
                      className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                    >
                      Manage
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👆</span>
                    <div>
                      <div className="font-medium text-white/90">Biometric Authentication</div>
                      <div className="text-sm text-white/60 mt-1">
                        Use fingerprint or face recognition
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 text-sm">Disabled</span>
                    <Link
                      to="/settings/security/biometric"
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Enable
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔔</span>
                    <div>
                      <div className="font-medium text-white/90">Login Notifications</div>
                      <div className="text-sm text-white/60 mt-1">
                        Get notified of new login attempts
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mockSecurityData.loginNotifications}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <div className="font-medium text-white/90">Password</div>
                      <div className="text-sm text-white/60 mt-1">
                        Last changed 45 days ago
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'devices' && (
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Trusted Devices</h2>
            
            <div className="space-y-4">
              {mockSecurityData.trustedDevices.map((device) => (
                <div key={device.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                      <div>
                        <div className="font-medium text-white/90 flex items-center gap-2">
                          {device.name}
                          {device.isCurrentDevice && (
                            <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-white/60">
                          {device.browser} • {device.location}
                        </div>
                        <div className="text-xs text-white/50">
                          Last used {new Date(device.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {!device.isCurrentDevice && (
                      <button className="px-3 py-1 text-red-400 hover:text-red-300 text-sm">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'activity' && (
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Recent Login Activity</h2>
            
            <div className="space-y-4">
              {mockSecurityData.loginHistory.map((login) => (
                <div key={login.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl ${login.success ? '✅' : '❌'}`}></span>
                      <div>
                        <div className="font-medium text-white/90">
                          {login.success ? 'Successful login' : 'Failed login attempt'}
                        </div>
                        <div className="text-sm text-white/60">
                          {login.device} • {login.location}
                        </div>
                        <div className="text-xs text-white/50">
                          {new Date(login.timestamp).toLocaleString()} • IP: {login.ipAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'services' && (
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Connected Services</h2>
            
            <div className="space-y-4">
              {mockSecurityData.connectedServices.map((service) => (
                <div key={service.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔗</span>
                      <div>
                        <div className="font-medium text-white/90">{service.name}</div>
                        <div className="text-sm text-white/60">
                          Connected {new Date(service.connectedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-white/50">
                          Permissions: {service.permissions.join(', ')}
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-red-400 hover:text-red-300 text-sm">
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SecuritySettingsPage;
