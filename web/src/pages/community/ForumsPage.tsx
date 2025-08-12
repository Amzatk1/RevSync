import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// Forums Page - World-class community discussion platform
// Enhanced web version with categorized forums, real-time discussions, and rich interactions

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  post_count: number;
  latest_post?: {
    id: string;
    title: string;
    author: string;
    timestamp: string;
  };
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  category: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  reply_count: number;
  view_count: number;
  likes_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  tags: string[];
}

// Mock data for development
const mockCategories: ForumCategory[] = [
  {
    id: '1',
    name: 'General Discussion',
    description: 'Talk about anything motorcycle tuning related',
    icon: '💬',
    color: 'bg-blue-600',
    post_count: 1247,
    latest_post: {
      id: 'post1',
      title: 'Best practices for first-time tuning',
      author: 'TuneNewbie',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: '2',
    name: 'Technical Support',
    description: 'Get help with tuning issues and troubleshooting',
    icon: '🔧',
    color: 'bg-orange-600',
    post_count: 892,
    latest_post: {
      id: 'post2',
      title: 'ECU connection timeout error',
      author: 'TechExpert',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  },
  {
    id: '3',
    name: 'Tune Reviews',
    description: 'Share your experiences with different tunes',
    icon: '⭐',
    color: 'bg-yellow-600',
    post_count: 634,
    latest_post: {
      id: 'post3',
      title: 'SpeedDemon\'s R1 Stage 3 - Incredible!',
      author: 'TrackRider23',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: '4',
    name: 'Track Day Stories',
    description: 'Share your track day experiences and tips',
    icon: '🏁',
    color: 'bg-red-600',
    post_count: 421,
    latest_post: {
      id: 'post4',
      title: 'Laguna Seca lap record with new tune',
      author: 'SpeedDemon92',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: '5',
    name: 'Bike Showcase',
    description: 'Show off your rides and modifications',
    icon: '🏍️',
    color: 'bg-purple-600',
    post_count: 756,
    latest_post: {
      id: 'post5',
      title: '2023 R1 Track Build Complete',
      author: 'BikeBuilder',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: '6',
    name: 'Marketplace Discussion',
    description: 'Discuss tune recommendations and deals',
    icon: '🛒',
    color: 'bg-green-600',
    post_count: 523,
    latest_post: {
      id: 'post6',
      title: 'Weekly tune deals - February 2024',
      author: 'DealHunter',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  },
];

const mockPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Best practices for first-time tuning',
    content: 'I\'m new to motorcycle tuning and looking for advice on getting started safely. What are the most important things to know?',
    author: {
      id: 'user1',
      username: 'TuneNewbie',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      is_verified: false,
    },
    category: {
      id: '1',
      name: 'General Discussion',
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reply_count: 23,
    view_count: 156,
    likes_count: 12,
    is_pinned: false,
    is_locked: false,
    tags: ['beginner', 'safety', 'tips'],
  },
  {
    id: '2',
    title: 'ECU connection timeout error',
    content: 'Getting a timeout error when trying to connect to my 2022 R1 ECU. Using the latest RevSync software. Any ideas?',
    author: {
      id: 'user2',
      username: 'TechExpert',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      is_verified: true,
    },
    category: {
      id: '2',
      name: 'Technical Support',
    },
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reply_count: 7,
    view_count: 42,
    likes_count: 3,
    is_pinned: false,
    is_locked: false,
    tags: ['troubleshooting', 'r1', 'ecu'],
  },
  {
    id: '3',
    title: 'SpeedDemon\'s R1 Stage 3 - Incredible Results!',
    content: 'Just flashed SpeedDemon\'s Stage 3 tune on my track bike. The difference is night and day! Power delivery is so much smoother and the throttle response is instant.',
    author: {
      id: 'user3',
      username: 'TrackRider23',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      is_verified: false,
    },
    category: {
      id: '3',
      name: 'Tune Reviews',
    },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    reply_count: 15,
    view_count: 89,
    likes_count: 28,
    is_pinned: true,
    is_locked: false,
    tags: ['review', 'stage3', 'track', 'r1'],
  },
];

const ForumsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'views'>('latest');

  useEffect(() => {
    document.title = 'Community Forums • RevSync';
  }, []);

  // In a real app, these would be actual API calls
  const categoriesQuery = useQuery({
    queryKey: ['forums', 'categories'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockCategories;
    },
  });

  const postsQuery = useQuery({
    queryKey: ['forums', 'posts', activeCategory, sortBy],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      let filtered = mockPosts;
      if (activeCategory) {
        filtered = mockPosts.filter(post => post.category.id === activeCategory);
      }
      
      // Sort posts
      if (sortBy === 'popular') {
        filtered = [...filtered].sort((a, b) => b.likes_count - a.likes_count);
      } else if (sortBy === 'views') {
        filtered = [...filtered].sort((a, b) => b.view_count - a.view_count);
      } else {
        filtered = [...filtered].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      }
      
      return filtered;
    },
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white/90">Community Forums</h1>
              <p className="text-sm text-white/60 mt-1">Join discussions with fellow motorcycle enthusiasts</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/community/feed" 
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Activity Feed
              </Link>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                New Post
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold text-white/90 mb-4">Categories</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-white/5 text-white/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📋</span>
                    <div>
                      <div className="font-medium">All Posts</div>
                      <div className="text-xs opacity-80">View everything</div>
                    </div>
                  </div>
                </button>
                
                {categoriesQuery.data?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-white/5 text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs opacity-80">{category.post_count} posts</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Forum Stats */}
              <div className="mt-8 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                <h3 className="font-semibold text-white/90 mb-3">Forum Stats</h3>
                <div className="space-y-2 text-sm text-white/70">
                  <div className="flex justify-between">
                    <span>Total Posts:</span>
                    <span className="text-white/90">4,473</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Today:</span>
                    <span className="text-green-400">127</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Members:</span>
                    <span className="text-blue-400">12,340</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="lg:col-span-3">
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/60">Sort by:</span>
                <div className="flex gap-2">
                  {[
                    { key: 'latest', label: 'Latest' },
                    { key: 'popular', label: 'Popular' },
                    { key: 'views', label: 'Most Viewed' },
                  ].map((sort) => (
                    <button
                      key={sort.key}
                      onClick={() => setSortBy(sort.key as any)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        sortBy === sort.key
                          ? 'bg-blue-600 text-white'
                          : 'border border-white/20 text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-white/60">
                {postsQuery.data?.length || 0} posts
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {postsQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))
              ) : postsQuery.data?.map((post) => (
                <article key={post.id} className="rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-6">
                  <div className="flex gap-4">
                    {/* Author Avatar */}
                    <img
                      src={post.author.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                      alt={post.author.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    
                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {post.is_pinned && (
                              <span className="text-orange-400 text-sm">📌</span>
                            )}
                            {post.is_locked && (
                              <span className="text-red-400 text-sm">🔒</span>
                            )}
                            <h3 className="font-semibold text-white/90 text-lg hover:text-blue-400 cursor-pointer">
                              {post.title}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-white/60">
                            <span className="font-medium text-white/80">{post.author.username}</span>
                            {post.author.is_verified && (
                              <span className="text-blue-400">✓</span>
                            )}
                            <span>•</span>
                            <span>{formatTimeAgo(post.created_at)}</span>
                            <span>•</span>
                            <span className="px-2 py-1 bg-white/10 rounded-md text-xs">
                              {post.category.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-white/70 mb-4 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-white/10 text-white/80 rounded-md text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.reply_count} replies</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>👀</span>
                          <span>{post.view_count} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>❤️</span>
                          <span>{post.likes_count} likes</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-white/40">Last reply:</span>
                          <span>{formatTimeAgo(post.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More */}
            {!postsQuery.isLoading && postsQuery.data && postsQuery.data.length > 0 && (
              <div className="text-center mt-8">
                <button className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors">
                  Load More Posts
                </button>
              </div>
            )}

            {/* Empty State */}
            {!postsQuery.isLoading && (!postsQuery.data || postsQuery.data.length === 0) && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-white/90 mb-2">No posts found</h3>
                <p className="text-white/60 mb-6">
                  {activeCategory 
                    ? 'No posts in this category yet. Be the first to start a discussion!'
                    : 'No posts available. Start a new discussion!'
                  }
                </p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create New Post
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForumsPage;
