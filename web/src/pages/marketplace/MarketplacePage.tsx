import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// Main Marketplace Page - World-class tune discovery and marketplace
// Advanced marketplace with AI recommendations, smart filtering, and premium UX

// ---- Types ----
interface Creator {
  id: string;
  username: string;
  avatar_url?: string;
  is_verified: boolean;
  verification_level: 'UNVERIFIED' | 'VERIFIED' | 'EXPERT' | 'PARTNER';
  reputation_score: number;
  total_tunes: number;
  total_downloads: number;
}

interface TuneCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

interface SafetyRating {
  level: 'SAFE' | 'MODERATE' | 'EXPERT' | 'EXPERIMENTAL';
  score: number;
  description: string;
}

interface TuneListItem {
  id: string;
  name: string;
  short_description: string;
  image_url?: string;
  is_open_source: boolean;
  price?: number;
  currency: string;
  average_rating: number;
  rating_count: number;
  download_count: number;
  category: TuneCategory;
  safety_rating: SafetyRating;
  creator: Creator;
  last_updated: string;
  compatibility: string[];
  performance_gains: {
    hp_gain: number;
    torque_gain: number;
    fuel_economy_change: number;
  };
  tags: string[];
  is_featured: boolean;
  is_trending: boolean;
  ai_recommendation_score?: number;
  ai_recommendation_reason?: string;
}

interface AIRecommendation {
  id: string;
  tune: TuneListItem;
  reason: string;
  confidence: number;
  match_score: number;
  why_recommended: string[];
}

interface MarketplaceFilters {
  category?: string;
  price_range?: [number, number];
  safety_level?: string[];
  compatibility?: string[];
  creator_verified?: boolean;
  is_open_source?: boolean;
  min_rating?: number;
  sort_by?: 'relevance' | 'popular' | 'newest' | 'price_low' | 'price_high' | 'rating';
  search?: string;
}

interface FeaturedCollection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string[];
  tunes: TuneListItem[];
  banner_image?: string;
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

const formatPrice = (price: number, currency: string = 'USD') => {
  if (price === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const getSafetyColor = (level: string) => {
  switch (level) {
    case 'SAFE': return 'text-green-400 bg-green-600/20 border-green-600/30';
    case 'MODERATE': return 'text-yellow-400 bg-yellow-600/20 border-yellow-600/30';
    case 'EXPERT': return 'text-orange-400 bg-orange-600/20 border-orange-600/30';
    case 'EXPERIMENTAL': return 'text-red-400 bg-red-600/20 border-red-600/30';
    default: return 'text-gray-400 bg-gray-600/20 border-gray-600/30';
  }
};

const getVerificationBadge = (level: string) => {
  switch (level) {
    case 'PARTNER': return { icon: '👑', color: 'text-purple-400' };
    case 'EXPERT': return { icon: '🏆', color: 'text-orange-400' };
    case 'VERIFIED': return { icon: '✅', color: 'text-blue-400' };
    default: return null;
  }
};

// ---- Data Hooks ----
const useTuneCategories = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: async (): Promise<TuneCategory[]> => {
      // Mock categories (replace with real API)
      return [
        { id: 'all', name: 'All Categories', slug: 'all', description: 'Browse all tunes', color: '#6B7280', icon: '🏁' },
        { id: 'performance', name: 'Performance', slug: 'performance', description: 'Maximum power gains', color: '#EF4444', icon: '⚡' },
        { id: 'economy', name: 'Economy', slug: 'economy', description: 'Fuel efficiency focused', color: '#10B981', icon: '🌱' },
        { id: 'racing', name: 'Racing', slug: 'racing', description: 'Track-optimized tunes', color: '#F59E0B', icon: '🏆' },
        { id: 'street', name: 'Street', slug: 'street', description: 'Daily driving comfort', color: '#3B82F6', icon: '🛣️' },
        { id: 'custom', name: 'Custom', slug: 'custom', description: 'Specialized modifications', color: '#8B5CF6', icon: '🔧' },
      ];
    },
    staleTime: 600_000, // 10 minutes
  });
};

