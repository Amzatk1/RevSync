import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Admin Dashboard Page - Comprehensive real-time admin overview
// World-class admin interface with AI insights, system metrics, and management tools

// ---- Types ----
interface SystemMetrics {
  // User metrics
  total_users: number;
  active_users_24h: number;
  new_users_7d: number;
  user_growth_rate: number;
  
  // Content metrics
  total_tunes: number;
  pending_tunes: number;
  approved_tunes: number;
  rejected_tunes: number;
  
  // AI metrics
  ai_reviews_today: number;
  ai_accuracy_rate: number;
  manual_reviews_needed: number;
  
  // System health
  server_uptime: number;
  api_response_time: number;
  error_rate: number;
  storage_usage: number;
  
  // Revenue (if applicable)
  revenue_today: number;
  revenue_7d: number;
  premium_users: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'tune_upload' | 'ai_review' | 'security_alert' | 'system_event';
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface AIInsight {
  id: string;
  category: 'safety' | 'performance' | 'user_behavior' | 'system';
  title: string;
  description: string;
  confidence: number;
  action_required: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

interface QuickStat {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

// ---- API Configuration ----
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Auth headers hook
const useAuthHeaders = () => {
  try {
    const { useAuth } = require('../../contexts/AuthContext');
    const { auth } = useAuth?.() ?? {};
    return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
  } catch {
    return {};
  }
};

// ---- Helpers ----
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user_registration': return '👤';
    case 'tune_upload': return '🔧';
    case 'ai_review': return '🤖';
    case 'security_alert': return '🚨';
    case 'system_event': return '⚙️';
    default: return '📄';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'border-red-500 bg-red-500/10 text-red-300';
    case 'high': return 'border-orange-500 bg-orange-500/10 text-orange-300';
    case 'medium': return 'border-yellow-500 bg-yellow-500/10 text-yellow-300';
    case 'low': return 'border-green-500 bg-green-500/10 text-green-300';
    default: return 'border-gray-500 bg-gray-500/10 text-gray-300';
  }
};

// ---- Data Hooks ----
const useSystemMetrics = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async (): Promise<SystemMetrics> => {
      // Mock data (replace with real admin API)
      return {
        total_users: 12847,
        active_users_24h: 3256,
        new_users_7d: 428,
        user_growth_rate: 12.3,
        total_tunes: 5634,
        pending_tunes: 23,
        approved_tunes: 5487,
        rejected_tunes: 124,
        ai_reviews_today: 156,
        ai_accuracy_rate: 94.7,
        manual_reviews_needed: 8,
        server_uptime: 2592000, // 30 days
        api_response_time: 127,
        error_rate: 0.03,
        storage_usage: 78.5,
        revenue_today: 2847.50,
        revenue_7d: 19235.75,
        premium_users: 1847,
      };
    },
    staleTime: 30_000, // 30 seconds
    enabled: !!authHeaders.Authorization,
  });
};

const useRecentActivity = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: async (): Promise<RecentActivity[]> => {
      // Mock recent activity data
      return [
        {
          id: '1',
          type: 'security_alert',
          title: 'Suspicious Login Attempt',
          description: 'Multiple failed login attempts from IP 192.168.1.100',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          severity: 'high',
          user: { id: '1', username: 'user123' },
        },
        {
          id: '2',
          type: 'ai_review',
          title: 'AI Tune Review Completed',
          description: 'Yamaha R1 Stage 2 tune approved with 96% safety score',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          severity: 'low',
          user: { id: '2', username: 'protune_racing' },
        },
        {
          id: '3',
          type: 'tune_upload',
          title: 'New Tune Uploaded',
          description: 'Honda CBR1000RR Track Performance tune pending review',
          timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
          severity: 'medium',
          user: { id: '3', username: 'track_master' },
        },
        {
          id: '4',
          type: 'user_registration',
          title: 'New User Registered',
          description: 'Premium account created with Yamaha R6 2023',
          timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          severity: 'low',
          user: { id: '4', username: 'speed_demon' },
        },
        {
          id: '5',
          type: 'system_event',
          title: 'Database Maintenance',
          description: 'Scheduled maintenance completed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'low',
        },
      ];
    },
    staleTime: 60_000, // 1 minute
    enabled: !!authHeaders.Authorization,
  });
};

const useAIInsights = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['admin', 'ai_insights'],
    queryFn: async (): Promise<AIInsight[]> => {
      // Mock AI insights
      return [
        {
          id: '1',
          category: 'safety',
          title: 'Aggressive Tune Pattern Detected',
          description: 'AI detected 3 tunes with similar aggressive timing patterns that may require manual review',
          confidence: 0.87,
          action_required: true,
          priority: 'high',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          category: 'user_behavior',
          title: 'User Engagement Increase',
          description: 'Community engagement up 23% - consider featuring more user-generated content',
          confidence: 0.92,
          action_required: false,
          priority: 'medium',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          category: 'performance',
          title: 'API Response Time Optimization',
          description: 'Search queries taking 15% longer than baseline - recommend index optimization',
          confidence: 0.95,
          action_required: true,
          priority: 'medium',
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
      ];
    },
    staleTime: 300_000, // 5 minutes
    enabled: !!authHeaders.Authorization,
  });
};

