// World‑class, responsive web Garage page (mirrors mobile UI with richer web UX)
// cSpell:words ECU
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// --- Config ---
const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// --- Helpers ---
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
const fmtRelative = (iso?: string | null) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(sec) < 60) return rtf.format(-sec, 'second');
  if (Math.abs(min) < 60) return rtf.format(-min, 'minute');
  if (Math.abs(hr) < 24) return rtf.format(-hr, 'hour');
  return rtf.format(-day, 'day');
};
const batteryIcon = (pct?: number | null) => {
  if (pct == null) return '🔋';
  if (pct >= 90) return '🔋';
  if (pct >= 70) return '🟩';
  if (pct >= 40) return '🟨';
  if (pct >= 15) return '🟧';
  return '🟥';
};

// Use this to attach auth headers if AuthContext exposes a token (shared with other pages)
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

// --- Types ---
export type Motorcycle = {
  id: number | string;
  make: string;
  model: string;
  year: number;
  image_url?: string | null;
  ecu_type: string;
  connection_protocol?: string | null;
  last_flash_date?: string | null;
  current_tune: string;
  connection_status: 'connected' | 'disconnected' | 'never_connected' | string;
  battery_level?: number | null;
  last_connected?: string | null;
  vin?: string | null;
  mileage_km?: number | null;
};

// --- Data hooks ---
const useGarageList = () => {
  const headers = useAuthHeaders();
  return useQuery<{ results: Motorcycle[] }>({
    queryKey: ['garage', 'list'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/motorcycles?ordering=-last_connected`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load garage');
      return res.json();
    },
    staleTime: 60_000,
  });
};

const useFlashTune = () => {
  const headers = useAuthHeaders();
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, { id: number | string }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`${API_BASE}/api/motorcycles/${id}/flash/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({ action: 'flash' }),
      });
      if (!res.ok) {
        let msg = 'Flashing failed';
        try { const j = await res.json(); msg = j?.detail || msg; } catch {}
        throw new Error(msg);
      }
      return { ok: true } as const;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['garage', 'list'] }),
  });
};

// --- UI Bits ---
const StatusDot: React.FC<{ status: Motorcycle['connection_status'] }> = ({ status }) => {
  const map: Record<string, string> = {
    connected: 'bg-emerald-500',
    disconnected: 'bg-amber-500',
    never_connected: 'bg-slate-500',
  };
  return <span className={cx('inline-block h-2.5 w-2.5 rounded-full', map[status] || 'bg-slate-500')} />;
};

const CardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 animate-pulse">
    <div className="flex gap-4">
      <div className="h-20 w-28 rounded-lg bg-white/[0.06]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
        <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
        <div className="h-3 w-1/4 rounded bg-white/[0.06]" />
      </div>
    </div>
  </div>
);

const EmptyGarage: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/[0.02]">
    <div className="text-5xl">🛠️</div>
    <h3 className="mt-3 text-lg font-semibold">Your garage is empty</h3>
    <p className="mt-1 text-sm text-white/70">Add your first motorcycle to start tuning and tracking performance.</p>
    <button onClick={onAdd} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">
      <span>＋</span> Add your first bike
    </button>
  </div>
);