const useMarketplaceTunes = (filters: MarketplaceFilters) => {
  const authHeaders = useAuthHeaders();
  
  return useInfiniteQuery({
    queryKey: ['marketplace', 'tunes', filters],
    initialPageParam: '1',
    queryFn: async ({ pageParam = '1' }: { pageParam: string }): Promise<{
      results: TuneListItem[];
      next: string | null;
      count: number;
    }> => {
      // Mock comprehensive tune data
      const mockTunes: TuneListItem[] = [
        {
          id: '1',
          name: 'Yamaha R1 Track Pro',
          short_description: 'Professional track-optimized tune with aggressive timing and power delivery for maximum performance.',
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
          is_open_source: false,
          price: 299,
          currency: 'USD',
          average_rating: 4.8,
          rating_count: 147,
          download_count: 2847,
          category: { id: 'racing', name: 'Racing', slug: 'racing', description: 'Track-optimized', color: '#F59E0B', icon: '🏆' },
          safety_rating: { level: 'EXPERT', score: 85.2, description: 'Requires advanced riding skills' },
          creator: {
            id: 'c1',
            username: 'protune_racing',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop',
            is_verified: true,
            verification_level: 'EXPERT',
            reputation_score: 4.9,
            total_tunes: 23,
            total_downloads: 15847,
          },
          last_updated: '2024-02-15T10:30:00Z',
          compatibility: ['Yamaha YZF-R1 2020-2024', 'Yamaha YZF-R1M 2020-2024'],
          performance_gains: { hp_gain: 18.5, torque_gain: 12.3, fuel_economy_change: -8.2 },
          tags: ['track', 'performance', 'aggressive', 'expert'],
          is_featured: true,
          is_trending: true,
          ai_recommendation_score: 0.94,
          ai_recommendation_reason: 'Perfect match for your riding style and bike',
        },
        {
          id: '2',
          name: 'Honda CBR Eco Tune',
          short_description: 'Optimized for fuel economy while maintaining responsive power delivery for daily commuting.',
          image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=300&fit=crop',
          is_open_source: true,
          price: 0,
          currency: 'USD',
          average_rating: 4.3,
          rating_count: 89,
          download_count: 1247,
          category: { id: 'economy', name: 'Economy', slug: 'economy', description: 'Fuel efficient', color: '#10B981', icon: '🌱' },
          safety_rating: { level: 'SAFE', score: 96.8, description: 'Safe for all skill levels' },
          creator: {
            id: 'c2',
            username: 'green_rider',
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
            is_verified: true,
            verification_level: 'VERIFIED',
            reputation_score: 4.2,
            total_tunes: 12,
            total_downloads: 5643,
          },
          last_updated: '2024-02-10T14:45:00Z',
          compatibility: ['Honda CBR1000RR 2017-2024', 'Honda CBR650R 2019-2024'],
          performance_gains: { hp_gain: -2.1, torque_gain: 3.2, fuel_economy_change: 12.5 },
          tags: ['economy', 'daily', 'commute', 'eco'],
          is_featured: false,
          is_trending: false,
        },
        {
          id: '3',
          name: 'Ducati V4 Extreme',
          short_description: 'Unleash the full potential of your Ducati with this race-bred tune for serious track enthusiasts.',
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
          is_open_source: false,
          price: 499,
          currency: 'USD',
          average_rating: 4.9,
          rating_count: 203,
          download_count: 4521,
          category: { id: 'performance', name: 'Performance', slug: 'performance', description: 'Maximum power', color: '#EF4444', icon: '⚡' },
          safety_rating: { level: 'EXPERIMENTAL', score: 72.4, description: 'Professional use only' },
          creator: {
            id: 'c3',
            username: 'ducati_master',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop',
            is_verified: true,
            verification_level: 'PARTNER',
            reputation_score: 4.95,
            total_tunes: 31,
            total_downloads: 28574,
          },
          last_updated: '2024-02-18T09:15:00Z',
          compatibility: ['Ducati Panigale V4 2018-2024', 'Ducati Panigale V4S 2018-2024'],
          performance_gains: { hp_gain: 35.8, torque_gain: 28.1, fuel_economy_change: -15.4 },
          tags: ['extreme', 'ducati', 'v4', 'race'],
          is_featured: true,
          is_trending: true,
          ai_recommendation_score: 0.87,
          ai_recommendation_reason: 'High-performance tune matching your preferences',
        },
      ];

      const currentPage = parseInt(pageParam, 10) || 1;
      return {
        results: mockTunes,
        next: currentPage < 3 ? `page=${currentPage + 1}` : null,
        count: mockTunes.length * 3,
      };
    },
    getNextPageParam: (lastPage: { results: TuneListItem[]; next: string | null; count: number }) => lastPage.next,
    staleTime: 60_000, // 1 minute
    enabled: true,
  });
};

