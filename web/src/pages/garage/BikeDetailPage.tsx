import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Bike Detail Page - Comprehensive motorcycle information with rich interactions
// Enhanced web version with detailed specs, maintenance tracking, and performance data

// ---- Types ----
interface Motorcycle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  image_url?: string;
  ecu_type: string;
  connection_protocol: string;
  last_flash_date?: string;
  current_tune: string;
  connection_status: 'connected' | 'disconnected' | 'never_connected';
  battery_level?: number;
  last_connected?: string;
  vin?: string;
  mileage_km?: number;
  created_at: string;
  updated_at: string;
  displacement_cc?: number;
  max_power_hp?: number;
  max_torque_nm?: number;
  fuel_type?: string;
  engine_type?: string;
  transmission?: string;
  abs?: boolean;
  traction_control?: boolean;
  quick_shifter?: boolean;
  launch_control?: boolean;
  wheelie_control?: boolean;
  engine_braking_control?: boolean;
  notes?: string;
  purchase_date?: string;
  purchase_price?: number;
  insurance_expiry?: string;
  service_due_km?: number;
  service_due_date?: string;
}

interface TuneHistory {
  id: string;
  tune_name: string;
  tune_id?: string;
  applied_date: string;
  status: 'success' | 'failed' | 'pending';
  performance_gain?: number;
  notes?: string;
  version?: string;
}

interface MaintenanceRecord {
  id: string;
  type: 'service' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  date: string;
  mileage_km: number;
  cost?: number;
  next_service_km?: number;
  notes?: string;
  parts_replaced?: string[];
}

interface PerformanceData {
  id: string;
  date: string;
  max_speed_kmh?: number;
  acceleration_0_100?: number;
  fuel_consumption?: number;
  power_hp?: number;
  torque_nm?: number;
  notes?: string;
}

// ---- Supabase Client ----
let supabase: SupabaseClient | null = null;
try {
  const url = (process.env.REACT_APP_SUPABASE_URL || '').trim();
  const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
  if (url && key) {
    supabase = createClient(url, key);
  }
} catch {}

// ---- Helpers ----
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const formatRelativeTime = (iso?: string) => {
  if (!iso) return 'Never';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(sec) < 60) return rtf.format(-sec, 'second');
  if (Math.abs(min) < 60) return rtf.format(-min, 'minute');
  if (Math.abs(hr) < 24) return rtf.format(-hr, 'hour');
  return rtf.format(-day, 'day');
};

const getBatteryIcon = (level?: number) => {
  if (typeof level !== 'number') return '🔋';
  if (level >= 90) return '🔋';
  if (level >= 70) return '🟩';
  if (level >= 40) return '🟨';
  if (level >= 15) return '🟧';
  return '🟥';
};

const getConnectionStatusColor = (status: string) => {
  switch (status) {
    case 'connected': return 'text-green-400';
    case 'disconnected': return 'text-yellow-400';
    case 'never_connected': return 'text-gray-400';
    default: return 'text-gray-400';
  }
};

const getConnectionStatusText = (status: string) => {
  switch (status) {
    case 'connected': return 'Connected';
    case 'disconnected': return 'Disconnected';
    case 'never_connected': return 'Not Connected';
    default: return 'Unknown';
  }
};

