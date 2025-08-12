import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// World-class web version of AI Tunes (desktop/tablet/mobile responsive)
// Mirrors the mobile flow while embracing web patterns: accessibility, perf, and UX.

// --- Types ---
export type MotorcycleListItem = {
  id: number;
  manufacturer?: { name?: string } | null;
  model_name?: string | null;
  year?: number | null;
  displacement_cc?: number | null;
};

export type AITune = {
  id: string | number;
  name: string;
  category?: string | { name?: string } | null;
  ai_explanation?: string | null;
  ai_analysis?: { safety_level?: string | null } | null;
  safety_level?: string | null;
};

export type AIHistoryItem = {
  id: string | number;
  created_at: string;
  preferences?: { goal?: string | null } | null;
};

// --- Config ---
const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// --- Helpers ---
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

const getSafetyColor = (level?: string) => {
  switch ((level || '').toUpperCase()) {
    case 'SAFE':
      return 'bg-emerald-600';
    case 'MODERATE':
      return 'bg-amber-500';
    case 'EXPERT':
    case 'EXPERT ONLY':
      return 'bg-rose-600';
    case 'EXPERIMENTAL':
      return 'bg-violet-600';
    default:
      return 'bg-slate-500';
  }
};

// Use this to attach auth headers if your AuthContext exposes a token.
// If your AuthContext uses a different shape, update the `getAuthHeaders()` accordingly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useAuthHeaders = (): Record<string, string> => {
  // Lazy import to avoid hard dependency mismatch if the context name differs.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuth } = require('../../contexts/AuthContext');
    const { accessToken } = useAuth?.() ?? {};
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  } catch {
    return {};
  }
};

