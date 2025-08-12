import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Advanced Search Page - Professional search interface with comprehensive filters
// Enhanced web version with smart filters, saved searches, and query builders

// ---- Types ----
interface AdvancedSearchFilters {
  // Content filters
  query: string;
  contentType: string[];
  category: string[];
  tags: string[];
  
  // Price & rating filters
  priceMin: number;
  priceMax: number;
  freeOnly: boolean;
  minRating: number;
  
  // Date filters
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  customDateFrom?: string;
  customDateTo?: string;
  
  // Motorcycle specific
  makeModel: string;
  yearFrom?: number;
  yearTo?: number;
  displacement: string;
  
  // Creator filters
  verifiedOnly: boolean;
  creatorName: string;
  
  // Advanced
  sortBy: string;
  resultsPerPage: number;
  includeDescriptions: boolean;
  exactMatch: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: AdvancedSearchFilters;
  created_at: string;
  result_count?: number;
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

// ---- Data Hooks ----
const useSavedSearches = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['search', 'saved'],
    queryFn: async (): Promise<SavedSearch[]> => {
      // Mock saved searches (replace with real API)
      return [
        {
          id: '1',
          name: 'Track Day Tunes',
          filters: {
            query: 'track',
            contentType: ['tune'],
            category: ['Performance', 'Racing'],
            tags: ['track', 'racing'],
            priceMin: 0,
            priceMax: 200,
            freeOnly: false,
            minRating: 4.5,
            dateRange: 'month',
            makeModel: '',
            displacement: '',
            verifiedOnly: true,
            creatorName: '',
            sortBy: 'rating',
            resultsPerPage: 20,
            includeDescriptions: true,
            exactMatch: false,
          },
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          result_count: 42,
        },
        {
          id: '2',
          name: 'Yamaha R1 Resources',
          filters: {
            query: 'Yamaha R1',
            contentType: ['tune', 'motorcycle', 'community'],
            category: [],
            tags: [],
            priceMin: 0,
            priceMax: 1000,
            freeOnly: false,
            minRating: 0,
            dateRange: 'all',
            makeModel: 'Yamaha R1',
            displacement: '998cc',
            verifiedOnly: false,
            creatorName: '',
            sortBy: 'relevance',
            resultsPerPage: 50,
            includeDescriptions: true,
            exactMatch: false,
          },
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          result_count: 156,
        },
      ];
    },
    staleTime: 60_000,
    enabled: !!authHeaders.Authorization,
  });
};