// ---- Data Hooks ----
const useBikeDetail = (bikeId: string) =>
  useQuery({
    queryKey: ['garage', 'bike', bikeId],
    queryFn: async (): Promise<Motorcycle> => {
      if (!supabase) {
        // Mock data for development
        return {
          id: bikeId,
          user_id: 'user1',
          make: 'Yamaha',
          model: 'R1',
          year: 2023,
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
          ecu_type: 'Mikuni',
          connection_protocol: 'OBD-II',
          last_flash_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          current_tune: 'Stage 2 Performance',
          connection_status: 'connected',
          battery_level: 85,
          last_connected: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          vin: 'JYARN23E0PA123456',
          mileage_km: 15420,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          displacement_cc: 998,
          max_power_hp: 200,
          max_torque_nm: 113,
          fuel_type: 'Gasoline',
          engine_type: 'Inline-4',
          transmission: '6-speed',
          abs: true,
          traction_control: true,
          quick_shifter: true,
          launch_control: true,
          wheelie_control: true,
          engine_braking_control: true,
          notes: 'Track-focused setup with Akrapovic exhaust and custom ECU mapping',
          purchase_date: '2023-05-15',
          purchase_price: 18999,
          service_due_km: 16000,
          service_due_date: '2024-03-15',
          insurance_expiry: '2024-05-15',
        };
      }

      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .eq('id', bikeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bikeId,
    staleTime: 30_000,
  });

const useTuneHistory = (bikeId: string) =>
  useQuery({
    queryKey: ['garage', 'bike', bikeId, 'tune-history'],
    queryFn: async (): Promise<TuneHistory[]> => {
      // Mock data for development
      return [
        {
          id: '1',
          tune_name: 'Stage 2 Performance',
          tune_id: 'tune-123',
          applied_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'success',
          performance_gain: 15,
          notes: 'Significant improvement in throttle response and power delivery',
          version: '2.1',
        },
        {
          id: '2',
          tune_name: 'Stage 1 Economy',
          tune_id: 'tune-456',
          applied_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'success',
          performance_gain: 8,
          notes: 'Improved fuel efficiency without sacrificing performance',
          version: '1.3',
        },
        {
          id: '3',
          tune_name: 'Track Day Special',
          tune_id: 'tune-789',
          applied_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'success',
          performance_gain: 22,
          notes: 'Aggressive mapping for track use only',
          version: '1.0',
        },
      ];
    },
    enabled: !!bikeId,
    staleTime: 60_000,
  });

const useMaintenanceHistory = (bikeId: string) =>
  useQuery({
    queryKey: ['garage', 'bike', bikeId, 'maintenance'],
    queryFn: async (): Promise<MaintenanceRecord[]> => {
      // Mock data for development
      return [
        {
          id: '1',
          type: 'service',
          description: 'Regular 10,000km service',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          mileage_km: 10000,
          cost: 450,
          next_service_km: 15000,
          notes: 'Oil and filter changed, chain adjusted',
          parts_replaced: ['Engine Oil', 'Oil Filter', 'Air Filter'],
        },
        {
          id: '2',
          type: 'upgrade',
          description: 'Akrapovic exhaust installation',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          mileage_km: 8500,
          cost: 1200,
          notes: 'Full system with titanium muffler',
          parts_replaced: ['Exhaust System'],
        },
        {
          id: '3',
          type: 'repair',
          description: 'Front brake pad replacement',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          mileage_km: 7200,
          cost: 180,
          notes: 'Replaced with performance pads',
          parts_replaced: ['Front Brake Pads'],
        },
      ];
    },
    enabled: !!bikeId,
    staleTime: 60_000,
  });

const useConnectBike = () =>
  useMutation({
    mutationFn: async (bikeId: string) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: 'Bike connected successfully' };
    },
  });

// ---- Components ----
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
    <div className="flex items-center gap-3 mb-2">
      <div className={cx('w-10 h-10 rounded-full flex items-center justify-center text-lg', color)}>
        {icon}
      </div>
      <div>
        <div className="text-sm text-white/60">{title}</div>
        <div className="text-xl font-bold text-white/90">{value}</div>
        {subtitle && <div className="text-xs text-white/50">{subtitle}</div>}
      </div>
    </div>
  </div>
);

