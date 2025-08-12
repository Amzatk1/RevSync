import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// Community Feed - World-class activity feed with social features
// Enhanced web version with rich interactions and detailed activity

interface ActivityItem {
  id: string;
  type: 'tune_uploaded' | 'tune_downloaded' | 'creator_followed' | 'review_posted' | 'achievement_earned' | 'forum_post' | 'collaboration' | 'tune_updated';
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  content: {
    title: string;
    description: string;
    metadata?: Record<string, any>;
    image_url?: string;
    tags?: string[];
  };
  target?: {
    id: string;
    type: 'tune' | 'creator' | 'forum_post';
    name: string;
    url: string;
  };
  timestamp: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    user_liked: boolean;
  };
  location?: string;
}

interface TrendingTopic {
  id: string;
  name: string;
  posts_count: number;
  growth_rate: number;
  category: 'bikes' | 'tunes' | 'events' | 'tech';
}

// Mock data for development
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'tune_uploaded',
    user: {
      id: 'creator1',
      username: 'SpeedDemon92',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      is_verified: true,
    },
    content: {
      title: 'New Stage 3 Tune for Yamaha R1',
      description: 'Just uploaded my latest track-focused tune with 15% power increase and improved throttle response.',
      image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
      tags: ['R1', 'Track', 'Performance'],
    },
    target: {
      id: 'tune1',
      type: 'tune',
      name: 'R1 Stage 3 Track Special',
      url: '/marketplace/tune/tune1',
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    engagement: {
      likes: 24,
      comments: 8,
      shares: 3,
      user_liked: false,
    },
  },
  {
    id: '2',
    type: 'achievement_earned',
    user: {
      id: 'user2',
      username: 'TuneEnthusiast',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      is_verified: false,
    },
    content: {
      title: 'Earned "Community Contributor" Badge',
      description: 'Reached 100 helpful reviews and became a trusted community member!',
      metadata: { achievement_level: 'gold', points_earned: 500 },
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    engagement: {
      likes: 15,
      comments: 4,
      shares: 1,
      user_liked: true,
    },
  },
  {
    id: '3',
    type: 'collaboration',
    user: {
      id: 'creator3',
      username: 'ElectricMike',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      is_verified: true,
    },
    content: {
      title: 'Collaborating on Electric Bike Tune',
      description: 'Working with @GreenRider on an innovative electric motorcycle optimization project.',
      tags: ['Electric', 'Collaboration', 'Innovation'],
    },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    engagement: {
      likes: 32,
      comments: 12,
      shares: 6,
      user_liked: false,
    },
    location: 'Silicon Valley, CA',
  },
];

const mockTrendingTopics: TrendingTopic[] = [
  { id: '1', name: 'Electric Motorcycles', posts_count: 142, growth_rate: 35, category: 'bikes' },
  { id: '2', name: 'Track Day Prep', posts_count: 89, growth_rate: 22, category: 'events' },
  { id: '3', name: 'ECU Tuning', posts_count: 156, growth_rate: 18, category: 'tech' },
  { id: '4', name: 'Safety First', posts_count: 73, growth_rate: 15, category: 'tech' },
];

const CommunityFeedPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    document.title = 'Community Feed • RevSync';
  }, []);

  // In a real app, these would be actual API calls
  const activitiesQuery = useQuery({
    queryKey: ['community', 'feed', filter, timeRange],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockActivities;
    },
    staleTime: 30_000,
  });

  const trendingQuery = useQuery({
    queryKey: ['community', 'trending'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTrendingTopics;
    },
    staleTime: 300_000, // 5 minutes
  });

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'tune_uploaded': return '📤';
      case 'tune_downloaded': return '📥';
      case 'creator_followed': return '👥';
      case 'review_posted': return '⭐';
      case 'achievement_earned': return '🏆';
      case 'forum_post': return '💬';
      case 'collaboration': return '🤝';
      case 'tune_updated': return '🔄';
      default: return '📢';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'tune_uploaded': return 'bg-blue-600';
      case 'tune_downloaded': return 'bg-green-600';
      case 'creator_followed': return 'bg-purple-600';
      case 'review_posted': return 'bg-yellow-600';
      case 'achievement_earned': return 'bg-orange-600';
      case 'forum_post': return 'bg-indigo-600';
      case 'collaboration': return 'bg-pink-600';
      case 'tune_updated': return 'bg-teal-600';
      default: return 'bg-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getCategoryColor = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'bikes': return 'text-blue-400';
      case 'tunes': return 'text-green-400';
      case 'events': return 'text-purple-400';
      case 'tech': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const handleLike = (activityId: string) => {
    // In a real app, this would make an API call
    console.log('Liked activity:', activityId);
  };

  const handleComment = (activityId: string) => {
    // In a real app, this would open a comment modal
    console.log('Comment on activity:', activityId);
  };

  const handleShare = (activityId: string) => {
    // In a real app, this would open a share modal
    console.log('Share activity:', activityId);
  };

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white/90">Community Feed</h1>
              <p className="text-sm text-white/60 mt-1">Stay updated with the latest community activities</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/community" 
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Browse Community
              </Link>
              <Link 
                to="/community/forums" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Join Discussion
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Feed Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {['all', 'following', 'trending'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f 
                        ? 'bg-blue-600 text-white' 
                        : 'border border-white/20 text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                {['today', 'week', 'month'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      timeRange === t 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-4">
              {activitiesQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                        <div className="h-20 bg-white/5 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : activitiesQuery.data?.map((activity) => (
                <article key={activity.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={activity.user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                        alt={activity.user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center text-xs`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white/90">{activity.user.username}</span>
                        {activity.user.is_verified && (
                          <span className="text-blue-400 text-sm">✓</span>
                        )}
                        <span className="text-white/40">•</span>
                        <span className="text-white/60 text-sm">{formatTimeAgo(activity.timestamp)}</span>
                        {activity.location && (
                          <>
                            <span className="text-white/40">•</span>
                            <span className="text-white/50 text-sm">📍 {activity.location}</span>
                          </>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-white/90 mb-2">{activity.content.title}</h3>
                      <p className="text-white/70 text-sm leading-relaxed">{activity.content.description}</p>
                      
                      {/* Tags */}
                      {activity.content.tags && activity.content.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {activity.content.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-white/10 text-white/80 rounded-md text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Image */}
                  {activity.content.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={activity.content.image_url}
                        alt={activity.content.title}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Target Link */}
                  {activity.target && (
                    <Link
                      to={activity.target.url}
                      className="block mb-4 p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <span className="text-blue-400">🔗</span>
                        </div>
                        <div>
                          <div className="font-medium text-white/90 text-sm">{activity.target.name}</div>
                          <div className="text-white/60 text-xs">{activity.target.type}</div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Engagement */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLike(activity.id)}
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          activity.engagement.user_liked ? 'text-red-400' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{activity.engagement.user_liked ? '❤️' : '🤍'}</span>
                        {activity.engagement.likes}
                      </button>
                      
                      <button
                        onClick={() => handleComment(activity.id)}
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                      >
                        <span className="text-lg">💬</span>
                        {activity.engagement.comments}
                      </button>
                      
                      <button
                        onClick={() => handleShare(activity.id)}
                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                      >
                        <span className="text-lg">🔄</span>
                        {activity.engagement.shares}
                      </button>
                    </div>
                    
                    <button className="text-white/40 hover:text-white/60 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More */}
            {!activitiesQuery.isLoading && activitiesQuery.data && (
              <div className="text-center">
                <button className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors">
                  Load More Activities
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white/90 mb-4">Trending Topics</h2>
              <div className="space-y-3">
                {trendingQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  ))
                ) : trendingQuery.data?.map((topic, index) => (
                  <div key={topic.id} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm font-mono">#{index + 1}</span>
                        <span className="font-medium text-white/90">{topic.name}</span>
                        <span className={`text-xs ${getCategoryColor(topic.category)}`}>
                          {topic.category}
                        </span>
                      </div>
                      <div className="text-white/60 text-xs mt-1">
                        {topic.posts_count} posts • +{topic.growth_rate}% growth
                      </div>
                    </div>
                    <div className="text-green-400 text-xs font-medium">
                      ↗ {topic.growth_rate}%
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white/90 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/community"
                  className="block w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  🔓 Browse Open Source Tunes
                </Link>
                <Link
                  to="/community/forums"
                  className="block w-full p-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-center"
                >
                  💬 Join Forum Discussion
                </Link>
                <Link
                  to="/community/creator-application"
                  className="block w-full p-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-center"
                >
                  ⭐ Become a Creator
                </Link>
              </div>
            </section>

            {/* Community Stats */}
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white/90 mb-4">Community Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">2.4K</div>
                  <div className="text-xs text-white/60">Active Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">15.2K</div>
                  <div className="text-xs text-white/60">Open Source Tunes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">89.5K</div>
                  <div className="text-xs text-white/60">Total Downloads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">1.2M</div>
                  <div className="text-xs text-white/60">Community Members</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityFeedPage;