// ---- Component ----
const AdvancedSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const savedSearches = useSavedSearches();

  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: searchParams.get('q') || '',
    contentType: [],
    category: [],
    tags: [],
    priceMin: 0,
    priceMax: 1000,
    freeOnly: false,
    minRating: 0,
    dateRange: 'all',
    makeModel: '',
    displacement: '',
    verifiedOnly: false,
    creatorName: '',
    sortBy: 'relevance',
    resultsPerPage: 20,
    includeDescriptions: true,
    exactMatch: false,
  });

  const [activeSection, setActiveSection] = useState<string>('content');

  useEffect(() => {
    document.title = 'Advanced Search • RevSync';
  }, []);

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'contentType' | 'category' | 'tags', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const handleSearch = () => {
    const searchQuery = new URLSearchParams();
    
    if (filters.query.trim()) {
      searchQuery.set('q', filters.query.trim());
    }
    
    // Add other filters as URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'query' && value !== null && value !== undefined && value !== '' && value !== 0 && value !== false) {
        if (Array.isArray(value) && value.length > 0) {
          searchQuery.set(key, value.join(','));
        } else if (!Array.isArray(value) && value !== 'all') {
          searchQuery.set(key, String(value));
        }
      }
    });

    navigate(`/search?${searchQuery.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      contentType: [],
      category: [],
      tags: [],
      priceMin: 0,
      priceMax: 1000,
      freeOnly: false,
      minRating: 0,
      dateRange: 'all',
      makeModel: '',
      displacement: '',
      verifiedOnly: false,
      creatorName: '',
      sortBy: 'relevance',
      resultsPerPage: 20,
      includeDescriptions: true,
      exactMatch: false,
    });
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
  };

  const contentTypes = [
    { key: 'tune', label: 'Tunes', icon: '🔧' },
    { key: 'motorcycle', label: 'Motorcycles', icon: '🏍️' },
    { key: 'creator', label: 'Creators', icon: '👤' },
    { key: 'community', label: 'Community', icon: '💬' },
  ];

  const categories = [
    'Performance', 'Economy', 'Racing', 'Street', 'Track', 'Professional', 
    'Discussion', 'Superbike', 'Sportbike', 'Naked', 'Cruiser', 'Touring'
  ];

  const popularTags = [
    'track', 'racing', 'street', 'performance', 'economy', 'daily', 'weekend',
    'professional', 'beginner', 'advanced', 'dyno-tested', 'safe', 'aggressive'
  ];

  const displacements = [
    '50-125cc', '126-250cc', '251-400cc', '401-600cc', '601-750cc', 
    '751-1000cc', '1000cc+', 'Electric'
  ];

  const sortOptions = [
    { key: 'relevance', label: 'Most Relevant' },
    { key: 'rating', label: 'Highest Rated' },
    { key: 'downloads', label: 'Most Downloaded' },
    { key: 'newest', label: 'Newest First' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'price_low', label: 'Price: Low to High' },
    { key: 'price_high', label: 'Price: High to Low' },
  ];

  const sections = [
    { key: 'content', label: 'Content', icon: '📄' },
    { key: 'pricing', label: 'Pricing & Rating', icon: '💰' },
    { key: 'dates', label: 'Date Range', icon: '📅' },
    { key: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
    { key: 'creator', label: 'Creator', icon: '👤' },
    { key: 'advanced', label: 'Advanced', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white/90">Advanced Search</h1>
                <p className="text-sm text-white/60">Find exactly what you're looking for</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Section Navigation */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white/90 mb-4">Filter Categories</h3>
              <div className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={cx(
                      'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3',
                      activeSection === section.key
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Searches */}
            {savedSearches.data && savedSearches.data.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white/90 mb-4">Saved Searches</h3>
                <div className="space-y-2">
                  {savedSearches.data.map(savedSearch => (
                    <button
                      key={savedSearch.id}
                      onClick={() => loadSavedSearch(savedSearch)}
                      className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="font-medium text-white/90 mb-1">{savedSearch.name}</div>
                      <div className="text-xs text-white/60">
                        {savedSearch.result_count} results • {new Date(savedSearch.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Filters */}
          <div className="lg:col-span-3">
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8">
              
              {/* Search Query */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-white/90 mb-4">Search Query</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    placeholder="Enter keywords, tune names, motorcycle models..."
                    className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-4 top-3.5">
                    <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={filters.exactMatch}
                      onChange={(e) => handleFilterChange('exactMatch', e.target.checked)}
                      className="rounded"
                    />
                    Exact match
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={filters.includeDescriptions}
                      onChange={(e) => handleFilterChange('includeDescriptions', e.target.checked)}
                      className="rounded"
                    />
                    Search descriptions
                  </label>
                </div>
              </div>

              {/* Dynamic Section Content */}
              {activeSection === 'content' && (
                <div className="space-y-6">
                  {/* Content Type */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Content Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {contentTypes.map(type => (
                        <button
                          key={type.key}
                          onClick={() => toggleArrayFilter('contentType', type.key)}
                          className={cx(
                            'p-3 rounded-lg border transition-colors flex items-center gap-2',
                            filters.contentType.includes(type.key)
                              ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                              : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                          )}
                        >
                          <span>{type.icon}</span>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => toggleArrayFilter('category', category)}
                          className={cx(
                            'px-3 py-1 rounded-full text-sm transition-colors',
                            filters.category.includes(category)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          )}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Popular Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleArrayFilter('tags', tag)}
                          className={cx(
                            'px-3 py-1 rounded-full text-sm transition-colors',
                            filters.tags.includes(tag)
                              ? 'bg-green-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          )}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'pricing' && (
                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Price Range</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Min Price</label>
                        <input
                          type="number"
                          value={filters.priceMin}
                          onChange={(e) => handleFilterChange('priceMin', parseFloat(e.target.value) || 0)}
                          min="0"
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Max Price</label>
                        <input
                          type="number"
                          value={filters.priceMax}
                          onChange={(e) => handleFilterChange('priceMax', parseFloat(e.target.value) || 1000)}
                          min="0"
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={filters.freeOnly}
                        onChange={(e) => handleFilterChange('freeOnly', e.target.checked)}
                        className="rounded"
                      />
                      Free content only
                    </label>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Minimum Rating</label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 4.5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleFilterChange('minRating', rating)}
                          className={cx(
                            'px-3 py-2 rounded-lg transition-colors flex items-center gap-1',
                            filters.minRating === rating
                              ? 'bg-yellow-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          )}
                        >
                          <span>⭐</span>
                          {rating}+
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'dates' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Date Range</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      {[
                        { key: 'all', label: 'All Time' },
                        { key: 'today', label: 'Today' },
                        { key: 'week', label: 'This Week' },
                        { key: 'month', label: 'This Month' },
                        { key: 'year', label: 'This Year' },
                      ].map(option => (
                        <button
                          key={option.key}
                          onClick={() => handleFilterChange('dateRange', option.key)}
                          className={cx(
                            'p-3 rounded-lg border transition-colors',
                            filters.dateRange === option.key
                              ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                              : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'motorcycle' && (
                <div className="space-y-6">
                  {/* Make/Model */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Make & Model</label>
                    <input
                      type="text"
                      value={filters.makeModel}
                      onChange={(e) => handleFilterChange('makeModel', e.target.value)}
                      placeholder="e.g., Yamaha R1, Honda CBR, Ducati Panigale"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Year Range */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Year Range</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">From</label>
                        <input
                          type="number"
                          value={filters.yearFrom || ''}
                          onChange={(e) => handleFilterChange('yearFrom', e.target.value ? parseInt(e.target.value) : undefined)}
                          min="1900"
                          max={new Date().getFullYear()}
                          placeholder="2020"
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-2">To</label>
                        <input
                          type="number"
                          value={filters.yearTo || ''}
                          onChange={(e) => handleFilterChange('yearTo', e.target.value ? parseInt(e.target.value) : undefined)}
                          min="1900"
                          max={new Date().getFullYear()}
                          placeholder="2024"
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Engine Displacement */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Engine Displacement</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {displacements.map(displacement => (
                        <button
                          key={displacement}
                          onClick={() => handleFilterChange('displacement', filters.displacement === displacement ? '' : displacement)}
                          className={cx(
                            'p-3 rounded-lg border transition-colors text-sm',
                            filters.displacement === displacement
                              ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                              : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                          )}
                        >
                          {displacement}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'creator' && (
                <div className="space-y-6">
                  {/* Creator Name */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Creator Name</label>
                    <input
                      type="text"
                      value={filters.creatorName}
                      onChange={(e) => handleFilterChange('creatorName', e.target.value)}
                      placeholder="Search by creator username or display name"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Verified Only */}
                  <div>
                    <label className="flex items-center gap-3 text-white/80">
                      <input
                        type="checkbox"
                        checked={filters.verifiedOnly}
                        onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-transparent border-white/20 rounded focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium">Verified creators only</div>
                        <div className="text-sm text-white/60">Show content from verified professional tuners</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeSection === 'advanced' && (
                <div className="space-y-6">
                  {/* Sort By */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Sort Results By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sortOptions.map(option => (
                        <option key={option.key} value={option.key} className="bg-black">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Results Per Page */}
                  <div>
                    <label className="block text-lg font-semibold text-white/90 mb-4">Results Per Page</label>
                    <div className="flex gap-3">
                      {[10, 20, 50, 100].map(count => (
                        <button
                          key={count}
                          onClick={() => handleFilterChange('resultsPerPage', count)}
                          className={cx(
                            'px-4 py-2 rounded-lg transition-colors',
                            filters.resultsPerPage === count
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          )}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                <div className="text-sm text-white/60">
                  Filters will be applied to your search results
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Apply Filters & Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvancedSearchPage;