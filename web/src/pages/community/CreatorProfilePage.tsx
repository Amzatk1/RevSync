import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Creator Profile - World-class creator showcase with detailed portfolio
// Enhanced web version with comprehensive stats, achievements, and social features

interface CreatorProfile {
  id: string;
  username: string;
  avatar_url?: string;
  banner_url?: string;
  is_verified: boolean;
  bio: string;
  location?: string;
  website?: string;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
  joined_date: string;
  last_active: string;
  stats: {
    total_downloads: number;
    tune_count: number;
    rating_average: number;
    review_count: number;
    follower_count: number;
    following_count: number;
    total_revenue?: number;
    monthly_downloads: number;
  };
  specialties: string[];
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    earned_date: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    max_progress: number;
    unlocked: boolean;
    icon: string;
  }>;
}

interface CreatorTune {
  id: string;
  name: string;
  description: string;
  download_count: number;
  rating_average: number;
  review_count: number;
  tags: string[];
  is_free: boolean;
  is_open_source: boolean;
  compatibility: string[];
  last_updated: string;
  image_url?: string;
  price?: number;
  version: string;
}

interface Review {
  id: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  rating: number;
  comment: string;
  created_at: string;
  tune: {
    id: string;
    name: string;
  };
}

// Mock data for development
const mockCreator: CreatorProfile = {
  id: 'creator1',
  username: 'SpeedDemon92',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  banner_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&h=400&fit=crop',
  is_verified: true,
  bio: 'Professional motorcycle tuner with 15+ years of experience. Specializing in high-performance street and track tunes for Japanese sportbikes. Multiple track day wins and dyno-proven results.',
  location: 'Los Angeles, CA',
  website: 'https://speeddemon-tuning.com',
  social_links: {
    twitter: 'https://twitter.com/speeddemon92',
    instagram: 'https://instagram.com/speeddemon_tuning',
    youtube: 'https://youtube.com/@speeddemontunes',
  },
  joined_date: '2020-03-15T00:00:00Z',
  last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  stats: {
    total_downloads: 45230,
    tune_count: 127,
    rating_average: 4.8,
    review_count: 1580,
    follower_count: 3420,
    following_count: 245,
    total_revenue: 28500,
    monthly_downloads: 2850,
  },
  specialties: ['Sport Bikes', 'Track Performance', 'Dyno Tuning', 'Yamaha R1', 'Honda CBR', 'Kawasaki ZX'],
  badges: [
    {
      id: '1',
      name: 'Verified Creator',
      description: 'Official verified tuning professional',
      icon: '✓',
      color: 'bg-blue-600',
      earned_date: '2020-04-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Top Performer',
      description: 'Consistently high-rated tunes',
      icon: '🏆',
      color: 'bg-yellow-600',
      earned_date: '2021-08-15T00:00:00Z',
    },
    {
      id: '3',
      name: 'Community Favorite',
      description: 'Loved by the RevSync community',
      icon: '❤️',
      color: 'bg-red-600',
      earned_date: '2022-02-20T00:00:00Z',
    },
  ],
  achievements: [
    {
      id: '1',
      title: 'Download Milestone',
      description: 'Reach 50,000 total downloads',
      progress: 45230,
      max_progress: 50000,
      unlocked: false,
      icon: '📥',
    },
    {
      id: '2',
      title: 'Quality Assurance',
      description: 'Maintain 4.5+ average rating',
      progress: 48,
      max_progress: 45,
      unlocked: true,
      icon: '⭐',
    },
    {
      id: '3',
      title: 'Prolific Creator',
      description: 'Upload 100+ tunes',
      progress: 127,
      max_progress: 100,
      unlocked: true,
      icon: '📤',
    },
  ],
};

const mockTunes: CreatorTune[] = [
  {
    id: '1',
    name: 'R1 Stage 3 Track Special',
    description: 'Track-focused tune with aggressive mapping for maximum power and throttle response.',
    download_count: 2150,
    rating_average: 4.9,
    review_count: 89,
    tags: ['Track', 'Performance', 'R1'],
    is_free: false,
    is_open_source: false,
    compatibility: ['2020-2023 Yamaha R1'],
    last_updated: '2024-01-15T00:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
    price: 49.99,
    version: '2.1',
  },
  {
    id: '2',
    name: 'CBR Street Performance',
    description: 'Balanced street tune with improved fuel economy and smooth power delivery.',
    download_count: 1820,
    rating_average: 4.7,
    review_count: 65,
    tags: ['Street', 'Economy', 'CBR'],
    is_free: true,
    is_open_source: true,
    compatibility: ['2019-2023 Honda CBR1000RR'],
    last_updated: '2024-01-10T00:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1588384357007-ecc4ad00356b?w=400&h=300&fit=crop',
    price: 0,
    version: '1.5',
  },
];

const mockReviews: Review[] = [
  {
    id: '1',
    user: {
      id: 'user1',
      username: 'TrackRider23',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    rating: 5,
    comment: 'Incredible tune! The throttle response is amazing and the power delivery is so smooth. Worth every penny.',
    created_at: '2024-01-20T00:00:00Z',
    tune: {
      id: '1',
      name: 'R1 Stage 3 Track Special',
    },
  },
  {
    id: '2',
    user: {
      id: 'user2',
      username: 'BikeEnthusiast',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    rating: 5,
    comment: 'SpeedDemon really knows what he\'s doing. This tune transformed my bike completely!',
    created_at: '2024-01-18T00:00:00Z',
    tune: {
      id: '2',
      name: 'CBR Street Performance',
    },
  },
];

const CreatorProfilePage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tunes' | 'reviews' | 'about'>('tunes');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    document.title = `${mockCreator.username} • RevSync`;
  }, []);

  // In a real app, these would be actual API calls
  const creatorQuery = useQuery({
    queryKey: ['creator', creatorId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockCreator;
    },
    enabled: !!creatorId,
  });

  const tunesQuery = useQuery({
    queryKey: ['creator', creatorId, 'tunes'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTunes;
    },
    enabled: !!creatorId,
  });

  const reviewsQuery = useQuery({
    queryKey: ['creator', creatorId, 'reviews'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockReviews;
    },
    enabled: !!creatorId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    });
  };

  const formatLastActive = (dateString: string) => {
    const now = new Date();
    const time = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `Active ${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Active ${diffInDays}d ago`;
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // In a real app, this would make an API call
  };

  const handleMessage = () => {
    // In a real app, this would open a message dialog
    console.log('Message creator');
  };

  if (creatorQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
        <div className="animate-pulse">
          <div className="h-64 bg-white/5" />
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex gap-8">
              <div className="w-32 h-32 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-white/10 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (creatorQuery.isError || !creatorQuery.data) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-white/90 mb-2">Creator Not Found</h1>
          <p className="text-white/60 mb-4">The creator you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/community')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Creators
          </button>
        </div>
      </div>
    );
  }

  const creator = creatorQuery.data;

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Banner */}
      <div 
        className="h-64 bg-gradient-to-r from-blue-600/20 to-purple-600/20 relative"
        style={{
          backgroundImage: creator.banner_url ? `url(${creator.banner_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-black/50 backdrop-blur text-white rounded-lg hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="mx-auto max-w-6xl px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Avatar */}
          <div className="relative">
            <img
              src={creator.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'}
              alt={creator.username}
              className="w-32 h-32 rounded-full border-4 border-white/20 object-cover"
            />
            {creator.is_verified && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-black">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white/90 mb-2">{creator.username}</h1>
                <p className="text-white/70 mb-3">{creator.bio}</p>
                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  {creator.location && (
                    <span className="flex items-center gap-1">
                      <span>📍</span> {creator.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>📅</span> Joined {formatDate(creator.joined_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    {formatLastActive(creator.last_active)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Message
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white/90">{creator.stats.tune_count}</div>
                <div className="text-xs text-white/60">Tunes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white/90">{creator.stats.total_downloads.toLocaleString()}</div>
                <div className="text-xs text-white/60">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white/90">{creator.stats.follower_count.toLocaleString()}</div>
                <div className="text-xs text-white/60">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white/90">{creator.stats.rating_average.toFixed(1)}</div>
                <div className="text-xs text-white/60">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white/90">{creator.stats.monthly_downloads.toLocaleString()}</div>
                <div className="text-xs text-white/60">Monthly</div>
              </div>
            </div>

            {/* Social Links */}
            {Object.keys(creator.social_links).length > 0 && (
              <div className="flex gap-3">
                {creator.website && (
                  <a
                    href={creator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-white/20 text-white/70 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                  >
                    🌐
                  </a>
                )}
                {creator.social_links.twitter && (
                  <a
                    href={creator.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-white/20 text-white/70 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                  >
                    🐦
                  </a>
                )}
                {creator.social_links.instagram && (
                  <a
                    href={creator.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-white/20 text-white/70 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                  >
                    📷
                  </a>
                )}
                {creator.social_links.youtube && (
                  <a
                    href={creator.social_links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-white/20 text-white/70 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                  >
                    📹
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-8">
          {creator.specialties.map((specialty) => (
            <span
              key={specialty}
              className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm"
            >
              {specialty}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 mb-8">
          <div className="flex gap-8">
            {[
              { key: 'tunes', label: 'Tunes', count: creator.stats.tune_count },
              { key: 'reviews', label: 'Reviews', count: creator.stats.review_count },
              { key: 'about', label: 'About' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 text-sm opacity-70">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {/* Tunes Tab */}
          {activeTab === 'tunes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tunesQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 rounded-xl border border-white/10 bg-white/[0.03] animate-pulse" />
                ))
              ) : tunesQuery.data?.map((tune) => (
                <article key={tune.id} className="rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors overflow-hidden">
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative">
                    {tune.image_url ? (
                      <img
                        src={tune.image_url}
                        alt={tune.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-50">🔧</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {tune.is_free && (
                        <span className="px-2 py-1 bg-green-600 text-white rounded-md text-xs font-medium">
                          Free
                        </span>
                      )}
                      {tune.is_open_source && (
                        <span className="px-2 py-1 bg-blue-600 text-white rounded-md text-xs font-medium">
                          Open Source
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-md">
                      <span className="text-yellow-400 text-sm">⭐</span>
                      <span className="text-white text-sm font-medium">{tune.rating_average.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-white/90 mb-2">{tune.name}</h3>
                    <p className="text-sm text-white/70 line-clamp-2 mb-3">{tune.description}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tune.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-white/10 text-white/80 rounded-md text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                      <span>{tune.download_count} downloads</span>
                      <span>v{tune.version}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to={`/marketplace/tune/${tune.id}`}
                        className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                      >
                        View Details
                      </Link>
                      {tune.price && tune.price > 0 ? (
                        <span className="py-2 px-3 text-green-400 font-semibold text-sm">
                          ${tune.price}
                        </span>
                      ) : (
                        <span className="py-2 px-3 text-green-400 font-semibold text-sm">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviewsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-white/10 rounded w-1/3" />
                        <div className="h-3 bg-white/5 rounded w-full" />
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))
              ) : reviewsQuery.data?.map((review) => (
                <article key={review.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex gap-4">
                    <img
                      src={review.user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                      alt={review.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-white/90">{review.user.username}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-white/20'}`}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-white/50 text-sm">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white/80 mb-3">{review.comment}</p>
                      <Link
                        to={`/marketplace/tune/${review.tune.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Review for: {review.tune.name}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Badges */}
              <section>
                <h2 className="text-xl font-semibold text-white/90 mb-4">Badges</h2>
                <div className="space-y-3">
                  {creator.badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                      <div className={`w-12 h-12 ${badge.color} rounded-full flex items-center justify-center text-xl`}>
                        {badge.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white/90">{badge.name}</h3>
                        <p className="text-sm text-white/70">{badge.description}</p>
                        <p className="text-xs text-white/50 mt-1">
                          Earned {formatDate(badge.earned_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Achievements */}
              <section>
                <h2 className="text-xl font-semibold text-white/90 mb-4">Achievements</h2>
                <div className="space-y-3">
                  {creator.achievements.map((achievement) => (
                    <div key={achievement.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white/90">{achievement.title}</h3>
                          <p className="text-sm text-white/70">{achievement.description}</p>
                        </div>
                        {achievement.unlocked && (
                          <span className="text-green-400 text-sm">✓</span>
                        )}
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.min((achievement.progress / achievement.max_progress) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>{achievement.progress.toLocaleString()}</span>
                        <span>{achievement.max_progress.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfilePage;