const BikeDetailPage: React.FC = () => {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'history' | 'maintenance'>('overview');

  const bikeQuery = useBikeDetail(bikeId!);
  const tuneHistoryQuery = useTuneHistory(bikeId!);
  const maintenanceQuery = useMaintenanceHistory(bikeId!);
  const connectMutation = useConnectBike();

  useEffect(() => {
    if (bikeQuery.data) {
      document.title = `${bikeQuery.data.year} ${bikeQuery.data.make} ${bikeQuery.data.model} • RevSync`;
    }
  }, [bikeQuery.data]);

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync(bikeId!);
      queryClient.invalidateQueries({ queryKey: ['garage', 'bike', bikeId] });
    } catch (error) {
      console.error('Failed to connect bike:', error);
    }
  };

  if (bikeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
        <div className="animate-pulse">
          <div className="h-64 bg-white/5" />
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="space-y-6">
              <div className="h-8 bg-white/10 rounded w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white/5 rounded-xl" />
                ))}
              </div>
              <div className="h-96 bg-white/5 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bikeQuery.isError || !bikeQuery.data) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-white/90 mb-2">Motorcycle Not Found</h1>
          <p className="text-white/60 mb-4">The motorcycle you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/garage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Garage
          </button>
        </div>
      </div>
    );
  }

  const bike = bikeQuery.data;

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600/20 to-purple-600/20 overflow-hidden">
        {bike.image_url && (
          <img
            src={bike.image_url}
            alt={`${bike.year} ${bike.make} ${bike.model}`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate('/garage')}
            className="p-2 bg-black/50 backdrop-blur text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 right-4 flex gap-2">
          <span className={cx(
            'px-3 py-1 rounded-md text-sm font-medium backdrop-blur bg-black/50',
            getConnectionStatusColor(bike.connection_status)
          )}>
            {getConnectionStatusText(bike.connection_status)}
          </span>
          {bike.battery_level !== undefined && (
            <span className="px-3 py-1 bg-black/50 backdrop-blur text-white rounded-md text-sm font-medium flex items-center gap-1">
              {getBatteryIcon(bike.battery_level)} {bike.battery_level}%
            </span>
          )}
        </div>

        {/* Bike Info Overlay */}
        <div className="absolute bottom-6 left-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {bike.year} {bike.make} {bike.model}
          </h1>
          <p className="text-white/80">
            {bike.displacement_cc}cc • {bike.engine_type} • {bike.transmission}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Mileage"
            value={bike.mileage_km?.toLocaleString() || '—'}
            subtitle="km"
            icon="📊"
            color="bg-blue-600/20 text-blue-300"
          />
          <StatCard
            title="Power"
            value={bike.max_power_hp || '—'}
            subtitle="HP"
            icon="⚡"
            color="bg-orange-600/20 text-orange-300"
          />
          <StatCard
            title="Torque"
            value={bike.max_torque_nm || '—'}
            subtitle="Nm"
            icon="🔧"
            color="bg-green-600/20 text-green-300"
          />
          <StatCard
            title="Current Tune"
            value={bike.current_tune}
            subtitle={bike.last_flash_date ? `Applied ${formatRelativeTime(bike.last_flash_date)}` : 'Never applied'}
            icon="🎯"
            color="bg-purple-600/20 text-purple-300"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={handleConnect}
            disabled={bike.connection_status === 'connected' || connectMutation.isPending}
            className={cx(
              'px-6 py-3 rounded-lg font-medium transition-colors',
              bike.connection_status === 'connected'
                ? 'bg-green-600/20 text-green-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {connectMutation.isPending 
              ? 'Connecting...' 
              : bike.connection_status === 'connected' 
                ? 'Connected' 
                : 'Connect Bike'
            }
          </button>
          <Link
            to={`/garage/${bike.id}/edit`}
            className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
          >
            Edit Details
          </Link>
          <Link
            to="/marketplace"
            className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
          >
            Browse Tunes
          </Link>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 mb-8">
          <div className="flex gap-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'specs', label: 'Specifications' },
              { key: 'history', label: 'Tune History' },
              { key: 'maintenance', label: 'Maintenance' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cx(
                  'pb-4 px-2 border-b-2 transition-colors',
                  activeTab === tab.key
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* General Information */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white/90">General Information</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">VIN</span>
                    <span className="text-white/90 font-mono">{bike.vin || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Purchase Date</span>
                    <span className="text-white/90">{bike.purchase_date ? new Date(bike.purchase_date).toLocaleDateString() : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Purchase Price</span>
                    <span className="text-white/90">{bike.purchase_price ? `$${bike.purchase_price.toLocaleString()}` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Insurance Expiry</span>
                    <span className="text-white/90">{bike.insurance_expiry ? new Date(bike.insurance_expiry).toLocaleDateString() : 'Not specified'}</span>
                  </div>
                </div>

                {bike.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-white/90 mb-3">Notes</h3>
                    <p className="text-white/70 leading-relaxed bg-white/5 p-4 rounded-lg">{bike.notes}</p>
                  </div>
                )}
              </section>

              {/* Service Information */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white/90">Service Information</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Current Mileage</span>
                    <span className="text-white/90">{bike.mileage_km?.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Service Due</span>
                    <span className="text-white/90">
                      {bike.service_due_km ? `${bike.service_due_km.toLocaleString()} km` : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Service Due Date</span>
                    <span className="text-white/90">
                      {bike.service_due_date ? new Date(bike.service_due_date).toLocaleDateString() : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Last Connected</span>
                    <span className="text-white/90">{formatRelativeTime(bike.last_connected)}</span>
                  </div>
                </div>

                {/* Service Alert */}
                {bike.service_due_km && bike.mileage_km && bike.service_due_km - bike.mileage_km < 1000 && (
                  <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-orange-400 text-xl">⚠️</span>
                      <div>
                        <div className="font-medium text-orange-300">Service Due Soon</div>
                        <div className="text-sm text-orange-400">
                          {bike.service_due_km - bike.mileage_km} km remaining
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Engine Specifications */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white/90">Engine Specifications</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Displacement</span>
                    <span className="text-white/90">{bike.displacement_cc} cc</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Engine Type</span>
                    <span className="text-white/90">{bike.engine_type}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Max Power</span>
                    <span className="text-white/90">{bike.max_power_hp} HP</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Max Torque</span>
                    <span className="text-white/90">{bike.max_torque_nm} Nm</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Fuel Type</span>
                    <span className="text-white/90">{bike.fuel_type}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Transmission</span>
                    <span className="text-white/90">{bike.transmission}</span>
                  </div>
                </div>
              </section>

              {/* Electronic Systems */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-white/90">Electronic Systems</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">ECU Type</span>
                    <span className="text-white/90">{bike.ecu_type}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Connection Protocol</span>
                    <span className="text-white/90">{bike.connection_protocol}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white/90 mb-4">Electronic Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'abs', label: 'ABS', value: bike.abs },
                      { key: 'traction_control', label: 'Traction Control', value: bike.traction_control },
                      { key: 'quick_shifter', label: 'Quick Shifter', value: bike.quick_shifter },
                      { key: 'launch_control', label: 'Launch Control', value: bike.launch_control },
                      { key: 'wheelie_control', label: 'Wheelie Control', value: bike.wheelie_control },
                      { key: 'engine_braking_control', label: 'Engine Braking Control', value: bike.engine_braking_control },
                    ].map(feature => (
                      <div key={feature.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-white/80 text-sm">{feature.label}</span>
                        <span className={cx(
                          'text-sm font-medium',
                          feature.value ? 'text-green-400' : 'text-gray-400'
                        )}>
                          {feature.value ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Tune History Tab */}
          {activeTab === 'history' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white/90">Tune History</h2>
                <Link
                  to="/marketplace"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Browse New Tunes
                </Link>
              </div>

              {tuneHistoryQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : tuneHistoryQuery.data && tuneHistoryQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {tuneHistoryQuery.data.map((tune) => (
                    <div key={tune.id} className="p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white/90">{tune.tune_name}</h3>
                          <p className="text-white/60 text-sm">
                            Applied {new Date(tune.applied_date).toLocaleDateString()} • Version {tune.version}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cx(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            tune.status === 'success' 
                              ? 'bg-green-600/20 text-green-300'
                              : tune.status === 'failed'
                                ? 'bg-red-600/20 text-red-300'
                                : 'bg-yellow-600/20 text-yellow-300'
                          )}>
                            {tune.status}
                          </span>
                          {tune.performance_gain && (
                            <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs font-medium">
                              +{tune.performance_gain}% power
                            </span>
                          )}
                        </div>
                      </div>
                      {tune.notes && (
                        <p className="text-white/70 text-sm">{tune.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-xl font-semibold text-white/90 mb-2">No tune history</h3>
                  <p className="text-white/60 mb-6">Start by applying your first tune to see history here.</p>
                  <Link
                    to="/marketplace"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Browse Tunes
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white/90">Maintenance History</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Add Record
                </button>
              </div>

              {maintenanceQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : maintenanceQuery.data && maintenanceQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceQuery.data.map((record) => (
                    <div key={record.id} className="p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white/90">{record.description}</h3>
                          <p className="text-white/60 text-sm">
                            {new Date(record.date).toLocaleDateString()} • {record.mileage_km.toLocaleString()} km
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cx(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            record.type === 'service' 
                              ? 'bg-blue-600/20 text-blue-300'
                              : record.type === 'repair'
                                ? 'bg-orange-600/20 text-orange-300'
                                : record.type === 'upgrade'
                                  ? 'bg-green-600/20 text-green-300'
                                  : 'bg-purple-600/20 text-purple-300'
                          )}>
                            {record.type}
                          </span>
                          {record.cost && (
                            <span className="text-white/60 text-sm font-medium">
                              ${record.cost}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {record.parts_replaced && record.parts_replaced.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-white/60 mb-2">Parts Replaced:</div>
                          <div className="flex flex-wrap gap-1">
                            {record.parts_replaced.map((part, index) => (
                              <span key={index} className="px-2 py-1 bg-white/10 text-white/80 rounded-md text-xs">
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {record.notes && (
                        <p className="text-white/70 text-sm">{record.notes}</p>
                      )}
                      
                      {record.next_service_km && (
                        <div className="mt-3 text-xs text-white/50">
                          Next service due at {record.next_service_km.toLocaleString()} km
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-xl font-semibold text-white/90 mb-2">No maintenance records</h3>
                  <p className="text-white/60 mb-6">Keep track of your motorcycle's maintenance and service history.</p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Add First Record
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default BikeDetailPage;