const useAIRecommendations = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['marketplace', 'ai_recommendations'],
    queryFn: async (): Promise<AIRecommendation[]> => {
      // Mock AI recommendations
      return [
        {
          id: 'ai1',
          tune: {
            id: '1',
            name: 'Yamaha R1 Track Pro',
            short_description: 'Professional track-optimized tune',
            is_open_source: false,
            price: 299,
            currency: 'USD',
            average_rating: 4.8,
            rating_count: 147,
            download_count: 2847,
          } as TuneListItem,
          reason: 'Perfect match for your riding style',
          confidence: 0.94,
          match_score: 94,
          why_recommended: [
            'Matches your aggressive riding style',
            'Compatible with your Yamaha R1',
            'High performance gains (+18HP)',
            'Excellent safety rating for experts',
          ],
        },
      ];
    },
    staleTime: 300_000, // 5 minutes
    enabled: !!authHeaders.Authorization,
  });
};

const useFeaturedCollections = () => {
  return useQuery({
    queryKey: ['marketplace', 'featured_collections'],
    queryFn: async (): Promise<FeaturedCollection[]> => {
      return [
        {
          id: '1',
          title: "Editor's Choice",
          subtitle: 'Hand-picked by our experts',
          description: 'Curated selection of the best tunes reviewed by our professional team',
          gradient: ['#3B82F6', '#1D4ED8'],
          tunes: [],
        },
        {
          id: '2',
          title: 'Track Tested',
          subtitle: 'Proven on the circuit',
          description: 'Tunes that have been validated on professional racing circuits',
          gradient: ['#EF4444', '#DC2626'],
          tunes: [],
        },
        {
          id: '3',
          title: 'New Releases',
          subtitle: 'Latest tuning innovations',
          description: 'Fresh tunes from top creators with cutting-edge optimizations',
          gradient: ['#10B981', '#059669'],
          tunes: [],
        },
      ];
    },
    staleTime: 600_000, // 10 minutes
  });
};

