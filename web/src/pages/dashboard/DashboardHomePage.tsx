import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// Dashboard Home - World-class overview page with responsive design
// Provides quick access to key features and statistics

interface DashboardStats {
  motorcycles: number;
  tunes_applied: number;
  total_downloads: number;
  community_tunes: number;
}

interface RecentActivity {
  id: string;
  type: 'tune_applied' | 'bike_added' | 'community_share' | 'ai_recommendation';
  title: string;
  description: string;
  timestamp: string;
}

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// Use auth headers (consistent with other pages)
const useAuthHeaders = (): Record<string, string> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuth } = require('../../contexts/AuthContext');
    const { accessToken } = useAuth?.() ?? {};
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  } catch {
    return {};
  }
};

// Data hooks
const useDashboardStats = () => {
  const headers = useAuthHeaders();
  return useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/dashboard/stats/`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to load dashboard stats');
      }
      return res.json();
    },
    staleTime: 60_000,
  });
};

const useRecentActivity = () => {
  const headers = useAuthHeaders();
  return useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/dashboard/activity/?limit=5`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to load recent activity');
      }
      const data = await res.json();
      return data.results || [];
    },
    staleTime: 30_000,
  });
};

// UI Components
const StatCard: React.FC<{ 
  title: string; 
  value: number | string; 
  icon: string; 
  color: string;
  href?: string; 
}> = ({ title, value, icon, color, href }) => {
  const content = (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-colors ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">{title}</p>
          <p className="text-2xl font-bold text-white/90 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className={`text-3xl ${color}`} aria-hidden="true">{icon}</div>
      </div>
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
};

const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'tune_applied': return '⚡';
      case 'bike_added': return '🏍️';
      case 'community_share': return '🌟';
      case 'ai_recommendation': return '🤖';
      default: return 'ℹ️';
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm">{getIcon(activity.type)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white/90 truncate">{activity.title}</p>
        <p className="text-xs text-white/60 truncate">{activity.description}</p>
        <p className="text-xs text-white/50 mt-1">{timeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
};

const QuickActionCard: React.FC<{ 
  title: string; 
  description: string; 
  icon: string; 
  href: string; 
  color: string;
}> = ({ title, description, icon, href, color }) => (
  <Link to={href} className="group">
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-all group-hover:border-white/20">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <span className="text-xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-white/90 mb-2">{title}</h3>
      <p className="text-sm text-white/60">{description}</p>
      <div className="mt-4 text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
        Get started →
      </div>
    </div>
  </Link>
);

const DashboardHomePage: React.FC = () => {
  const statsQuery = useDashboardStats();
  const activityQuery = useRecentActivity();

  useEffect(() => {
    document.title = 'Dashboard • RevSync';
  }, []);

  const stats = statsQuery.data;
  const activities = activityQuery.data || [];

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white/90">Dashboard</h1>
              <p className="text-sm text-white/60 mt-1">Welcome back to RevSync</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link 
                to="/garage" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Manage Garage
              </Link>
              <Link 
                to="/marketplace" 
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Browse Tunes
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white/90 mb-4">Your Stats</h2>
          {statsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : statsQuery.isError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
              <p className="text-red-300">Failed to load dashboard stats</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Motorcycles"
                value={stats?.motorcycles || 0}
                icon="🏍️"
                color="text-blue-400"
                href="/garage"
              />
              <StatCard
                title="Tunes Applied"
                value={stats?.tunes_applied || 0}
                icon="⚡"
                color="text-green-400"
              />
              <StatCard
                title="Downloads"
                value={stats?.total_downloads || 0}
                icon="📥"
                color="text-purple-400"
                href="/marketplace"
              />
              <StatCard
                title="Community Tunes"
                value={stats?.community_tunes || 0}
                icon="🌟"
                color="text-yellow-400"
                href="/community"
              />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <section className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white/90 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionCard
                title="AI Tune Generator"
                description="Get personalized tune recommendations using AI"
                icon="🤖"
                href="/dashboard/ai-tunes"
                color="bg-gradient-to-br from-purple-600 to-blue-600"
              />
              <QuickActionCard
                title="Add Motorcycle"
                description="Register a new bike in your digital garage"
                icon="➕"
                href="/garage/add"
                color="bg-gradient-to-br from-green-600 to-teal-600"
              />
              <QuickActionCard
                title="Browse Marketplace"
                description="Discover tunes from the global community"
                icon="🛒"
                href="/marketplace"
                color="bg-gradient-to-br from-orange-600 to-red-600"
              />
              <QuickActionCard
                title="Join Community"
                description="Connect with riders and tune creators"
                icon="👥"
                href="/community"
                color="bg-gradient-to-br from-indigo-600 to-purple-600"
              />
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-semibold text-white/90 mb-4">Recent Activity</h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              {activityQuery.isLoading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 bg-white/10 rounded animate-pulse mb-2" />
                          <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activityQuery.isError ? (
                <div className="p-6 text-center">
                  <p className="text-white/60">Failed to load recent activity</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-2">🚀</div>
                  <p className="text-white/60">No recent activity</p>
                  <p className="text-white/40 text-sm mt-1">Start by adding a motorcycle or browsing tunes</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardHomePage;