// --- Data hooks ---
const useGarage = () => {
  const headers = useAuthHeaders();
  return useQuery<{ results: MotorcycleListItem[] }>(
    {
      queryKey: ['garage', 'list'],
      queryFn: async () => {
        const res = await fetch(`${API_BASE}/api/motorcycles?ordering=-year,-max_power_hp&page_size=50`, {
          headers: { 'Content-Type': 'application/json', ...headers },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load garage');
        return res.json();
      },
      staleTime: 60_000,
    }
  );
};

const useMotorcycleDetail = (id?: number) => {
  const headers = useAuthHeaders();
  return useQuery<MotorcycleListItem | undefined>({
    queryKey: ['garage', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return undefined;
      const res = await fetch(`${API_BASE}/api/motorcycles/${id}/`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load motorcycle');
      return res.json();
    },
  });
};

const useAIHistory = () => {
  const headers = useAuthHeaders();
  return useQuery<{ results: AIHistoryItem[] }>(
    {
      queryKey: ['ai', 'tunes', 'history'],
      queryFn: async () => {
        const res = await fetch(`${API_BASE}/api/ai/aitunes/history/`, {
          headers: { 'Content-Type': 'application/json', ...headers },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load AI history');
        return res.json();
      },
      staleTime: 30_000,
    }
  );
};

const useGenerateAITunes = () => {
  const headers = useAuthHeaders();
  return useMutation<{ tunes: AITune[] }, Error, { goal: string; notes?: string; snapshot?: Partial<MotorcycleListItem> | undefined }>(
    {
      mutationFn: async (payload) => {
        const res = await fetch(`${API_BASE}/api/ai/aitunes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          credentials: 'include',
          body: JSON.stringify({
            goal: payload.goal,
            notes: payload.notes ?? '',
            snapshot: payload.snapshot ?? null,
          }),
        });
        if (!res.ok) {
          let msg = 'Failed to generate AI tunes';
          try { const j = await res.json(); msg = j?.detail || msg; } catch {}
          throw new Error(msg);
        }
        return res.json();
      },
    }
  );
};

// --- UI bits ---
const SafetyBadge: React.FC<{ level?: string | null }> = ({ level }) => {
  if (!level) return null;
  const color = getSafetyColor(level);
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white', color)}>
      {String(level).toUpperCase()}
    </span>
  );
};

const TuneCard: React.FC<{ tune: AITune }> = ({ tune }) => {
  const level = tune.ai_analysis?.safety_level || tune.safety_level || undefined;
  const cat = typeof tune.category === 'string' ? tune.category : tune.category?.name;
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-white/90 leading-tight">{tune.name}</h3>
          {cat ? <p className="mt-0.5 text-xs text-white/60">{cat}</p> : null}
        </div>
        <SafetyBadge level={level} />
      </div>
      {tune.ai_explanation ? (
        <p className="mt-3 text-[13px] leading-6 text-white/90">{tune.ai_explanation}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="px-3 py-1.5 text-xs rounded-md border border-white/10 hover:bg-white/[0.07]">View details</button>
        <button type="button" className="px-3 py-1.5 text-xs rounded-md border border-white/10 hover:bg-white/[0.07]">Save</button>
        <button type="button" className="px-3 py-1.5 text-xs rounded-md border border-white/10 hover:bg-white/[0.07]">Download</button>
      </div>
    </article>
  );
};

const HistorySection: React.FC<{ items: AIHistoryItem[] }> = ({ items }) => {
  if (!items?.length) return null;
  return (
    <section aria-labelledby="recent-ai-sessions" className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 id="recent-ai-sessions" className="text-sm font-semibold">Recent AI Sessions</h2>
      </div>
      <ul className="divide-y divide-white/10">
        {items.map((h) => (
          <li key={String(h.id)} className="px-4 py-3 flex items-center justify-between gap-3">
            <time className="text-xs text-white/70" dateTime={new Date(h.created_at).toISOString()}>
              {new Date(h.created_at).toLocaleString()}
            </time>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-sky-700 text-white uppercase tracking-wide">
              {(h.preferences?.goal || 'custom').toString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const BikeRow: React.FC<{ bike: MotorcycleListItem; onSelect: (b: MotorcycleListItem) => void }> = ({ bike, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(bike)}
    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06]"
  >
    <p className="text-sm text-white/90">
      {bike.manufacturer?.name} {bike.model_name} {bike.year ? `(${bike.year})` : ''}
    </p>
  </button>
);

const BikePickerDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect: (b: MotorcycleListItem) => void;
}> = ({ open, onClose, onSelect }) => {
  const { data, isLoading, isError } = useGarage();
  const bikes = data?.results ?? [];
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="bike-picker-title" className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[560px] rounded-t-2xl sm:rounded-2xl bg-[var(--rs-bg,#0b0b0c)] border border-white/10 shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 id="bike-picker-title" className="text-sm font-semibold">Select a Bike</h3>
          <button className="rounded-md px-2 py-1 text-sm border border-white/10 hover:bg-white/[0.07]" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-auto">
          {isLoading && <p className="text-sm text-white/70">Loading your garage…</p>}
          {isError && <p className="text-sm text-rose-400">Unable to load your motorcycles.</p>}
          {!isLoading && !isError && (
            <ul className="space-y-2">
              {bikes.map((b) => (
                <li key={b.id}><BikeRow bike={b} onSelect={(x) => { onSelect(x); onClose(); }} /></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Page ---
const AITunesPage: React.FC = () => {
  const qc = useQueryClient();
  const { data: historyData } = useAIHistory();
  const history = historyData?.results ?? [];

  const [goal, setGoal] = useState('performance');
  const [notes, setNotes] = useState('');
  const [bikeId, setBikeId] = useState<string>('');
  const [selectedBike, setSelectedBike] = useState<MotorcycleListItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: manualBike } = useMotorcycleDetail(bikeId ? parseInt(bikeId, 10) : undefined);

  const snapshot = useMemo(() => {
    const b = selectedBike || manualBike;
    if (!b) return undefined;
    return {
      id: b.id,
      manufacturer: b.manufacturer?.name,
      model_name: b.model_name || undefined,
      year: b.year || undefined,
      displacement_cc: b.displacement_cc || undefined,
    } as Partial<MotorcycleListItem>;
  }, [selectedBike, manualBike]);

  const gen = useGenerateAITunes();

  const onGenerate = async () => {
    await gen.mutateAsync({ goal, notes, snapshot });
    // Optional: refresh history
    qc.invalidateQueries({ queryKey: ['ai', 'tunes', 'history'] });
  };

  useEffect(() => { document.title = 'AI Tunes • RevSync'; }, []);

  const tunes = gen.data?.tunes ?? [];

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Page header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">AI Tunes</h1>
          <p className="ml-2 hidden sm:block text-sm text-white/70">Describe your goal. We’ll generate safe, compatible options.</p>
          <div className="ml-auto text-xs text-white/60">
            <Link className="hover:underline" to="/garage">Garage</Link>
            <span aria-hidden className="mx-1">•</span>
            <Link className="hover:underline" to="/marketplace">Marketplace</Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main id="maincontent" role="main" className="mx-auto max-w-6xl px-4 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form */}
        <section aria-labelledby="ai-form" className="lg:col-span-7 space-y-4">
          <h2 id="ai-form" className="sr-only">Generate AI Tunes</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal" className="block text-xs font-semibold uppercase tracking-wide text-white/70">Tune Goal</label>
                <input
                  id="goal"
                  name="goal"
                  autoComplete="off"
                  placeholder="e.g., performance, economy, smoothness"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-white/70">Bike (optional)</label>
                {selectedBike ? (
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
                    <span className="text-white/90">{selectedBike.manufacturer?.name} {selectedBike.model_name} {selectedBike.year ? `(${selectedBike.year})` : ''}</span>
                    <button type="button" className="rounded-md px-2 py-1 text-xs border border-white/10 hover:bg-white/[0.07]" onClick={() => { setSelectedBike(null); setBikeId(''); }}>Clear</button>
                  </div>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <button type="button" className="rounded-md px-3 py-2 text-sm border border-white/10 hover:bg-white/[0.07]" onClick={() => setPickerOpen(true)}>
                    {selectedBike ? 'Change bike' : 'Choose from Garage'}
                  </button>
                  <div className="flex-1">
                    <label htmlFor="bikeId" className="sr-only">Enter Bike ID</label>
                    <input
                      id="bikeId"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Or enter Bike ID"
                      value={bikeId}
                      onChange={(e) => setBikeId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                {manualBike && !selectedBike ? (
                  <p className="mt-1 text-xs text-white/60">Selected: {manualBike.manufacturer?.name} {manualBike.model_name} {manualBike.year ? `(${manualBike.year})` : ''}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wide text-white/70">Notes (optional)</label>
              <textarea
                id="notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra preferences (fuel, riding style, track use, etc.)"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onGenerate}
                disabled={gen.isPending}
                className={cx('rounded-lg px-4 py-2 text-sm font-semibold text-white', gen.isPending ? 'bg-indigo-700/60 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500')}
                aria-busy={gen.isPending}
                aria-label="Generate AI tunes"
              >
                {gen.isPending ? 'Generating…' : 'Generate AI Tunes'}
              </button>
              {gen.isError ? <p className="text-sm text-rose-400">{gen.error?.message || 'Something went wrong.'}</p> : null}
            </div>
          </div>

          {/* Results */}
          <section aria-labelledby="results" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="results" className="text-sm font-semibold">Results</h2>
              {gen.isSuccess ? <span className="text-xs text-white/60">{tunes.length} tune{tunes.length === 1 ? '' : 's'}</span> : null}
            </div>

            {gen.isPending && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-live="polite">
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} className="h-28 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            )}

            {gen.isSuccess && !tunes.length && (
              <p className="text-sm text-white/70">No tunes yet. Try a different goal or add more notes.</p>
            )}

            {tunes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tunes.map((t) => <TuneCard key={String(t.id)} tune={t} />)}
              </div>
            )}
          </section>
        </section>

        {/* Right: History / Tips */}
        <aside className="lg:col-span-5 space-y-4">
          {history.length ? (
            <HistorySection items={history} />
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-sm font-semibold">How it works</h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-white/80 space-y-1">
                <li>Describe your tuning goal (e.g., performance, economy, smoothness).</li>
                <li>Optionally link a bike from your Garage for better compatibility.</li>
                <li>We generate options with safety levels and explanations.</li>
              </ul>
              <p className="mt-3 text-xs text-white/60">Tip: bigger changes may increase risk; start with conservative tunes and iterate.</p>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold">Safety levels</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-600" /> Safe</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Moderate</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-600" /> Expert Only</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-600" /> Experimental</div>
            </div>
          </section>
        </aside>
      </main>

      {/* Bike picker */}
      <BikePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(b) => { setSelectedBike(b); setBikeId(''); }}
      />
    </div>
  );
};

export default AITunesPage;