// ---- Components ----
const MetricCard: React.FC<{ stat: QuickStat }> = ({ stat }) => (
  <div className="p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className="text-2xl">{stat.icon}</div>
      <div className={cx(
        'flex items-center gap-1 text-sm font-medium',
        stat.trend === 'up' ? 'text-green-400' : stat.trend === 'down' ? 'text-red-400' : 'text-gray-400'
      )}>
        {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
        {Math.abs(stat.change)}%
      </div>
    </div>
    <div className="text-2xl font-bold text-white/90 mb-1">{stat.value}</div>
    <div className="text-sm text-white/60">{stat.label}</div>
  </div>
);

const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => (
  <div className={cx(
    'p-4 rounded-lg border transition-colors',
    getSeverityColor(activity.severity)
  )}>
    <div className="flex items-start gap-3">
      <div className="text-xl">{getActivityIcon(activity.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-white/90 truncate">{activity.title}</h4>
          <span className="text-xs text-white/50">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-white/70 mb-2">{activity.description}</p>
        {activity.user && (
          <div className="text-xs text-white/60">
            User: {activity.user.username}
          </div>
        )}
      </div>
    </div>
  </div>
);

const AIInsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => (
  <div className={cx(
    'p-4 rounded-lg border border-white/10 bg-white/[0.03]',
    insight.action_required && 'border-orange-500/30 bg-orange-500/5'
  )}>
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <span className={cx(
          'px-2 py-1 rounded text-xs font-medium',
          insight.priority === 'high' ? 'bg-red-600/20 text-red-300' :
          insight.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
          'bg-green-600/20 text-green-300'
        )}>
          {insight.priority}
        </span>
      </div>
      <div className="text-xs text-white/60">
        {Math.round(insight.confidence * 100)}% confidence
      </div>
    </div>
    <h4 className="font-medium text-white/90 mb-1">{insight.title}</h4>
    <p className="text-sm text-white/70 mb-2">{insight.description}</p>
    {insight.action_required && (
      <div className="text-xs text-orange-300 font-medium">⚠️ Action Required</div>
    )}
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const metrics = useSystemMetrics();
  const activity = useRecentActivity();
  const insights = useAIInsights();

  useEffect(() => {
    document.title = 'Admin Dashboard • RevSync';
  }, []);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      metrics.refetch();
      activity.refetch();
      insights.refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, metrics, activity, insights]);

  const quickStats: QuickStat[] = metrics.data ? [
    {
      label: 'Total Users',
      value: formatNumber(metrics.data.total_users),
      change: metrics.data.user_growth_rate,
      trend: 'up',
      icon: '👥',
      color: 'blue',
    },
    {
      label: 'Active Users (24h)',
      value: formatNumber(metrics.data.active_users_24h),
      change: 8.2,
      trend: 'up',
      icon: '🟢',
      color: 'green',
    },
    {
      label: 'Pending Tunes',
      value: metrics.data.pending_tunes,
      change: -12.5,
      trend: 'down',
      icon: '⏳',
      color: 'yellow',
    },
    {
      label: 'AI Accuracy',
      value: `${metrics.data.ai_accuracy_rate}%`,
      change: 2.1,
      trend: 'up',
      icon: '🤖',
      color: 'purple',
    },
    {
      label: 'Server Uptime',
      value: formatUptime(metrics.data.server_uptime),
      change: 0,
      trend: 'neutral',
      icon: '⚡',
      color: 'green',
    },
    {
      label: 'Revenue (7d)',
      value: `$${formatNumber(metrics.data.revenue_7d)}`,
      change: 15.8,
      trend: 'up',
      icon: '💰',
      color: 'green',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white/90">Admin Dashboard</h1>
                <p className="text-sm text-white/60">Real-time system overview and AI insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Controls */}
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1 bg-white/5 border border-white/20 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10000} className="bg-black">10s refresh</option>
                <option value={30000} className="bg-black">30s refresh</option>
                <option value={60000} className="bg-black">1m refresh</option>
                <option value={300000} className="bg-black">5m refresh</option>
              </select>

              {/* Quick Actions */}
              <Link
                to="/admin/tune-moderation"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Review Tunes ({metrics.data?.pending_tunes || 0})
              </Link>
              <Link
                to="/admin/user-management"
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                Manage Users
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <MetricCard key={index} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white/90">Recent Activity</h2>
                <button
                  onClick={() => activity.refetch()}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {activity.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.data?.slice(0, 8).map(item => (
                    <ActivityItem key={item.id} activity={item} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white/90">AI Insights</h2>
                <span className="text-xs text-white/60">Powered by ML</span>
              </div>

              {insights.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.data?.map(insight => (
                    <AIInsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
            </div>

            {/* System Health */}
            {metrics.data && (
              <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white/90 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">API Response Time</span>
                      <span className="text-white/90">{metrics.data.api_response_time}ms</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (200 - metrics.data.api_response_time) / 2)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">Storage Usage</span>
                      <span className="text-white/90">{metrics.data.storage_usage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={cx(
                          'h-2 rounded-full transition-all',
                          metrics.data.storage_usage > 90 ? 'bg-red-600' :
                          metrics.data.storage_usage > 75 ? 'bg-yellow-600' : 'bg-green-600'
                        )}
                        style={{ width: `${metrics.data.storage_usage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">Error Rate</span>
                      <span className="text-white/90">{(metrics.data.error_rate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(5, (1 - metrics.data.error_rate) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;