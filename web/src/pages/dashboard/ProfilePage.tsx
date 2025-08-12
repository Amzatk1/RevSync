import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

/**
 * ProfilePage (Web)
 * - Mirrors mobile Profile, but adds richer desktop layout, accessibility, and detail.
 * - Responsive: 1-col on mobile, 8/4 split on desktop.
 * - Uses the same AuthContext pattern for headers.
 * - Graceful skeletons + empty states.
 * - A11y: roles/landmarks, labelled sections, reduced motion friendly.
 */

type UserCore = {
  id: string | number;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  member_since?: string | null; // ISO
  miles_ridden?: number | null;
  email_verified?: boolean | null;
};

type UserStats = {
  tunes_applied: number;
  bikes_owned: number;
  achievements_count: number;
  miles_ridden: number;
};

type Achievement = {
  id: string | number;
  name: string;
  description?: string | null;
  icon?: string | null;
  earned: boolean;
  earned_date?: string | null;
  color?: string | null;
};

type ActivityItem = {
  id: string | number;
  type: 'tune_applied' | 'tune_purchased' | 'account_connected' | 'achievement_earned' | 'info';
  title: string;
  description?: string | null;
  timestamp: string; // ISO
};

const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// --- utilities ---
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

// Attach auth headers via the same context you used elsewhere
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

// --- data hooks ---
const useProfile = () => {
  const headers = useAuthHeaders();
  return useQuery<UserCore>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/profile/me/`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },
    staleTime: 60_000,
  });
};

const useProfileStats = () => {
  const headers = useAuthHeaders();
  return useQuery<UserStats>({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/profile/stats/`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    },
    staleTime: 60_000,
  });
};

