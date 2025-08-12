
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

// Community (web) — world‑class, responsive & accessible
// Mirrors mobile (Creators / Tunes / Upload) with web‑first upgrades:
// - APG-compliant tabs and keyboard nav
// - Responsive grid, richer cards, stats strip
// - Debounced search + filter chips + sort menus
// - Infinite scroll via IntersectionObserver (no extra deps)
// - Supabase-backed data identical to mobile views

// ---- Types ----
interface Creator {
  id: string;
  username: string;
  avatar_url?: string;
  is_verified: boolean;
  total_downloads: number;
  tune_count: number;
  rating_average: number;
  specialties: string[];
  bio: string;
  joined_date: string;
}

interface CommunityTune {
  id: string;
  name: string;
  description: string;
  creator: Creator;
  download_count: number;
  rating_average: number;
  review_count: number;
  tags: string[];
  is_free: boolean;
  is_open_source: boolean;
  compatibility: string[];
  last_updated: string;
  image_url?: string;
}

// ---- Supabase client (reuse shared client if present; fall back to env) ----
let supabase: SupabaseClient | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('../../services/supabaseClient');
  supabase = (m && (m.supabase || m.default)) as SupabaseClient | null;
} catch {}
if (!supabase) {
  const url = (process.env.REACT_APP_SUPABASE_URL || '').trim();
  const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
  if (url && key) supabase = createClient(url, key);
}

// ---- Helpers ----
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const formatJoinDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

const PAGE_SIZE = 12;

// ---- Data hooks (React Query) ----
const useCreators = (query: string, filters: string[], sort: 'downloads'|'rating'|'newest', page: number) =>
  useQuery({
    queryKey: ['community','creators',{ query, filters, sort, page }],
    enabled: !!supabase,
    queryFn: async (): Promise<Creator[]> => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      let q = supabase
        .from('creators_view')
        .select('id,username,avatar_url,is_verified,total_downloads,tune_count,rating_average,specialties,bio,joined_date')
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      // Sort
      if (sort === 'downloads') {
        q = q.order('total_downloads', { ascending: false });
      }
      if (sort === 'rating') {
        q = q.order('rating_average', { ascending: false });
      }
      if (sort === 'newest') {
        q = q.order('joined_date', { ascending: false });
      }

      // Search + filters
      if (query) {
        q = q.ilike('username', `%${query}%`);
      }
      if (filters.includes('Verified Creator')) {
        q = q.eq('is_verified', true);
      }
      if (filters.includes('Sport Bikes')) {
        q = q.contains('specialties', ['Sport']);
      }
      if (filters.includes('Eco')) {
        q = q.or('specialties.cs.{Eco},specialties.cs.{Emissions}');
      }

      const { data, error } = await q;
      if (error) {
        throw error;
      }
      return (data || []) as Creator[];
    },
    staleTime: 60_000,
  });

const useTunes = (query: string, filters: string[], sort: 'downloads'|'rating'|'updated', page: number) =>
  useQuery({
    queryKey: ['community','tunes',{ query, filters, sort, page }],
    enabled: !!supabase,
    queryFn: async (): Promise<CommunityTune[]> => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      let q = supabase
        .from('community_tunes_view')
        .select(`id,name,description,download_count,rating_average,review_count,tags,is_free,is_open_source,compatibility,last_updated,image_url,creator:creator_id ( id,username,avatar_url,is_verified,tune_count,total_downloads,rating_average,specialties,bio,joined_date )`)
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      // Sort
      if (sort === 'downloads') {
        q = q.order('download_count', { ascending: false });
      }
      if (sort === 'rating') {
        q = q.order('rating_average', { ascending: false });
      }
      if (sort === 'updated') {
        q = q.order('last_updated', { ascending: false });
      }

      // Search + filters
      if (query) {
        q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }
      if (filters.includes('Free')) {
        q = q.eq('is_free', true);
      }
      if (filters.includes('Track')) {
        q = q.contains('tags', ['Track']);
      }
      if (filters.includes('Open Source')) {
        q = q.eq('is_open_source', true);
      }

      const { data, error } = await q;
      if (error) {
        throw error;
      }
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        creator: Array.isArray(item.creator) ? item.creator[0] : item.creator
      })) as CommunityTune[];
      
      return transformedData;
    },
    staleTime: 60_000,
  });

// Mutations: follow creator / save tune
const useFollowCreator = () =>
  useMutation({
    mutationFn: async (creatorId: string) => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      const { error } = await supabase.from('follows').insert({ creator_id: creatorId });
      if (error) {
        throw error;
      }
      return true;
    },
  });

