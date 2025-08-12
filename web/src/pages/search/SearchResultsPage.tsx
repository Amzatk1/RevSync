import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Search Results Page - Comprehensive global search with intelligent filtering
// Enhanced web version with advanced search, real-time suggestions, and rich results

// ---- Types ----
interface SearchResult {
  id: string;
  type: 'tune' | 'motorcycle' | 'creator' | 'community';
  title: string;
  subtitle: string;
  description?: string;
  image_url?: string;
  rating?: number;
  download_count?: number;
  price?: number;
  category?: string;
  tags?: string[];
  url: string;
  relevance_score?: number;
}

interface SearchFilters {
  type: string[];
  category: string[];
  priceRange: [number, number];
  rating: number;
  sortBy: string;
}

interface SearchStats {
  total_results: number;
  tunes: number;
  motorcycles: number;
  creators: number;
  community_posts: number;
  search_time_ms: number;
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

const getSafetyColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'SAFE': return 'text-green-400';
    case 'CAUTION': return 'text-yellow-400';
    case 'AGGRESSIVE': return 'text-orange-400';
    case 'EXTREME': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const formatPrice = (price?: number) => {
  if (typeof price !== 'number') return 'Free';
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
};

// ---- Data Hooks ----
const useGlobalSearch = (query: string, filters: SearchFilters) => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['search', 'global', query, filters],
    queryFn: async (): Promise<{ results: SearchResult[]; stats: SearchStats }> => {
      if (!query.trim()) {
        return { results: [], stats: { total_results: 0, tunes: 0, motorcycles: 0, creators: 0, community_posts: 0, search_time_ms: 0 } };
      }

      const startTime = Date.now();

      // Simulate comprehensive search results (replace with real API calls)
      const mockResults: SearchResult[] = [
        // Tunes
        {
          id: '1',
          type: 'tune',
          title: 'Stage 2 Performance Tune',
          subtitle: 'Yamaha R1 2023',
          description: 'Professional ECU mapping for maximum performance gains while maintaining reliability.',
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
          rating: 4.8,
          download_count: 1250,
          price: 89.99,
          category: 'Performance',
          tags: ['track', 'power', 'professional'],
          url: '/marketplace/tunes/1',
          relevance_score: 0.95,
        },
        {
          id: '2',
          type: 'tune',
          title: 'Eco-Friendly Street Tune',
          subtitle: 'Honda CBR1000RR 2022',
          description: 'Optimized for fuel efficiency without sacrificing street performance.',
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
          rating: 4.6,
          download_count: 890,
          price: 0,
          category: 'Economy',
          tags: ['street', 'economy', 'daily'],
          url: '/marketplace/tunes/2',
          relevance_score: 0.87,
        },
        // Motorcycles
        {
          id: '3',
          type: 'motorcycle',
          title: 'Yamaha YZF-R1',
          subtitle: '2023 • 998cc • 200HP',
          description: 'Track-bred superbike with MotoGP-derived technology and advanced electronics.',
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
          rating: 4.9,
          category: 'Superbike',
          tags: ['track', 'racing', 'flagship'],
          url: '/bikes/3',
          relevance_score: 0.92,
        },
        // Creators
        {
          id: '4',
          type: 'creator',
          title: 'ProTune Racing',
          subtitle: 'Verified Creator • 45 Tunes',
          description: 'Professional motorcycle tuning specialists with 10+ years of racing experience.',
          image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop',
          rating: 4.9,
          download_count: 15000,
          category: 'Professional',
          tags: ['verified', 'racing', 'professional'],
          url: '/community/creators/4',
          relevance_score: 0.85,
        },
        // Community
        {
          id: '5',
          type: 'community',
          title: 'Track Day Setup Guide',
          subtitle: 'Community Discussion • 127 replies',
          description: 'Complete guide to preparing your bike for track days, from suspension to electronics.',
          rating: 4.7,
          category: 'Discussion',
          tags: ['track', 'guide', 'community'],
          url: '/community/posts/5',
          relevance_score: 0.78,
        },
      ];

      // Filter results based on criteria
      let filteredResults = mockResults.filter(result => {
        if (filters.type.length > 0 && !filters.type.includes(result.type)) return false;
        if (filters.category.length > 0 && !filters.category.includes(result.category || '')) return false;
        if (result.price && (result.price < filters.priceRange[0] || result.price > filters.priceRange[1])) return false;
        if (result.rating && result.rating < filters.rating) return false;
        return true;
      });

      // Sort results
      switch (filters.sortBy) {
        case 'relevance':
          filteredResults.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
          break;
        case 'rating':
          filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'downloads':
          filteredResults.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
          break;
        case 'price_low':
          filteredResults.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price_high':
          filteredResults.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        default:
          break;
      }

      const stats: SearchStats = {
        total_results: filteredResults.length,
        tunes: filteredResults.filter(r => r.type === 'tune').length,
        motorcycles: filteredResults.filter(r => r.type === 'motorcycle').length,
        creators: filteredResults.filter(r => r.type === 'creator').length,
        community_posts: filteredResults.filter(r => r.type === 'community').length,
        search_time_ms: Date.now() - startTime,
      };

      return { results: filteredResults, stats };
    },
    staleTime: 30_000,
    enabled: query.trim().length > 0,
  });
};