const useAchievements = () => {
  const headers = useAuthHeaders();
  return useQuery<Achievement[]>({
    queryKey: ['profile', 'achievements'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/profile/achievements/`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load achievements');
      return res.json();
    },
  });
};

const useActivity = (typeFilter: string | 'all') => {
  const headers = useAuthHeaders();
  return useQuery<ActivityItem[]>({
    queryKey: ['profile', 'activity', { typeFilter }],
    queryFn: async () => {
      const qs = typeFilter === 'all' ? '' : `?type=${encodeURIComponent(typeFilter)}`;
      const res = await fetch(`${API_BASE}/api/profile/activity/${qs}`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load activity');
      return res.json();
    },
  });
};

// --- small UI helpers ---
const StatCard: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
    <p className="text-2xl font-semibold leading-none text-white/90">{value}</p>
    <p className="mt-1 text-xs text-white/70">{label}</p>
  </div>
);

const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
    <div className="mb-2 text-2xl" aria-hidden>{icon ?? '🫥'}</div>
    <p className="text-sm font-semibold">{title}</p>
    {subtitle ? <p className="mt-1 text-sm text-white/70">{subtitle}</p> : null}
  </div>
);

const ChipButton: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode; ariaLabel?: string }> = ({ active, onClick, children, ariaLabel }) => (
  <button
    type="button"
    aria-pressed={!!active}
    aria-label={ariaLabel}
    onClick={onClick}
    className={cx(
      'rounded-full border px-3 py-1 text-xs',
      active ? 'border-indigo-300 bg-indigo-600/30' : 'border-white/10 hover:bg-white/5'
    )}
  >
    {children}
  </button>
);

const timeAgo = (iso: string) => {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diffH = Math.floor((now - d) / 3_600_000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
};

const avatarFallback =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face';

// --- page ---
const ProfilePage: React.FC = () => {
  const qc = useQueryClient();
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityItem['type']>('all');

  const profileQ = useProfile();
  const statsQ = useProfileStats();
  const achQ = useAchievements();
  const activityQ = useActivity(activityFilter);

  useEffect(() => {
    document.title = 'Profile • RevSync';
  }, []);

  const user = profileQ.data;
  const stats = statsQ.data;
  const achievements = achQ.data || [];
  const activity = activityQ.data || [];

  const earnedCount = achievements.filter((a) => a.earned).length;
  const earnedPct = achievements.length ? Math.round((earnedCount / achievements.length) * 100) : 0;

  const name = user?.full_name || user?.username || 'Your Name';
  const memberSince = user?.member_since ? new Date(user.member_since) : null;
  const miles = user?.miles_ridden ?? stats?.miles_ridden ?? 0;

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">Profile</h1>
          <p className="ml-2 hidden sm:block text-sm text-white/70">Your RevSync identity, stats & activity</p>
          <div className="ml-auto text-xs text-white/60">
            <Link className="hover:underline" to="/settings">Settings</Link>
            <span aria-hidden className="mx-1">•</span>
            <Link className="hover:underline" to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main id="maincontent" role="main" className="mx-auto max-w-6xl px-4 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <section aria-labelledby="profile-overview" className="lg:col-span-8 space-y-6">
          {/* Identity card */}
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div
              className="h-28 sm:h-32 bg-gradient-to-r from-indigo-700/70 to-fuchsia-700/70"
              aria-hidden
            />
            <div className="bg-white/[0.02] px-4 sm:px-6 pb-5 sm:pb-6">
              <div className="-mt-10 sm:-mt-12 flex items-end gap-4">
                <img
                  src={user?.avatar_url || avatarFallback}
                  alt=""
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 sm:h-24 sm:w-24 rounded-full ring-2 ring-white/20 object-cover"
                />
                <div className="min-w-0">
                  <h2 id="profile-overview" className="text-lg sm:text-xl font-semibold leading-tight text-white/90 truncate">
                    {name}
                  </h2>
                  <p className="mt-0.5 text-xs text-white/70 truncate">
                    {user?.email || '—'} {user?.email_verified ? '• Verified' : '• Unverified'}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Member since{' '}
                    {memberSince ? (
                      <time dateTime={memberSince.toISOString()}>
                        {memberSince.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                      </time>
                    ) : '—'}
                    <span aria-hidden className="mx-1">•</span>
                    {miles?.toLocaleString?.() ?? 0} miles ridden
                  </p>
                </div>
                <div className="ml-auto hidden sm:flex gap-2">
                  <Link
                    to="/settings"
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/[0.07]"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    to="/settings/security"
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/[0.07]"
                  >
                    Security
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <section aria-labelledby="profile-stats" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 id="profile-stats" className="text-sm font-semibold">Your stats</h3>
              <button
                type="button"
                onClick={() => {
                  // refresh all
                  qc.invalidateQueries({ queryKey: ['profile'] });
                }}
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statsQ.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
                ))
              ) : stats ? (
                <>
                  <StatCard label="Tunes applied" value={stats.tunes_applied ?? 0} />
                  <StatCard label="Bikes owned" value={stats.bikes_owned ?? 0} />
                  <StatCard label="Achievements" value={stats.achievements_count ?? 0} />
                  <StatCard label="Miles ridden" value={(stats.miles_ridden ?? miles ?? 0).toLocaleString()} />
                </>
              ) : (
                <>
                  <StatCard label="Tunes applied" value={0} />
                  <StatCard label="Bikes owned" value={0} />
                  <StatCard label="Achievements" value={0} />
                  <StatCard label="Miles ridden" value={0} />
                </>
              )}
            </div>
          </section>

          {/* Achievements */}
          <section aria-labelledby="achievements" className="space-y-3">
            <h3 id="achievements" className="text-sm font-semibold">Achievements</h3>
            {achQ.isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3" aria-live="polite">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : achievements.length ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${earnedPct}%` }}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={earnedPct}
                      role="progressbar"
                      aria-label="Achievements progress"
                    />
                  </div>
                  <span className="text-xs text-white/70">{earnedCount}/{achievements.length}</span>
                </div>
                <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {achievements.map((a) => (
                    <li key={String(a.id)}>
                      <div
                        className={cx(
                          'aspect-square rounded-xl border p-3 flex items-center justify-center text-xl',
                          a.earned ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]'
                        )}
                        title={a.name}
                        aria-label={`${a.name}${a.earned ? ', earned' : ', not yet earned'}`}
                      >
                        {/* Icon placeholder; you can map to SVGs later */}
                        <span aria-hidden>🏆</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-white/80">{a.name}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState title="No achievements yet" subtitle="Apply tunes, ride, and contribute to unlock achievements." />
            )}
          </section>

          {/* Activity */}
          <section aria-labelledby="recent-activity" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 id="recent-activity" className="text-sm font-semibold">Recent activity</h3>
              <div className="flex flex-wrap gap-2">
                {(['all', 'tune_applied', 'tune_purchased', 'account_connected', 'achievement_earned'] as const).map((k) => (
                  <ChipButton
                    key={k}
                    active={activityFilter === k}
                    onClick={() => setActivityFilter(k)}
                    ariaLabel={`Filter ${k}`}
                  >
                    {k === 'all' ? 'All' : k.replace('_', ' ')}
                  </ChipButton>
                ))}
              </div>
            </div>

            {activityQ.isLoading ? (
              <div className="space-y-2" aria-live="polite">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : activity.length ? (
              <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
                {activity.map((e) => (
                  <li key={String(e.id)} className="px-4 py-3 flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs" aria-hidden>
                      {e.type === 'tune_applied' ? '🏍️' :
                       e.type === 'tune_purchased' ? '💳' :
                       e.type === 'account_connected' ? '🔗' :
                       e.type === 'achievement_earned' ? '🏆' : 'ℹ️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90 truncate">{e.title}</p>
                      {e.description ? <p className="text-xs text-white/70 truncate">{e.description}</p> : null}
                    </div>
                    <time className="text-[11px] text-white/60 whitespace-nowrap" dateTime={new Date(e.timestamp).toISOString()}>
                      {timeAgo(e.timestamp)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No recent activity" subtitle="Your tune activity will appear here." />
            )}
          </section>
        </section>

        {/* Right column */}
        <aside aria-labelledby="profile-aside" className="lg:col-span-4 space-y-6">
          <h2 id="profile-aside" className="sr-only">Profile sidebar</h2>

          {/* Account overview */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Account</h3>
            </div>
            <div className="p-4 text-sm">
              <dl className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/60">Email</dt>
                  <dd className="text-white/90 truncate">{user?.email || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/60">Status</dt>
                  <dd className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    user?.email_verified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black'
                  )}>
                    {user?.email_verified ? 'Verified' : 'Verify email'}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex gap-2">
                <Link to="/settings" className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">Settings</Link>
                <Link to="/settings/security" className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">Security</Link>
              </div>
            </div>
          </section>

          {/* Connected services (placeholder) */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Connected services</h3>
            </div>
            <div className="p-4 text-sm space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/80">Supabase</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/80">RevSync Mobile</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">Linked</span>
              </div>
            </div>
          </section>

          {/* Quick links */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Quick links</h3>
            </div>
            <ul className="p-2 text-sm">
              {[
                { to: '/marketplace', label: 'Marketplace' },
                { to: '/dashboard/ai-tunes', label: 'AI Tunes' },
                { to: '/garage', label: 'Garage' },
                { to: '/community', label: 'Community' },
              ].map((x) => (
                <li key={x.to}>
                  <Link className="block rounded-md px-2 py-2 hover:bg-white/[0.06]" to={x.to}>{x.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default ProfilePage;