// ---- Components ----
const TuneCard: React.FC<{ tune: TuneListItem; onClick?: () => void }> = ({ tune, onClick }) => {
  const verification = getVerificationBadge(tune.creator.verification_level);
  
  return (
    <div 
      className="group relative bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {tune.is_featured && (
          <span className="px-2 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs font-medium rounded-full">
            Featured
          </span>
        )}
        {tune.is_trending && (
          <span className="px-2 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-medium rounded-full">
            🔥 Trending
          </span>
        )}
        {tune.is_open_source && (
          <span className="px-2 py-1 bg-green-600/80 text-white text-xs font-medium rounded-full">
            Open Source
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={tune.image_url || 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop'}
          alt={tune.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <span className={cx(
            'px-3 py-1 rounded-full text-sm font-semibold',
            tune.is_open_source 
              ? 'bg-green-600 text-white' 
              : 'bg-white/90 text-gray-900'
          )}>
            {formatPrice(tune.price || 0, tune.currency)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-white/90 line-clamp-1 group-hover:text-white transition-colors">
            {tune.name}
          </h3>
          <span className={cx(
            'px-2 py-1 rounded text-xs font-medium border ml-2 flex-shrink-0',
            getSafetyColor(tune.safety_rating.level)
          )}>
            {tune.safety_rating.level}
          </span>
        </div>

        {/* Description */}
        <p className="text-white/70 text-sm mb-3 line-clamp-2">{tune.short_description}</p>

        {/* Performance Gains */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-sm font-semibold text-green-400">
              {tune.performance_gains.hp_gain > 0 ? '+' : ''}{tune.performance_gains.hp_gain}HP
            </div>
            <div className="text-xs text-white/60">Power</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-blue-400">
              {tune.performance_gains.torque_gain > 0 ? '+' : ''}{tune.performance_gains.torque_gain}Nm
            </div>
            <div className="text-xs text-white/60">Torque</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-yellow-400">
              {tune.performance_gains.fuel_economy_change > 0 ? '+' : ''}{tune.performance_gains.fuel_economy_change}%
            </div>
            <div className="text-xs text-white/60">Fuel</div>
          </div>
        </div>

        {/* Creator & Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={tune.creator.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop'}
              alt={tune.creator.username}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-white/80 flex items-center gap-1">
              {tune.creator.username}
              {verification && (
                <span className={verification.color}>{verification.icon}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1">
              ⭐ {tune.average_rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              📥 {formatNumber(tune.download_count)}
            </span>
          </div>
        </div>

        {/* AI Recommendation */}
        {tune.ai_recommendation_score && tune.ai_recommendation_score > 0.8 && (
          <div className="mt-3 p-2 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🤖</span>
              <span className="text-sm text-blue-300 font-medium">AI Recommended</span>
              <span className="text-xs text-blue-400">{Math.round(tune.ai_recommendation_score * 100)}% match</span>
            </div>
            {tune.ai_recommendation_reason && (
              <p className="text-xs text-blue-200 mt-1">{tune.ai_recommendation_reason}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryChip: React.FC<{
  category: TuneCategory;
  isActive: boolean;
  onClick: () => void;
}> = ({ category, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cx(
      'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
      isActive
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
    )}
  >
    <span className="text-lg">{category.icon}</span>
    <span>{category.name}</span>
  </button>
);

const FeaturedCollectionCard: React.FC<{ collection: FeaturedCollection }> = ({ collection }) => (
  <div 
    className="relative h-32 rounded-2xl overflow-hidden cursor-pointer group"
    style={{
      background: `linear-gradient(135deg, ${collection.gradient[0]}, ${collection.gradient[1]})`,
    }}
  >
    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
    <div className="relative h-full p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">{collection.title}</h3>
        <p className="text-white/90 text-sm">{collection.subtitle}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/80 text-sm">{collection.description}</span>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState<MarketplaceFilters['sort_by']>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  
  // Data hooks
  const categories = useTuneCategories();
  const featuredCollections = useFeaturedCollections();
  const aiRecommendations = useAIRecommendations();
  
  const filters: MarketplaceFilters = useMemo(() => ({
    search: searchQuery,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    sort_by: sortBy,
  }), [searchQuery, selectedCategory, sortBy]);
  
  const tunes = useMarketplaceTunes(filters);

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadMoreCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && tunes.hasNextPage && !tunes.isFetchingNextPage) {
      tunes.fetchNextPage();
    }
  }, [tunes]);

  useEffect(() => {
    const observer = new IntersectionObserver(loadMoreCallback, {
      threshold: 0.1,
    });
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [loadMoreCallback]);

  useEffect(() => {
    document.title = 'Marketplace • RevSync';
  }, []);

  // Search handling
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId !== 'all') {
      newParams.set('category', categoryId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleTuneClick = useCallback((tune: TuneListItem) => {
    navigate(`/marketplace/tune/${tune.id}`);
  }, [navigate]);

  const allTunes = tunes.data?.pages.flatMap((page: { results: TuneListItem[]; next: string | null; count: number }) => page.results) || [];

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white/90">Marketplace</h1>
                <p className="text-sm text-white/60">Discover safe, compatible tunes for your motorcycle</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/marketplace/library"
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                My Library
              </Link>
              <Link
                to="/marketplace/upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Upload Tune
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search tunes, creators, or motorcycles..."
              className="w-full px-6 py-4 pl-12 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* AI Recommendations */}
        {aiRecommendations.data && aiRecommendations.data.length > 0 && !searchQuery && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤖</span>
                <div>
                  <h2 className="text-xl font-semibold text-white/90">AI Recommendations For You</h2>
                  <p className="text-white/60">Personalized tune suggestions based on your riding style</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiRecommendations.data.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white/90">{rec.tune.name}</h4>
                      <span className="text-sm text-blue-400">{rec.match_score}% match</span>
                    </div>
                    <p className="text-sm text-white/70 mb-3">{rec.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.why_recommended.slice(0, 2).map((reason, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Featured Collections */}
        {featuredCollections.data && !searchQuery && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white/90 mb-4">Featured Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredCollections.data.map((collection) => (
                <FeaturedCollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white/90">Browse Categories</h2>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as MarketplaceFilters['sort_by'])}
                className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance" className="bg-black">Most Relevant</option>
                <option value="popular" className="bg-black">Most Popular</option>
                <option value="newest" className="bg-black">Newest</option>
                <option value="rating" className="bg-black">Highest Rated</option>
                <option value="price_low" className="bg-black">Price: Low to High</option>
                <option value="price_high" className="bg-black">Price: High to Low</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                Filters
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.data?.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isActive={selectedCategory === category.id}
                onClick={() => handleCategoryChange(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white/90">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Tunes'}
            </h2>
            <span className="text-white/60">
              {(tunes.data?.pages[0] as { results: TuneListItem[]; next: string | null; count: number })?.count || 0} tunes found
            </span>
          </div>

          {tunes.isLoading && allTunes.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                  <div className="h-48 bg-white/10 rounded-xl mb-4" />
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : allTunes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allTunes.map((tune) => (
                  <TuneCard
                    key={tune.id}
                    tune={tune}
                    onClick={() => handleTuneClick(tune)}
                  />
                ))}
              </div>

              {/* Load More */}
              <div ref={loadMoreRef} className="mt-8 text-center">
                {tunes.isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white/70">Loading more tunes...</span>
                  </div>
                ) : tunes.hasNextPage ? (
                  <span className="text-white/50">Scroll to load more</span>
                ) : (
                  <span className="text-white/50">You've reached the end</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">No tunes found</h3>
              <p className="text-white/60 mb-6">
                {searchQuery 
                  ? `No tunes match "${searchQuery}". Try adjusting your search or filters.`
                  : 'No tunes available in this category right now.'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketplacePage;
