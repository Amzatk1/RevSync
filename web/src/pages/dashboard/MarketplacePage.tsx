import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// Marketplace (web) — world‑class, responsive & accessible
// Mirrors the mobile screen while embracing web patterns:
// - Debounced search, category chips, sort menu
// - Responsive grid with rich cards
// - Infinite scroll via IntersectionObserver (no extra deps)
// - Optional "For You" recommendations if backend supports it
// - A11y-friendly structure & semantics

// ---- Types ----
export type Creator = {
  id: string | number;
  username: string;
  avatar_url?: string | null;
  is_verified?: boolean;
};

export type TuneListItem = {
  id: string;
  name: string;
  short_description: string;
  image_url?: string | null;
  is_open_source: boolean;
  price?: number | null;
  currency?: string | null;
  average_rating?: number | null;
  download_count?: number | null;
  category?: { name: string } | { name?: string } | null;
  safety_rating?: { level?: string | null } | null;
  creator: Creator;
  last_updated?: string | null;
  compatibility?: string[] | null;
};

export type AIRecommendation = {
  id: string;
  name: string;
  description?: string;
  ai_recommendation_reason?: string | null;
};

// ---- Config ----
const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// Attach auth headers if an AuthContext exists (keeps parity with other pages)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ---- Helpers ----
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const fmtCurrency = (n?: number | null, ccy?: string | null) => {
  if (typeof n !== 'number') return '';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD' }).format(n); } catch { return `$${n}`; }
};
const safetyTone = (lvl?: string | null) => {
  switch ((lvl || '').toUpperCase()) {
    case 'LOW':
    case 'SAFE':
      return 'bg-emerald-600';
    case 'MEDIUM':
    case 'MODERATE':
      return 'bg-amber-500';
    case 'HIGH':
    case 'EXPERT':
    case 'EXPERT ONLY':
      return 'bg-rose-600';
    case 'CRITICAL':
    case 'EXPERIMENTAL':
      return 'bg-violet-600';
    default:
      return 'bg-slate-500';
  }
};

// ---- Data (React Query) ----
// Tunes list with server pagination (expects DRF-like `{ results, next }`)
const PAGE_SIZE = 24;
const useTunes = (query: string, category: string, sort: string, filters: string[]) => {
  const headers = useAuthHeaders();
  return useInfiniteQuery<{ results: TuneListItem[]; next: string | null }>(
    {
      queryKey: ['marketplace', 'tunes', { query, category, sort, filters }],
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        // If backend returns absolute `next` URL, just signal another page when present
        if (lastPage?.next) return pages.length + 1;
        // Fallback: stop when fewer than PAGE_SIZE results returned
        const len = lastPage?.results?.length ?? 0;
        return len < PAGE_SIZE ? undefined : pages.length + 1;
      },
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        params.set('page', String(pageParam ?? 1));
        params.set('page_size', String(PAGE_SIZE));
        if (query) params.set('search', query);
        if (category && category !== 'ALL') params.set('category', category);
        if (sort) params.set('ordering', sort);
        // Example filter flags -> backend may ignore unrecognized values gracefully
        if (filters.includes('Open Source')) params.set('open_source', 'true');
        if (filters.includes('Free')) params.set('is_free', 'true');

        const res = await fetch(`${API_BASE}/api/marketplace/tunes/?${params.toString()}`,
          { headers: { 'Content-Type': 'application/json', ...headers }, credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load tunes');
        return res.json();
      },
      staleTime: 60_000,
    }
  );
};

// Optional: personalized recommendations — invisible if endpoint not available
const useRecommendations = () => {
  const headers = useAuthHeaders();
  return useQuery<{ recommendations: AIRecommendation[] }>(
    {
      queryKey: ['marketplace', 'recommendations'],
      queryFn: async () => {
        const res = await fetch(`${API_BASE}/api/ai/recommendations?type=personalized&limit=8`,
          { headers: { 'Content-Type': 'application/json', ...headers }, credentials: 'include' });
        if (!res.ok) throw new Error('');
        return res.json();
      },
      retry: 1,
      staleTime: 30_000,
    }
  );
};

// ---- UI bits ----
const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div>
      <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-white/60">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);

const SafetyBadge: React.FC<{ level?: string | null }> = ({ level }) => {
  if (!level) return null;
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase text-white', safetyTone(level))}>{String(level)}</span>;
};

const TuneCard: React.FC<{ t: TuneListItem }> = ({ t }) => (
  <article className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors overflow-hidden">
    {t.image_url ? (
      <img src={t.image_url} alt="" className="h-40 w-full object-cover" />
    ) : null}
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white/90" title={t.name}>{t.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/70">
            <img src={t.creator?.avatar_url || 'https://via.placeholder.com/20x20'} alt="" className="h-4 w-4 rounded-full object-cover" />
            <span className="truncate" title={t.creator?.username}>{t.creator?.username}</span>
            {t.creator?.is_verified ? <span className="rounded-full bg-emerald-700/70 px-1.5 py-0.5 text-[10px] text-white">Verified</span> : null}
          </p>
        </div>
        <div className="text-right shrink-0">
          {t.is_open_source ? (
            <span className="rounded-md bg-emerald-700/80 px-2 py-0.5 text-[11px] text-white">FREE</span>
          ) : (
            <span className="text-sm font-semibold">{fmtCurrency(t.price ?? undefined, t.currency ?? undefined)}</span>
          )}
        </div>
      </div>
      {t.short_description ? <p className="mt-2 line-clamp-2 text-[13px] text-white/80">{t.short_description}</p> : null}
      <div className="mt-3 flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-4">
          <span title="Downloads">⬇ {t.download_count ?? 0}</span>
          <span title="Rating">⭐ {(t.average_rating ?? 0).toFixed(1)}</span>
        </div>
        <SafetyBadge level={t.safety_rating?.level} />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">View</button>
        <button type="button" className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">Save</button>
        <button type="button" className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">Download</button>
      </div>
    </div>
  </article>
);

