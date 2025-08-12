import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

// Garage - World-class motorcycle management with perfect mobile parity
// Enhanced web version with rich interactions, detailed stats, and comprehensive bike management

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
  // Additional fields for web
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

interface GarageStats {
  total_bikes: number;
  total_tunes_applied: number;
  total_miles_ridden: number;
  connected_bikes: number;
  recent_activity: Array<{
    id: string;
    type: 'tune_applied' | 'bike_connected' | 'service_reminder' | 'insurance_reminder';
    bike_id: string;
    bike_name: string;
    description: string;
    timestamp: string;
  }>;
}

interface TuneHistory {
  id: string;
  tune_name: string;
  applied_date: string;
  bike_id: string;
  status: 'success' | 'failed' | 'pending';
  notes?: string;
}

// ---- API Configuration ----
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Auth headers hook - using React Context properly
const useAuthHeaders = (): { Authorization?: string } => {
  // For now, return empty headers - this will be replaced with proper auth integration
  // Return type ensures TypeScript knows about the Authorization property
  return {};
};

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
const useMotorcycles = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['garage', 'motorcycles'],
    queryFn: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/garage/`, {
          headers: authHeaders.Authorization ? {
            'Content-Type': 'application/json',
            ...authHeaders,
          } : {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform backend data to frontend format
        return data.map((item: any) => ({
          id: item.id.toString(),
          user_id: 'current_user',
          make: item.motorcycle.manufacturer.name,
          model: item.motorcycle.model_name,
          year: item.motorcycle.year,
          image_url: item.motorcycle.primary_image_url || 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
          ecu_type: 'Standard', // Default value
          connection_protocol: 'OBD-II', // Default value
          last_flash_date: null,
          current_tune: 'Stock',
          connection_status: 'never_connected' as const,
          battery_level: undefined,
          last_connected: undefined,
          vin: undefined,
          mileage_km: item.current_mileage_km,
          created_at: item.created_at,
          updated_at: item.updated_at,
          displacement_cc: item.motorcycle.displacement_cc,
          max_power_hp: item.motorcycle.max_power_hp,
          max_torque_nm: item.motorcycle.max_torque_nm,
          fuel_type: 'Gasoline', // Default value
          engine_type: 'Standard', // Default value
          transmission: `${item.motorcycle.gears}-speed`,
          abs: item.motorcycle.abs,
          traction_control: item.motorcycle.traction_control,
          quick_shifter: item.motorcycle.quickshifter,
          launch_control: false, // Default value
          wheelie_control: false, // Default value
          engine_braking_control: false, // Default value
          notes: item.notes,
          purchase_date: item.purchase_date,
          purchase_price: item.purchase_price,
          service_due_km: undefined,
          service_due_date: undefined,
        }));
      } catch (error) {
        console.error('Failed to fetch motorcycles:', error);
        // Return empty array on error
        return [];
      }
    },
    staleTime: 30_000,
    enabled: !!authHeaders.Authorization, // Only fetch if authenticated
  });
};

const useGarageStats = () =>
  useQuery({
    queryKey: ['garage', 'stats'],
    queryFn: async (): Promise<GarageStats> => {
      // Mock data for development
      return {
        total_bikes: 2,
        total_tunes_applied: 15,
        total_miles_ridden: 24170,
        connected_bikes: 1,
        recent_activity: [
          {
            id: '1',
            type: 'tune_applied',
            bike_id: '1',
            bike_name: '2023 Yamaha R1',
            description: 'Applied Stage 2 Performance tune',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            type: 'bike_connected',
            bike_id: '1',
            bike_name: '2023 Yamaha R1',
            description: 'Bike connected via Bluetooth',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            type: 'service_reminder',
            bike_id: '2',
            bike_name: '2022 Honda CBR1000RR',
            description: 'Service due in 1,250 km',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };
    },
    staleTime: 60_000,
  });

const useConnectBike = () =>
  useMutation({
    mutationFn: async (bikeId: string) => {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: 'Bike connected successfully' };
    },
  });

const useDeleteBike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bikeId: string) => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      const { error } = await supabase.from('motorcycles').delete().eq('id', bikeId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage', 'motorcycles'] });
      queryClient.invalidateQueries({ queryKey: ['garage', 'stats'] });
    },
  });
};

// ---- Components ----
const BikeCard: React.FC<{ 
  bike: Motorcycle; 
  onConnect: (id: string) => void; 
  onDelete: (id: string) => void;
  className?: string;
}> = ({ bike, onConnect, onDelete, className }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tune_applied': return '🔧';
      case 'bike_connected': return '📶';
      case 'service_reminder': return '🔧';
      case 'insurance_reminder': return '📋';
      default: return '📢';
    }
  };

  return (
    <article className={cx("group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 overflow-hidden hover:border-white/20", className)}>
      {/* Header Image */}
      <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative overflow-hidden">
        {bike.image_url ? (
          <img 
            src={bike.image_url} 
            alt={`${bike.year} ${bike.make} ${bike.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-50">🏍️</span>
          </div>
        )}
        
        {/* Status Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={cx(
            'px-2 py-1 rounded-md text-xs font-medium backdrop-blur bg-black/50',
            getConnectionStatusColor(bike.connection_status)
          )}>
            {getConnectionStatusText(bike.connection_status)}
          </span>
          {bike.battery_level !== undefined && (
            <span className="px-2 py-1 bg-black/50 backdrop-blur text-white rounded-md text-xs font-medium flex items-center gap-1">
              {getBatteryIcon(bike.battery_level)} {bike.battery_level}%
            </span>
          )}
        </div>

        {/* Actions Menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 bg-black/50 backdrop-blur text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {showActions && (
            <div className="absolute top-12 right-0 w-48 bg-black/90 backdrop-blur rounded-lg border border-white/20 py-2 z-10">
              <button
                onClick={() => navigate(`/garage/${bike.id}`)}
                className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm"
              >
                View Details
              </button>
              <button
                onClick={() => navigate(`/garage/${bike.id}/edit`)}
                className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm"
              >
                Edit Bike
              </button>
              <button
                onClick={() => onConnect(bike.id)}
                className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm"
                disabled={bike.connection_status === 'connected'}
              >
                {bike.connection_status === 'connected' ? 'Connected' : 'Connect'}
              </button>
              <hr className="my-2 border-white/20" />
              <button
                onClick={() => onDelete(bike.id)}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
              >
                Delete Bike
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white/90 mb-1">
              {bike.year} {bike.make} {bike.model}
            </h3>
            <p className="text-white/60 text-sm">
              {bike.displacement_cc}cc • {bike.engine_type} • {bike.transmission}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-white/90">
              {bike.mileage_km?.toLocaleString()} km
            </div>
            <div className="text-xs text-white/60">Mileage</div>
          </div>
        </div>

        {/* Current Tune */}
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white/90">Current Tune</div>
              <div className="text-white/70">{bike.current_tune}</div>
            </div>
            <div className="text-xs text-white/50">
              {bike.last_flash_date ? `Applied ${formatRelativeTime(bike.last_flash_date)}` : 'Never applied'}
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-lg font-bold text-white/90">{bike.max_power_hp || '—'}</div>
            <div className="text-xs text-white/60">HP</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-lg font-bold text-white/90">{bike.max_torque_nm || '—'}</div>
            <div className="text-xs text-white/60">Nm</div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {bike.abs && <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-md text-xs">ABS</span>}
          {bike.traction_control && <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded-md text-xs">TC</span>}
          {bike.quick_shifter && <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-md text-xs">QS</span>}
          {bike.launch_control && <span className="px-2 py-1 bg-orange-600/20 text-orange-300 rounded-md text-xs">LC</span>}
          {bike.wheelie_control && <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded-md text-xs">WC</span>}
        </div>

        {/* Service Due */}
        {bike.service_due_km && bike.mileage_km && bike.service_due_km - bike.mileage_km < 1000 && (
          <div className="mb-4 p-3 bg-orange-600/10 border border-orange-600/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-orange-400">⚠️</span>
              <div>
                <div className="text-sm font-medium text-orange-300">Service Due Soon</div>
                <div className="text-xs text-orange-400">
                  {bike.service_due_km - bike.mileage_km} km remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Info */}
        <div className="text-xs text-white/50 mb-4">
          <div>ECU: {bike.ecu_type} • Protocol: {bike.connection_protocol}</div>
          {bike.last_connected && (
            <div>Last connected: {formatRelativeTime(bike.last_connected)}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/garage/${bike.id}`)}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
          <button
            onClick={() => onConnect(bike.id)}
            disabled={bike.connection_status === 'connected'}
            className={cx(
              'py-3 px-4 rounded-lg text-sm font-medium transition-colors',
              bike.connection_status === 'connected'
                ? 'bg-green-600/20 text-green-300 cursor-not-allowed'
                : 'border border-white/20 text-white/90 hover:bg-white/5'
            )}
          >
            {bike.connection_status === 'connected' ? 'Connected' : 'Connect'}
          </button>
        </div>
      </div>
    </article>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  color: string;
  href?: string;
}> = ({ title, value, subtitle, icon, color, href }) => {
  const content = (
    <div className={cx(
      'p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors',
      href && 'cursor-pointer'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className={cx('w-12 h-12 rounded-full flex items-center justify-center text-xl', color)}>
          {icon}
        </div>
        {href && (
          <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <div className="text-2xl font-bold text-white/90 mb-1">{value}</div>
      <div className="text-sm text-white/60">{title}</div>
      {subtitle && <div className="text-xs text-white/50 mt-1">{subtitle}</div>}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

// ---- Main Component ----
const GaragePage: React.FC = () => {
  const navigate = useNavigate();
  const motorcyclesQuery = useMotorcycles();
  const statsQuery = useGarageStats();
  const connectMutation = useConnectBike();
  const deleteMutation = useDeleteBike();

  const [selectedBike, setSelectedBike] = useState<Motorcycle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    document.title = 'Garage • RevSync';
  }, []);

  const handleConnect = useCallback(async (bikeId: string) => {
    try {
      await connectMutation.mutateAsync(bikeId);
      // Refresh data
      motorcyclesQuery.refetch();
    } catch (error) {
      console.error('Failed to connect bike:', error);
    }
  }, [connectMutation, motorcyclesQuery]);

  const handleDelete = useCallback((bikeId: string) => {
    const bike = motorcyclesQuery.data?.find(b => b.id === bikeId);
    if (bike) {
      setSelectedBike(bike);
      setShowDeleteConfirm(true);
    }
  }, [motorcyclesQuery.data]);

  const confirmDelete = useCallback(async () => {
    if (selectedBike) {
      try {
        await deleteMutation.mutateAsync(selectedBike.id);
        setShowDeleteConfirm(false);
        setSelectedBike(null);
      } catch (error) {
        console.error('Failed to delete bike:', error);
      }
    }
  }, [selectedBike, deleteMutation]);

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white/90">Garage</h1>
              <p className="text-sm text-white/60 mt-1">Manage your motorcycle collection</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/garage/add" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add Motorcycle
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bikes"
            value={statsQuery.data?.total_bikes || 0}
            icon="🏍️"
            color="bg-blue-600/20 text-blue-300"
          />
          <StatCard
            title="Tunes Applied"
            value={statsQuery.data?.total_tunes_applied || 0}
            icon="🔧"
            color="bg-green-600/20 text-green-300"
          />
          <StatCard
            title="Miles Ridden"
            value={statsQuery.data?.total_miles_ridden?.toLocaleString() || '0'}
            icon="📊"
            color="bg-purple-600/20 text-purple-300"
          />
          <StatCard
            title="Connected"
            value={`${statsQuery.data?.connected_bikes || 0}/${statsQuery.data?.total_bikes || 0}`}
            icon="📶"
            color="bg-orange-600/20 text-orange-300"
          />
        </div>

        {/* Motorcycles Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white/90">Your Motorcycles</h2>
            <div className="text-sm text-white/60">
              {motorcyclesQuery.data?.length || 0} motorcycles
            </div>
          </div>

          {motorcyclesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : motorcyclesQuery.isError ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😞</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">Failed to load motorcycles</h3>
              <p className="text-white/60 mb-4">There was an error loading your garage. Please try again.</p>
              <button
                onClick={() => motorcyclesQuery.refetch()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : !motorcyclesQuery.data || motorcyclesQuery.data.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏍️</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">No motorcycles yet</h3>
              <p className="text-white/60 mb-6">Add your first motorcycle to get started with tuning and performance tracking.</p>
              <Link
                to="/garage/add"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Your First Motorcycle
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {motorcyclesQuery.data.map((bike) => (
                <BikeCard
                  key={bike.id}
                  bike={bike}
                  onConnect={handleConnect}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity Section */}
        {statsQuery.data?.recent_activity && statsQuery.data.recent_activity.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {statsQuery.data.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-300">
                      {activity.type === 'tune_applied' && '🔧'}
                      {activity.type === 'bike_connected' && '📶'}
                      {activity.type === 'service_reminder' && '🔧'}
                      {activity.type === 'insurance_reminder' && '📋'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white/90">{activity.description}</div>
                    <div className="text-sm text-white/60">{activity.bike_name}</div>
                  </div>
                  <div className="text-sm text-white/50">
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedBike && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-black/90 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white/90 mb-4">Delete Motorcycle</h3>
            <p className="text-white/70 mb-6">
              Are you sure you want to delete <strong>{selectedBike.year} {selectedBike.make} {selectedBike.model}</strong>? 
              This action cannot be undone and will remove all associated tune history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedBike(null);
                }}
                className="flex-1 py-3 px-4 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaragePage;