const useSaveTune = () =>
  useMutation({
    mutationFn: async (tuneId: string) => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      const { error } = await supabase.from('saved_tunes').insert({ tune_id: tuneId });
      if (error) {
        throw error;
      }
      return true;
    },
  });

// ---- Tabs ----
const TABS = [
  { key: 'creators', label: 'Creators' },
  { key: 'tunes', label: 'Open Source' },
  { key: 'upload', label: 'Upload' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ---- Components ----
const StatChip: React.FC<{ label: string; value: string | number; title?: string }> = ({ label, value, title }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center" title={title}>
    <p className="text-xs text-white/60">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

const CreatorCard: React.FC<{ c: Creator; onFollow: (id: string) => void; following?: boolean }> = ({ c, onFollow, following }) => (
  <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors">
    <div className="flex items-start gap-4">
      <img src={c.avatar_url || 'https://via.placeholder.com/60x60'} alt="" className="h-14 w-14 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-white/90 truncate" title={c.username}>{c.username}</h3>
          {c.is_verified && <span className="inline-flex items-center rounded-full bg-emerald-700/70 px-2 py-0.5 text-[11px] text-white" title="Verified creator">Verified</span>}
        </div>
        {c.bio ? <p className="mt-1 text-xs sm:text-sm text-white/70 line-clamp-2">{c.bio}</p> : null}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <StatChip label="Tunes" value={c.tune_count} />
          <StatChip label="Downloads" value={`${(c.total_downloads/1000).toFixed(1)}K`} />
          <StatChip label="Rating" value={c.rating_average.toFixed(1)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.specialties.slice(0, 4).map((s, i) => (
            <span key={i} className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px]">{s}</span>
          ))}
          {c.specialties.length > 4 && <span className="text-[11px] text-white/60">+{c.specialties.length - 4} more</span>}
        </div>
        <p className="mt-3 text-[11px] text-white/50">Member since {formatJoinDate(c.joined_date)}</p>
      </div>
      <div className="shrink-0">
        <button type="button" onClick={() => onFollow(c.id)} className={cx('rounded-md border px-3 py-1.5 text-xs font-semibold', following ? 'border-emerald-400/40 bg-emerald-700/20 text-emerald-200' : 'border-white/10 hover:bg-white/[0.07]')}>{following ? 'Following' : 'Follow'}</button>
      </div>
    </div>
  </article>
);

const TuneCard: React.FC<{ t: CommunityTune; onSave: (id: string) => void }> = ({ t, onSave }) => (
  <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors">
    <div className="flex items-start gap-4">
      <img src={t.image_url || 'https://via.placeholder.com/120x90'} alt="" className="h-20 w-28 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-white/90 truncate" title={t.name}>{t.name}</h3>
          <div className="flex gap-1">
            {t.is_open_source && <span className="inline-flex items-center rounded-md bg-sky-700/80 px-2 py-0.5 text-[11px] text-white">Open</span>}
            {t.is_free && <span className="inline-flex items-center rounded-md bg-emerald-700/80 px-2 py-0.5 text-[11px] text-white">Free</span>}
          </div>
        </div>
        {t.description ? <p className="mt-1 text-xs sm:text-sm text-white/70 line-clamp-2">{t.description}</p> : null}
        <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
          <img src={t.creator.avatar_url || 'https://via.placeholder.com/20x20'} alt="" className="h-5 w-5 rounded-full object-cover" />
          <span>{t.creator.username}</span>
          {t.creator.is_verified && <span className="rounded-full bg-emerald-700/70 px-1.5 py-0.5 text-[10px] text-white">Verified</span>}
          <span aria-hidden>•</span>
          <span>Updated {new Date(t.last_updated).toLocaleDateString()}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {t.compatibility?.slice(0, 4).map((c, i) => (
            <span key={i} className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px]" title="Compatible with">{c}</span>
          ))}
          {t.compatibility && t.compatibility.length > 4 && <span className="text-[11px] text-white/60">+{t.compatibility.length - 4} more</span>}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-4">
            <span title="Downloads">⬇ {t.download_count}</span>
            <span title="Rating">⭐ {t.rating_average.toFixed(1)} ({t.review_count})</span>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-md border border-white/10 px-3 py-1.5 hover:bg-white/[0.07] text-xs">View</button>
            <button type="button" onClick={() => onSave(t.id)} className="rounded-md border border-white/10 px-3 py-1.5 hover:bg-white/[0.07] text-xs">Save</button>
            <button type="button" className="rounded-md border border-white/10 px-3 py-1.5 hover:bg-white/[0.07] text-xs">Download</button>
          </div>
        </div>
      </div>
    </div>
  </article>
);

// ---- Page ----
const CommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('creators');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [sortCreators, setSortCreators] = useState<'downloads'|'rating'|'newest'>('downloads');
  const [sortTunes, setSortTunes] = useState<'downloads'|'rating'|'updated'>('downloads');
  const [pageCreators, setPageCreators] = useState(0);
  const [pageTunes, setPageTunes] = useState(0);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // Load data
  const creatorsQ = useCreators(debounced, filters, sortCreators, pageCreators);
  const tunesQ = useTunes(debounced, filters, sortTunes, pageTunes);

  const followMut = useFollowCreator();
  const saveMut = useSaveTune();

  useEffect(() => { document.title = 'Community • RevSync'; }, []);

  // Reset pagination when searching/filtering/sorting
  useEffect(() => { setPageCreators(0); }, [debounced, filters, sortCreators]);
  useEffect(() => { setPageTunes(0); }, [debounced, filters, sortTunes]);

  const filterOptions = useMemo(() => ['Open Source', 'Free', 'Verified Creator', 'Sport Bikes', 'Eco', 'Track'], []);
  const toggleFilter = (f: string) => setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  // Tabs keyboard nav (APG manual activation)
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDownTabs = (e: React.KeyboardEvent) => {
    const idx = TABS.findIndex((t) => t.key === activeTab);
    if (e.key === 'ArrowRight') { const next = (idx + 1) % TABS.length; tabsRef.current[next]?.focus(); setActiveTab(TABS[next].key); }
    if (e.key === 'ArrowLeft') { const prev = (idx - 1 + TABS.length) % TABS.length; tabsRef.current[prev]?.focus(); setActiveTab(TABS[prev].key); }
  };

  // Infinite scroll sentinels
  const creatorsSentinelRef = useRef<HTMLDivElement | null>(null);
  const tunesSentinelRef = useRef<HTMLDivElement | null>(null);

  const observe = useCallback((el: HTMLDivElement | null, onHit: () => void) => {
    if (!el) return () => {};
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) onHit(); });
    }, { root: null, rootMargin: '200px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // creators
    if (activeTab !== 'creators') return;
    return observe(creatorsSentinelRef.current, () => {
      const data = creatorsQ.data || [];
      if (!creatorsQ.isFetching && data.length >= PAGE_SIZE * (pageCreators + 1)) {
        setPageCreators((p) => p + 1);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, creatorsQ.isFetching, creatorsQ.data, pageCreators, observe]);

  useEffect(() => {
    // tunes
    if (activeTab !== 'tunes') return;
    return observe(tunesSentinelRef.current, () => {
      const data = tunesQ.data || [];
      if (!tunesQ.isFetching && data.length >= PAGE_SIZE * (pageTunes + 1)) {
        setPageTunes((p) => p + 1);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tunesQ.isFetching, tunesQ.data, pageTunes, observe]);

  const onFollow = (id: string) => {
    setFollowingIds((s) => new Set(s).add(id));
    followMut.mutate(id, { onError: () => setFollowingIds((s) => { const n = new Set(s); n.delete(id); return n; }) });
  };

  const onSave = (id: string) => { saveMut.mutate(id); };

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">Community</h1>
          <p className="ml-2 hidden sm:block text-sm text-white/70">Creators, open‑source tunes & collaboration</p>
          <div className="ml-auto text-xs text-white/60">
            <Link className="hover:underline" to="/marketplace">Marketplace</Link>
            <span aria-hidden className="mx-1">•</span>
            <Link className="hover:underline" to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main id="maincontent" role="main" className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {/* Tabs (ARIA APG) */}
        <div role="tablist" aria-label="Community sections" className="rounded-xl border border-white/10 bg-white/[0.03] p-1 flex flex-wrap">
          {TABS.map((t, i) => {
            const selected = activeTab === t.key;
            return (
              <button
                key={t.key}
                ref={(el) => {
                  tabsRef.current[i] = el;
                }}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${t.key}`}
                id={`tab-${t.key}`}
                tabIndex={selected ? 0 : -1}
                onKeyDown={onKeyDownTabs}
                onClick={() => setActiveTab(t.key)}
                className={cx('m-1 rounded-lg px-3 py-1.5 text-sm border', selected ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/5')}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filters (hidden on Upload) */}
        {activeTab !== 'upload' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <span aria-hidden>🔎</span>
                <input id="search" className="w-full bg-transparent text-sm text-white/90 placeholder-white/40 focus:outline-none" placeholder={`Search ${activeTab}…`} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="md:col-span-1">
              {/* Sort */}
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <label htmlFor="sort" className="text-xs text-white/70">Sort by</label>
                {activeTab === 'creators' ? (
                  <select id="sort" className="mt-1 w-full bg-transparent text-sm focus:outline-none" value={sortCreators} onChange={(e) => setSortCreators(e.target.value as any)}>
                    <option value="downloads">Most downloads</option>
                    <option value="rating">Highest rating</option>
                    <option value="newest">Newest</option>
                  </select>
                ) : (
                  <select id="sort" className="mt-1 w-full bg-transparent text-sm focus:outline-none" value={sortTunes} onChange={(e) => setSortTunes(e.target.value as any)}>
                    <option value="downloads">Most downloads</option>
                    <option value="rating">Highest rating</option>
                    <option value="updated">Recently updated</option>
                  </select>
                )}
              </div>
            </div>
            <div className="md:col-span-1 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {filterOptions.map((f) => {
                  const sel = filters.includes(f);
                  return (
                    <button key={f} type="button" onClick={() => toggleFilter(f)} className={cx('rounded-full border px-3 py-1 text-xs', sel ? 'border-indigo-300 bg-indigo-600/30' : 'border-white/10 hover:bg-white/5')} aria-pressed={sel}>
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Panels */}
        <section role="tabpanel" id="panel-creators" aria-labelledby="tab-creators" hidden={activeTab !== 'creators'} className="mt-6">
          {creatorsQ.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-36 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />))}
            </div>
          ) : creatorsQ.isError ? (
            <p className="text-sm text-rose-400" role="alert">Failed to load creators.</p>
          ) : (creatorsQ.data || []).length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(creatorsQ.data || []).map((c: Creator) => (
                  <CreatorCard key={c.id} c={c} onFollow={onFollow} following={followingIds.has(c.id)} />
                ))}
              </div>
              <div ref={creatorsSentinelRef} className="h-8" aria-hidden />
            </>
          ) : (
            <p className="text-sm text-white/70">No creators found. Try adjusting filters or search.</p>
          )}
        </section>

        <section role="tabpanel" id="panel-tunes" aria-labelledby="tab-tunes" hidden={activeTab !== 'tunes'} className="mt-6">
          {tunesQ.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-36 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />))}
            </div>
          ) : tunesQ.isError ? (
            <p className="text-sm text-rose-400" role="alert">Failed to load tunes.</p>
          ) : (tunesQ.data || []).length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(tunesQ.data || []).map((t: CommunityTune) => (
                  <TuneCard key={t.id} t={t} onSave={onSave} />
                ))}
              </div>
              <div ref={tunesSentinelRef} className="h-8" aria-hidden />
            </>
          ) : (
            <p className="text-sm text-white/70">No tunes found. Try adjusting filters or search.</p>
          )}
        </section>

        <section role="tabpanel" id="panel-upload" aria-labelledby="tab-upload" hidden={activeTab !== 'upload'} className="mt-6">
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-8">
              <h2 className="text-xl font-bold">Share Your Tune</h2>
              <p className="mt-1 text-sm text-white/90">Contribute to the community and earn from your expertise.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{n:1,t:'Prepare Your Tune',d:'Test thoroughly, document changes, and gather dyno data if available.'},{n:2,t:'Upload & Describe',d:'Add tune file, compatibility info, pricing, and detailed description.'},{n:3,t:'Safety Review',d:'We review for safety compliance and compatibility accuracy.'},{n:4,t:'Go Live & Earn',d:'Once approved, start earning 70% revenue share from sales.'}].map((s)=> (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-sm font-bold">{s.n}</div>
                  <div>
                    <p className="text-sm font-semibold">{s.t}</p>
                    <p className="text-sm text-white/70">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">
                <span>＋</span>
                Start Upload Process
              </button>
            </div>
            <div className="border-t border-white/10 p-6">
              <h3 className="text-sm font-semibold">Creator Benefits</h3>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <li className="flex items-center gap-2">💸 70% revenue share on all sales</li>
                <li className="flex items-center gap-2">🏆 Featured creator opportunities</li>
                <li className="flex items-center gap-2">👥 Build community following</li>
                <li className="flex items-center gap-2">🛡️ Safety validation & support</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CommunityPage;