// ---- Components ----
const ResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const getTypeIcon = () => {
    switch (result.type) {
      case 'tune': return '🔧';
      case 'motorcycle': return '🏍️';
      case 'creator': return '👤';
      case 'community': return '💬';
      default: return '📄';
    }
  };

  const getTypeColor = () => {
    switch (result.type) {
      case 'tune': return 'bg-blue-600/20 text-blue-300';
      case 'motorcycle': return 'bg-green-600/20 text-green-300';
      case 'creator': return 'bg-purple-600/20 text-purple-300';
      case 'community': return 'bg-orange-600/20 text-orange-300';
      default: return 'bg-gray-600/20 text-gray-300';
    }
  };

  return (
    <Link
      to={result.url}
      className="block p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200 hover:scale-[1.02] hover:border-blue-500/30"
    >
      <div className="flex gap-4">
        {/* Image */}
        {result.image_url && (
          <div className="flex-shrink-0">
            <img
              src={result.image_url}
              alt={result.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={cx(
                'px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1',
                getTypeColor()
              )}>
                <span>{getTypeIcon()}</span>
                {result.type}
              </span>
              {result.category && (
                <span className="px-2 py-1 bg-white/10 text-white/70 rounded-md text-xs">
                  {result.category}
                </span>
              )}
            </div>
            {result.price !== undefined && (
              <span className="text-sm font-semibold text-green-400">
                {formatPrice(result.price)}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-white/90 mb-1 truncate">
            {result.title}
          </h3>
          <p className="text-sm text-white/60 mb-2">{result.subtitle}</p>
          
          {result.description && (
            <p className="text-sm text-white/70 mb-3 line-clamp-2">
              {result.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-white/60">
            {result.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">⭐</span>
                <span>{result.rating.toFixed(1)}</span>
              </div>
            )}
            {result.download_count && (
              <div className="flex items-center gap-1">
                <span>📥</span>
                <span>{result.download_count.toLocaleString()}</span>
              </div>
            )}
            {result.relevance_score && (
              <div className="flex items-center gap-1">
                <span>🎯</span>
                <span>{Math.round(result.relevance_score * 100)}% match</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white/5 text-white/60 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cx(
      'px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
      active
        ? 'bg-blue-600 text-white'
        : 'bg-white/10 text-white/70 hover:bg-white/20'
    )}
  >
    {label}
  </button>
);

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    category: [],
    priceRange: [0, 1000],
    rating: 0,
    sortBy: 'relevance',
  });

  const searchResults = useGlobalSearch(query, filters);

  useEffect(() => {
    document.title = query ? `"${query}" - Search Results • RevSync` : 'Search • RevSync';
  }, [query]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      setSearchParams({ q: newQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const toggleFilter = (type: keyof SearchFilters, value: string) => {
    if (type === 'type' || type === 'category') {
      setFilters(prev => ({
        ...prev,
        [type]: prev[type].includes(value)
          ? prev[type].filter(item => item !== value)
          : [...prev[type], value]
      }));
    }
  };

  const typeFilters = [
    { key: 'tune', label: 'Tunes', icon: '🔧' },
    { key: 'motorcycle', label: 'Motorcycles', icon: '🏍️' },
    { key: 'creator', label: 'Creators', icon: '👤' },
    { key: 'community', label: 'Community', icon: '💬' },
  ];

  const categoryFilters = [
    'Performance', 'Economy', 'Racing', 'Street', 'Track', 'Professional', 'Discussion'
  ];

  const sortOptions = [
    { key: 'relevance', label: 'Most Relevant' },
    { key: 'rating', label: 'Highest Rated' },
    { key: 'downloads', label: 'Most Downloaded' },
    { key: 'price_low', label: 'Price: Low to High' },
    { key: 'price_high', label: 'Price: High to Low' },
  ];

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search tunes, motorcycles, creators, and community..."
                  className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-4 top-3.5">
                  <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {query && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-3 p-1 text-white/50 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <Link
              to="/search/advanced"
              className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
            >
              Advanced
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {query ? (
          <>
            {/* Search Stats */}
            {searchResults.data && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white/90">
                      Search results for "{query}"
                    </h1>
                    <p className="text-white/60 mt-1">
                      {searchResults.data.stats.total_results.toLocaleString()} results found in {searchResults.data.stats.search_time_ms}ms
                    </p>
                  </div>

                  {/* Sort Options */}
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.key} value={option.key} className="bg-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Result Type Stats */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {typeFilters.map(type => {
                    const count = searchResults.data.stats[type.key as keyof SearchStats] || 0;
                    return (
                      <FilterChip
                        key={type.key}
                        label={`${type.icon} ${type.label} (${count})`}
                        active={filters.type.includes(type.key)}
                        onClick={() => toggleFilter('type', type.key)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/80 mb-3">Filter by category:</h3>
              <div className="flex flex-wrap gap-2">
                {categoryFilters.map(category => (
                  <FilterChip
                    key={category}
                    label={category}
                    active={filters.category.includes(category)}
                    onClick={() => toggleFilter('category', category)}
                  />
                ))}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : searchResults.data?.results.length ? (
              <div className="space-y-4">
                {searchResults.data.results.map(result => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white/90 mb-2">No results found</h3>
                <p className="text-white/60 mb-6">
                  Try adjusting your search terms or filters
                </p>
                <Link
                  to="/search/advanced"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Advanced Search
                </Link>
              </div>
            )}
          </>
        ) : (
          /* No Search Query - Show Popular/Recent */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold text-white/90 mb-4">Search RevSync</h1>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto">
              Discover thousands of motorcycle tunes, find your perfect bike, connect with creators, and join the community discussions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {typeFilters.map(type => (
                <button
                  key={type.key}
                  onClick={() => toggleFilter('type', type.key)}
                  className="p-6 border border-white/20 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <div className="font-semibold text-white/90">{type.label}</div>
                  <div className="text-sm text-white/60 mt-1">Search for {type.label.toLowerCase()}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResultsPage;
