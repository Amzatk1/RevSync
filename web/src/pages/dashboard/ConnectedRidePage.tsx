import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Connected Ride - Real-time motorcycle connection and ride tracking
// World-class responsive design for web platform

interface ConnectionStatus {
  isConnected: boolean;
  lastSeen?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

interface RideData {
  speed: number;
  rpm: number;
  engineTemp: number;
  fuelLevel: number;
  gear: number;
  mileage: number;
}

const ConnectedRidePage: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
  });
  const [rideData, setRideData] = useState<RideData>({
    speed: 0,
    rpm: 0,
    engineTemp: 0,
    fuelLevel: 85,
    gear: 1,
    mileage: 15432,
  });

  useEffect(() => {
    document.title = 'Connected Ride • RevSync';
  }, []);

  // Simulated connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(prev => ({
        ...prev,
        lastSeen: new Date().toISOString(),
        batteryLevel: Math.max(20, Math.min(100, (prev.batteryLevel || 85) + (Math.random() - 0.5) * 2)),
        signalStrength: Math.max(1, Math.min(5, Math.floor(Math.random() * 5) + 1)),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getSignalIcon = (strength?: number) => {
    if (!strength) return '📶';
    if (strength >= 4) return '📶';
    if (strength >= 3) return '📶';
    if (strength >= 2) return '📶';
    return '📶';
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 60) return 'text-green-400';
    if (level > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">Connected Ride</h1>
          <p className="ml-2 hidden sm:block text-sm text-white/70">Real-time motorcycle telemetry and control</p>
          <div className="ml-auto flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-white/70">
                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-xs text-white/60">
              <Link className="hover:underline" to="/garage">Garage</Link>
              <span aria-hidden className="mx-1">•</span>
              <Link className="hover:underline" to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {!connectionStatus.isConnected ? (
          /* Connection Setup */
          <section className="max-w-2xl mx-auto text-center py-16">
            <div className="text-6xl mb-6">🔗</div>
            <h2 className="text-2xl font-bold text-white/90 mb-4">Connect Your Motorcycle</h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Experience real-time telemetry, remote diagnostics, and enhanced safety features. 
              Connect your motorcycle to unlock the full potential of RevSync.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left">
                <div className="text-2xl mb-3">📊</div>
                <h3 className="font-semibold text-white/90 mb-2">Real-time Data</h3>
                <p className="text-sm text-white/60">Monitor speed, RPM, engine temperature, fuel level, and more in real-time.</p>
              </div>
              
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left">
                <div className="text-2xl mb-3">🛡️</div>
                <h3 className="font-semibold text-white/90 mb-2">Safety Features</h3>
                <p className="text-sm text-white/60">Get instant alerts for maintenance issues and safety notifications.</p>
              </div>
              
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left">
                <div className="text-2xl mb-3">📱</div>
                <h3 className="font-semibold text-white/90 mb-2">Remote Control</h3>
                <p className="text-sm text-white/60">Start, stop, and configure your motorcycle settings remotely.</p>
              </div>
              
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left">
                <div className="text-2xl mb-3">📈</div>
                <h3 className="font-semibold text-white/90 mb-2">Performance Tracking</h3>
                <p className="text-sm text-white/60">Analyze ride data and optimize your motorcycle's performance.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setConnectionStatus({ isConnected: true, batteryLevel: 85, signalStrength: 4 })}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Connect Motorcycle
              </button>
              <Link 
                to="/garage"
                className="px-8 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors font-semibold text-center"
              >
                Manage Garage
              </Link>
            </div>
          </section>
        ) : (
          /* Connected Dashboard */
          <div className="space-y-8">
            {/* Connection Info */}
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white/90">Connection Status</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/60">Signal:</span>
                    <span className="text-sm text-white/90">{getSignalIcon(connectionStatus.signalStrength)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/60">Battery:</span>
                    <span className={`text-sm font-medium ${getBatteryColor(connectionStatus.batteryLevel)}`}>
                      {connectionStatus.batteryLevel}%
                    </span>
                  </div>
                  <button 
                    onClick={() => setConnectionStatus({ isConnected: false })}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{rideData.speed}</div>
                  <div className="text-xs text-white/60">km/h</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{rideData.rpm}</div>
                  <div className="text-xs text-white/60">RPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{rideData.engineTemp}°</div>
                  <div className="text-xs text-white/60">Engine</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{rideData.fuelLevel}%</div>
                  <div className="text-xs text-white/60">Fuel</div>
                </div>
              </div>
            </section>

            {/* Quick Controls */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold text-white/90 mb-4">Quick Controls</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    🔒 Lock Motorcycle
                  </button>
                  <button className="w-full px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm">
                    🚨 Find My Bike
                  </button>
                  <button className="w-full px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm">
                    🔧 Diagnostics
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold text-white/90 mb-4">Ride Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Current Gear:</span>
                    <span className="text-white/90">{rideData.gear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Mileage:</span>
                    <span className="text-white/90">{rideData.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Avg Speed:</span>
                    <span className="text-white/90">45 km/h</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold text-white/90 mb-4">Alerts</h3>
                <div className="space-y-3">
                  <div className="text-xs text-green-400">✅ All systems normal</div>
                  <div className="text-xs text-yellow-400">⚠️ Service due in 500km</div>
                  <div className="text-xs text-white/60">🔧 Last check: 2 days ago</div>
                </div>
              </div>
            </section>

            {/* Feature Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/dashboard/ai-tunes" className="group">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-all group-hover:border-white/20">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="font-semibold text-white/90 mb-2">AI Tune Optimization</h3>
                  <p className="text-sm text-white/60">Get real-time tune adjustments based on your riding data.</p>
                </div>
              </Link>

              <Link to="/marketplace" className="group">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-all group-hover:border-white/20">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-white/90 mb-2">Performance Analytics</h3>
                  <p className="text-sm text-white/60">Analyze your ride data and discover performance insights.</p>
                </div>
              </Link>

              <Link to="/community" className="group">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-all group-hover:border-white/20">
                  <div className="text-3xl mb-3">🌐</div>
                  <h3 className="font-semibold text-white/90 mb-2">Share with Community</h3>
                  <p className="text-sm text-white/60">Share your ride data and compare with other riders.</p>
                </div>
              </Link>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConnectedRidePage;