// ---- Page ----
const MarketplacePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('ALL');
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<string>(''); // backend: e.g. '-download_count' or '-average_rating' or '-last_updated'

  // Debounce search
  useEffect(() => { const id = setTimeout(() => setDebounced(query.trim()), 300); return () => clearTimeout(id); }, [query]);
  useEffect(() => { document.title = 'Marketplace • RevSync'; }, []);

  // Load tunes
  const tunes = useTunes(debounced, category, sort, filters);
  const pages = tunes.data?.pages ?? [];
  const all = useMemo(() => pages.flatMap((p) => p?.results || []), [pages]);

  // Optional recs
  const recsQ = useRecommendations();
  const recs = recsQ.data?.recommendations || [];

  const categories = useMemo(() => ([
    { key: 'ALL', label: 'All' },
    { key: 'PERFORMANCE', label: 'Performance' },
    { key: 'ECONOMY', label: 'Economy' },
    { key: 'RACING', label: 'Racing' },
    { key: 'STREET', label: 'Street' },
  ]), []);

  const filterOptions = useMemo(() => ['Open Source', 'Free', 'Track', 'Eco'], []);
  const toggleFilter = (f: string) => setFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observe = useCallback((el: HTMLDivElement | null, onHit: () => void) => {
    if (!el) return () => {};
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && onHit()), { root: null, rootMargin: '200px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    return observe(sentinelRef.current, () => {
      if (tunes.hasNextPage && !tunes.isFetching) tunes.fetchNextPage();
    });
  }, [observe, tunes.hasNextPage, tunes.isFetching, tunes.fetchNextPage]);

  // Reset to first page when filters change
  useEffect(() => { 
    // React Query v5 uses reset() instead of remove()
    tunes.refetch(); 
  }, [debounced, category, sort, filters, tunes]);

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">Marketplace</h1>
          <p className="ml-2 hidden sm:block text-sm text-white/70">Discover safe, compatible tunes</p>
          <div className="ml-auto text-xs text-white/60">
            <Link className="hover:underline" to="/community">Community</Link>
            <span aria-hidden className="mx-1">•</span>
            <Link className="hover:underline" to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {/* Search + Sort + Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">Search tunes</label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <span aria-hidden>🔎</span>
              <input id="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tunes…" className="w-full bg-transparent text-sm text-white/90 placeholder-white/40 focus:outline-none" />
            </div>
          </div>
          <div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <label htmlFor="sort" className="text-xs text-white/70">Sort by</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1 w-full bg-transparent text-sm focus:outline-none">
                <option value="">Relevance</option>
                <option value="-download_count">Most downloads</option>
                <option value="-average_rating">Highest rating</option>
                <option value="-last_updated">Recently updated</option>
                <option value="price">Lowest price</option>
                <option value="-price">Highest price</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {filterOptions.map((f) => {
                const sel = filters.includes(f);
                return (
                  <button key={f} type="button" onClick={() => toggleFilter(f)} className={cx('rounded-full border px-3 py-1 text-xs', sel ? 'border-indigo-300 bg-indigo-600/30' : 'border-white/10 hover:bg-white/5')} aria-pressed={sel}>{f}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4 flex w-full gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key)} className={cx('shrink-0 rounded-full border px-3 py-1 text-xs', category === c.key ? 'border-indigo-300 bg-indigo-600/30' : 'border-white/10 hover:bg-white/5')} aria-pressed={category === c.key}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Featured */}
        <div className="mt-6">
          <SectionHeader title="Featured" subtitle="Hand‑picked collections" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[{t:'Editor\'s Choice',s:'By RevSync editors'},{t:'Track Tested',s:'Proven on the circuit'},{t:'New Releases',s:'Latest tuning innovations'}].map((x, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600 to-indigo-800 px-5 py-6">
                <p className="text-sm font-semibold">{x.t}</p>
                <p className="text-xs text-white/90">{x.s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* For You (optional) */}
        {recs.length > 0 && (
          <div className="mt-6">
            <SectionHeader title="For You" subtitle="Personalized suggestions" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recs.map((r) => (
                <article key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="text-sm font-semibold">{r.name}</h3>
                  <p className="mt-1 text-xs text-white/70 line-clamp-2">{r.ai_recommendation_reason || r.description || 'Recommended for your bikes & preferences.'}</p>
                  <div className="mt-3"><button className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">View</button></div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-6">
          <SectionHeader title="All Tunes" subtitle={`${all.length} result${all.length === 1 ? '' : 's'}`} />
          {tunes.isLoading && !all.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-live="polite">
              {Array.from({ length: 9 }).map((_, i) => (<div key={i} className="h-44 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />))}
            </div>
          ) : all.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {all.map((t) => (<TuneCard key={t.id} t={t} />))}
              </div>
              {/* infinite-scroll sentinel */}
              <div ref={sentinelRef} className="h-8" aria-hidden />
              {tunes.isFetchingNextPage ? (
                <div className="mt-4 text-center text-xs text-white/70">Loading more…</div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-white/70">No results. Try a different search or filters.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;