const BikeCard: React.FC<{
  bike: Motorcycle;
  onOpen: (b: Motorcycle) => void;
  onFlash: (b: Motorcycle) => void;
}> = ({ bike, onOpen, onFlash }) => (
  <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors">
    <div className="flex gap-4">
      <div className="h-20 w-28 rounded-lg overflow-hidden bg-white/[0.06] shrink-0">
        {bike.image_url ? (
          <img src={bike.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-white/40">🏍️</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm sm:text-base font-semibold text-white/90 truncate">{bike.make} {bike.model}</h3>
        <p className="mt-0.5 text-xs text-white/70">{bike.year} • {bike.ecu_type}</p>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <StatusDot status={bike.connection_status} />
          <span className="text-white/80">{bike.connection_status === 'connected' ? 'Connected' : bike.connection_status === 'disconnected' ? 'Disconnected' : 'Never connected'}</span>
          {typeof bike.battery_level === 'number' && (
            <>
              <span aria-hidden>•</span>
              <span title="Battery level" className="text-white/70">{batteryIcon(bike.battery_level)} {bike.battery_level}%</span>
            </>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
          <span className="font-semibold text-white/80">{bike.current_tune}</span>
          {bike.last_connected ? <><span aria-hidden>•</span><span>Last seen {fmtRelative(bike.last_connected)}</span></> : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => onOpen(bike)} className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">Details</button>
          <button type="button" onClick={() => onFlash(bike)} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-500">Flash</button>
          <Link to={`/garage/${bike.id}`} className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/[0.07]">Settings</Link>
        </div>
      </div>
    </div>
  </article>
);

// Accessible detail dialog (WAI-ARIA: role="dialog" + aria-modal)
// Note: focus trapping can be added with a reusable hook; minimal version here.
const DetailDialog: React.FC<{
  open: boolean;
  bike?: Motorcycle | null;
  onClose: () => void;
  onFlash: (b: Motorcycle) => void;
}> = ({ open, bike, onClose, onFlash }) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (!open || !bike) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="bike-title" className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[640px] rounded-t-2xl sm:rounded-2xl bg-[var(--rs-bg,#0b0b0c)] border border-white/10 shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 id="bike-title" className="text-base font-semibold">{bike.make} {bike.model}</h3>
            <p className="text-xs text-white/70">{bike.year} • {bike.ecu_type}</p>
          </div>
          <button ref={closeBtnRef} className="rounded-md px-2 py-1 text-sm border border-white/10 hover:bg-white/[0.07]" onClick={onClose}>Close</button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-sm font-semibold">Connection</h4>
            <div className="mt-2 space-y-1 text-sm text-white/80">
              <div className="flex items-center gap-2"><StatusDot status={bike.connection_status} /><span>{bike.connection_status}</span></div>
              <div>Last connected: <span className="text-white/70">{fmtRelative(bike.last_connected || undefined)}</span></div>
              {typeof bike.battery_level === 'number' && (
                <div>Battery: <span className="text-white/70">{batteryIcon(bike.battery_level)} {bike.battery_level}%</span></div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-sm font-semibold">ECU / Tune</h4>
            <div className="mt-2 space-y-1 text-sm text-white/80">
              <div>ECU: <span className="text-white/70">{bike.ecu_type}</span></div>
              <div>Current tune: <span className="text-white/70">{bike.current_tune}</span></div>
              <div>Last flash: <span className="text-white/70">{bike.last_flash_date ? new Date(bike.last_flash_date).toLocaleString() : 'Never'}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
            <h4 className="text-sm font-semibold">Identifiers</h4>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div><div className="text-white/60">VIN</div><div className="text-white/80">{bike.vin || '—'}</div></div>
              <div><div className="text-white/60">Mileage</div><div className="text-white/80">{bike.mileage_km ? `${bike.mileage_km.toLocaleString()} km` : '—'}</div></div>
              <div><div className="text-white/60">Protocol</div><div className="text-white/80">{bike.connection_protocol || '—'}</div></div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => onFlash(bike)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">Flash tune</button>
          <Link to={`/garage/${bike.id}`} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/[0.07]">Settings</Link>
        </div>
      </div>
    </div>
  );
};

// --- Page ---
const GaragePage: React.FC = () => {
  const [selected, setSelected] = useState<Motorcycle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'never_connected'>('all');
  const [sort, setSort] = useState<'last_connected' | 'year_desc' | 'year_asc'>('last_connected');

  const listQ = useGarageList();
  const flashMut = useFlashTune();

  useEffect(() => { document.title = 'Garage • RevSync'; }, []);

  const bikes = listQ.data?.results ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = bikes.filter(b => {
      const inStatus = statusFilter === 'all' ? true : b.connection_status === statusFilter;
      const inQuery = !q || `${b.make} ${b.model} ${b.year} ${b.ecu_type}`.toLowerCase().includes(q);
      return inStatus && inQuery;
    });
    if (sort === 'last_connected') {
      out = out.sort((a, b) => (new Date(b.last_connected || 0).getTime() - new Date(a.last_connected || 0).getTime()));
    } else if (sort === 'year_desc') {
      out = out.sort((a, b) => b.year - a.year);
    } else if (sort === 'year_asc') {
      out = out.sort((a, b) => a.year - b.year);
    }
    return out;
  }, [bikes, search, statusFilter, sort]);

  const stats = useMemo(() => {
    const tuned = bikes.filter(b => b.current_tune && b.current_tune.toLowerCase() !== 'stock ecu').length;
    const connected = bikes.filter(b => b.connection_status === 'connected').length;
    const backedUp = bikes.filter(b => !!b.last_flash_date).length;
    return [
      { label: 'Tuned', value: tuned, color: 'text-indigo-400', icon: '⚡' },
      { label: 'Connected', value: connected, color: 'text-emerald-400', icon: '📶' },
      { label: 'Backed Up', value: backedUp, color: 'text-sky-400', icon: '🛡️' },
    ];
  }, [bikes]);

  const openDetails = (b: Motorcycle) => { setSelected(b); setDialogOpen(true); };
  const onFlash = async (b: Motorcycle) => {
    await flashMut.mutateAsync({ id: b.id });
    alert('Tune flash initiated for ' + b.make + ' ' + b.model);
  };

  const onAddBike = () => {
    alert('Navigate to Add Motorcycle flow');
  };

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">My Garage</h1>
          <p className="ml-2 hidden sm:block text-sm text-white/70">Manage motorcycles, flash tunes, view connection status</p>
          <div className="ml-auto text-xs text-white/60">
            <Link className="hover:underline" to="/dashboard">Dashboard</Link>
            <span aria-hidden className="mx-1">•</span>
            <Link className="hover:underline" to="/marketplace">Marketplace</Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {/* Hero row */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your Motorcycles</h2>
            <p className="text-sm text-white/70">{bikes.length} {bikes.length === 1 ? 'motorcycle' : 'motorcycles'}</p>
          </div>
          <button type="button" onClick={onAddBike} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold hover:bg-indigo-500">
            <span>＋</span> Add bike
          </button>
        </div>

        {/* Toolbar */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
            <span aria-hidden>🔎</span>
            <input
              aria-label="Search motorcycles"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model, ECU…"
              className="w-full bg-transparent text-sm text-white/90 placeholder-white/40 focus:outline-none"
            />
          </label>

          <select
            aria-label="Filter by connection status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
            <option value="never_connected">Never connected</option>
          </select>

          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
          >
            <option value="last_connected">Last seen (desc)</option>
            <option value="year_desc">Year (newest)</option>
            <option value="year_asc">Year (oldest)</option>
          </select>
        </div>

        {/* Stats */}
        <section className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <div className="text-2xl" aria-hidden>{s.icon}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
              <div className={cx('mt-1 text-sm', s.color)}>{s.label}</div>
            </div>
          ))}
        </section>

        {/* Content */}
        <section className="mt-6">
          {listQ.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : listQ.isError ? (
            <div className="rounded-2xl border border-white/10 bg-rose-900/30 p-4">
              <p className="text-sm text-rose-200">Failed to load garage.</p>
              <button onClick={() => listQ.refetch()} className="mt-2 rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyGarage onAdd={onAddBike} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((b) => (
                <BikeCard key={String(b.id)} bike={b} onOpen={openDetails} onFlash={onFlash} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Details dialog */}
      <DetailDialog open={dialogOpen} bike={selected} onClose={() => setDialogOpen(false)} onFlash={onFlash} />
    </div>
  );
};

export default GaragePage;

