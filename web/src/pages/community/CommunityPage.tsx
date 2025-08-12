import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Link, useNavigate } from 'react-router-dom';

// Community (web) — world‑class, responsive & accessible
// Perfect mirror of mobile CommunityScreen with web enhancements:
// - Enhanced grid layouts and richer cards
// - Advanced search and filtering capabilities  
// - Infinite scroll with intersection observer
// - Detailed creator profiles and tune showcases
// - Professional upload flow with drag-and-drop

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
  follower_count?: number;
  monthly_downloads?: number;
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
  file_size?: number;
  version?: string;
  changelog?: string;
}

interface UploadData {
  name: string;
  description: string;
  tags: string[];
  compatibility: string[];
  is_free: boolean;
  is_open_source: boolean;
  file?: File;
  image?: File;
  changelog?: string;
  version: string;
}

// ---- Supabase client ----
let supabase: SupabaseClient | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('../../services/supabaseClient');
  supabase = (m && (m.supabase || m.default)) as SupabaseClient | null;
} catch {}
if (!supabase) {
  const url = (process.env.REACT_APP_SUPABASE_URL || '').trim();
  const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
  if (url && key) {
    supabase = createClient(url, key);
  }
}

// ---- Helpers ----
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const formatJoinDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

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
        .select('id,username,avatar_url,is_verified,total_downloads,tune_count,rating_average,specialties,bio,joined_date,follower_count,monthly_downloads')
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
        .select(`id,name,description,download_count,rating_average,review_count,tags,is_free,is_open_source,compatibility,last_updated,image_url,file_size,version,changelog,creator:creator_id ( id,username,avatar_url,is_verified,tune_count,total_downloads,rating_average,specialties,bio,joined_date )`)
        .eq('is_open_source', true)
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

const useUploadTune = () =>
  useMutation({
    mutationFn: async (uploadData: UploadData) => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      // Upload file if present
      let fileUrl = null;
      if (uploadData.file) {
        const fileName = `${Date.now()}-${uploadData.file.name}`;
        const { data: fileUpload, error: fileError } = await supabase.storage
          .from('tune-files')
          .upload(fileName, uploadData.file);
        if (fileError) throw fileError;
        fileUrl = fileUpload.path;
      }

      // Upload image if present
      let imageUrl = null;
      if (uploadData.image) {
        const imageName = `${Date.now()}-${uploadData.image.name}`;
        const { data: imageUpload, error: imageError } = await supabase.storage
          .from('tune-images')
          .upload(imageName, uploadData.image);
        if (imageError) throw imageError;
        imageUrl = imageUpload.path;
      }

      // Create tune record
      const { data, error } = await supabase.from('community_tunes').insert({
        name: uploadData.name,
        description: uploadData.description,
        tags: uploadData.tags,
        compatibility: uploadData.compatibility,
        is_free: uploadData.is_free,
        is_open_source: uploadData.is_open_source,
        file_url: fileUrl,
        image_url: imageUrl,
        version: uploadData.version,
        changelog: uploadData.changelog,
      });
      
      if (error) throw error;
      return data;
    },
  });

// ---- Tabs ----
const TABS = [
  { key: 'creators', label: 'Creators', icon: '👥', description: 'Discover talented tune creators' },
  { key: 'tunes', label: 'Open Source', icon: '🔓', description: 'Free community-developed tunes' },
  { key: 'upload', label: 'Upload', icon: '📤', description: 'Share your own creations' },
];

// ---- UI Components ----
const CreatorCard: React.FC<{ 
  creator: Creator; 
  onFollow: (id: string) => void; 
  following: boolean;
  className?: string;
}> = ({ creator, onFollow, following, className }) => {
  const navigate = useNavigate();
  
  return (
    <article className={cx("group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-all duration-300 hover:border-white/20", className)}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={creator.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
            alt={creator.username}
            className="w-16 h-16 rounded-full object-cover"
            loading="lazy"
          />
          {creator.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                {creator.username}
              </h3>
              <p className="text-sm text-white/60 mt-1">{formatJoinDate(creator.joined_date)}</p>
            </div>
            <button
              onClick={() => onFollow(creator.id)}
              className={cx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                following 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'border border-white/20 text-white/90 hover:bg-white/5'
              )}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="text-sm text-white/70 mt-3 line-clamp-2 leading-relaxed">
              {creator.bio}
            </p>
          )}

          {/* Specialties */}
          {creator.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {creator.specialties.slice(0, 3).map((specialty) => (
                <span 
                  key={specialty}
                  className="px-2 py-1 bg-white/10 text-white/80 rounded-md text-xs"
                >
                  {specialty}
                </span>
              ))}
              {creator.specialties.length > 3 && (
                <span className="text-xs text-white/60">+{creator.specialties.length - 3} more</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="text-lg font-semibold text-white/90">{creator.tune_count || 0}</div>
              <div className="text-xs text-white/60">Tunes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white/90">{(creator.total_downloads || 0).toLocaleString()}</div>
              <div className="text-xs text-white/60">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white/90">{creator.rating_average?.toFixed(1) || '—'}</div>
              <div className="text-xs text-white/60">Rating</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => navigate(`/community/creator/${creator.id}`)}
              className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Profile
            </button>
            <button
              onClick={() => navigate(`/community/creator/${creator.id}/tunes`)}
              className="py-2 px-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              Browse Tunes
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const TuneCard: React.FC<{ tune: CommunityTune; onSave: (id: string) => void }> = ({ tune, onSave }) => {
  const navigate = useNavigate();
  
  return (
    <article className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 overflow-hidden hover:border-white/20">
      {/* Image */}
      <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative overflow-hidden">
        {tune.image_url ? (
          <img 
            src={tune.image_url} 
            alt={tune.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-50">🔧</span>
          </div>
        )}
        
        {/* Overlay badges */}
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

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-md">
          <span className="text-yellow-400 text-sm">⭐</span>
          <span className="text-white text-sm font-medium">{tune.rating_average?.toFixed(1) || '—'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white/90 truncate group-hover:text-white transition-colors">
              {tune.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <img 
                src={tune.creator.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
                alt={tune.creator.username}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-sm text-white/70">{tune.creator.username}</span>
              {tune.creator.is_verified && (
                <span className="text-blue-400 text-xs">✓</span>
              )}
            </div>
          </div>
          <button
            onClick={() => onSave(tune.id)}
            className="p-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            title="Save tune"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-white/70 line-clamp-3 leading-relaxed mb-4">
          {tune.description}
        </p>

        {/* Tags */}
        {tune.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tune.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="px-2 py-1 bg-white/10 text-white/80 rounded-md text-xs"
              >
                {tag}
              </span>
            ))}
            {tune.tags.length > 3 && (
              <span className="text-xs text-white/60">+{tune.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Compatibility */}
        {tune.compatibility.length > 0 && (
          <div className="text-xs text-white/60 mb-4">
            <span className="font-medium">Compatible:</span> {tune.compatibility.slice(0, 2).join(', ')}
            {tune.compatibility.length > 2 && ` +${tune.compatibility.length - 2} more`}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-t border-b border-white/10">
          <div className="text-center">
            <div className="text-sm font-semibold text-white/90">{tune.download_count?.toLocaleString() || 0}</div>
            <div className="text-xs text-white/60">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-white/90">{tune.review_count || 0}</div>
            <div className="text-xs text-white/60">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-white/90">{formatFileSize(tune.file_size)}</div>
            <div className="text-xs text-white/60">Size</div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-white/60 mb-4">
          <span>v{tune.version || '1.0'}</span>
          <span>Updated {new Date(tune.last_updated).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/marketplace/tune/${tune.id}`)}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
          <button
            onClick={() => window.open(`/api/tunes/${tune.id}/download`, '_blank')}
            className="py-2 px-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            Download
          </button>
        </div>
      </div>
    </article>
  );
};

// Upload Flow Component
const UploadFlow: React.FC = () => {
  const uploadMut = useUploadTune();
  const [uploadData, setUploadData] = useState<UploadData>({
    name: '',
    description: '',
    tags: [],
    compatibility: [],
    is_free: true,
    is_open_source: true,
    version: '1.0',
  });
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const tuneFile = files.find(f => f.name.endsWith('.bin') || f.name.endsWith('.hex'));
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (tuneFile) {
      setUploadData(prev => ({ ...prev, file: tuneFile }));
    }
    if (imageFile) {
      setUploadData(prev => ({ ...prev, image: imageFile }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await uploadMut.mutateAsync(uploadData);
      // Reset form
      setUploadData({
        name: '',
        description: '',
        tags: [],
        compatibility: [],
        is_free: true,
        is_open_source: true,
        version: '1.0',
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white/90 mb-2">Share Your Tune</h2>
        <p className="text-white/60">Upload your motorcycle tune to the community and help other riders</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div
          className={cx(
            'border-2 border-dashed rounded-2xl p-8 text-center transition-colors',
            dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/30'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-white/90 mb-2">Drop your tune files here</h3>
          <p className="text-white/60 mb-4">Support for .bin, .hex files and preview images</p>
          <div className="flex gap-3 justify-center">
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              Choose Tune File
              <input 
                type="file" 
                className="hidden" 
                accept=".bin,.hex"
                onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] }))}
              />
            </label>
            <label className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              Choose Image
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => setUploadData(prev => ({ ...prev, image: e.target.files?.[0] }))}
              />
            </label>
          </div>
          {(uploadData.file || uploadData.image) && (
            <div className="mt-4 flex gap-4 justify-center">
              {uploadData.file && (
                <span className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">
                  📄 {uploadData.file.name}
                </span>
              )}
              {uploadData.image && (
                <span className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm">
                  🖼️ {uploadData.image.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Tune Name *</label>
            <input
              type="text"
              required
              value={uploadData.name}
              onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Stage 2 Performance Tune"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Version</label>
            <input
              type="text"
              value={uploadData.version}
              onChange={(e) => setUploadData(prev => ({ ...prev, version: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1.0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Description *</label>
          <textarea
            required
            rows={4}
            value={uploadData.description}
            onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your tune's purpose, modifications, and expected results..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Changelog</label>
          <textarea
            rows={3}
            value={uploadData.changelog}
            onChange={(e) => setUploadData(prev => ({ ...prev, changelog: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's new in this version..."
          />
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={uploadData.is_free}
              onChange={(e) => setUploadData(prev => ({ ...prev, is_free: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/20 rounded focus:ring-blue-500"
            />
            <span className="text-white/80">Free to download</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={uploadData.is_open_source}
              onChange={(e) => setUploadData(prev => ({ ...prev, is_open_source: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/20 rounded focus:ring-blue-500"
            />
            <span className="text-white/80">Open source</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploadMut.isPending || !uploadData.name || !uploadData.description}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {uploadMut.isPending ? 'Uploading...' : 'Upload Tune'}
          </button>
          <button
            type="button"
            className="px-8 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
          >
            Save Draft
          </button>
        </div>

        {uploadMut.isError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300">Upload failed. Please try again.</p>
          </div>
        )}
      </form>
    </div>
  );
};

// ---- Main Component ----
const CommunityPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'creators' | 'tunes' | 'upload'>('creators');
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

  useEffect(() => { 
    document.title = 'Community • RevSync'; 
  }, []);

  // Reset pagination when searching/filtering/sorting
  useEffect(() => { 
    setPageCreators(0); 
  }, [debounced, filters, sortCreators]);
  
  useEffect(() => { 
    setPageTunes(0); 
  }, [debounced, filters, sortTunes]);

  const filterOptions = useMemo(() => ['Open Source', 'Free', 'Verified Creator', 'Sport Bikes', 'Eco', 'Track'], []);
  const toggleFilter = (f: string) => setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  // Tabs keyboard nav
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDownTabs = (e: React.KeyboardEvent) => {
    const idx = TABS.findIndex((t) => t.key === activeTab);
    if (e.key === 'ArrowRight') { 
      const next = (idx + 1) % TABS.length; 
      tabsRef.current[next]?.focus(); 
      setActiveTab(TABS[next].key as any); 
    }
    if (e.key === 'ArrowLeft') { 
      const prev = (idx - 1 + TABS.length) % TABS.length; 
      tabsRef.current[prev]?.focus(); 
      setActiveTab(TABS[prev].key as any); 
    }
  };

  // Infinite scroll sentinels
  const creatorsSentinelRef = useRef<HTMLDivElement | null>(null);
  const tunesSentinelRef = useRef<HTMLDivElement | null>(null);

  const observe = useCallback((el: HTMLDivElement | null, onHit: () => void) => {
    if (!el) return () => {};
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { 
        if (entry.isIntersecting) onHit(); 
      });
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
    followMut.mutate(id, { 
      onError: () => setFollowingIds((s) => { 
        const n = new Set(s); 
        n.delete(id); 
        return n; 
      }) 
    });
  };

  const onSave = (id: string) => { 
    saveMut.mutate(id); 
  };

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white/90">Community</h1>
              <p className="text-sm text-white/60 mt-1">Connect with creators, discover tunes, and share your work</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link 
                to="/community/forums" 
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Forums
              </Link>
              <Link 
                to="/community/feed" 
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Activity Feed
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Tabs */}
        <div role="tablist" aria-label="Community sections" className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 flex flex-wrap gap-2 mb-8">
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
                onClick={() => setActiveTab(t.key as any)}
                className={cx(
                  'flex-1 md:flex-none px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200',
                  'flex items-center gap-3 min-w-0',
                  selected 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                <span className="text-lg">{t.icon}</span>
                <div className="min-w-0 text-left">
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-xs opacity-80 hidden md:block">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Filters (hidden on Upload) */}
        {activeTab !== 'upload' && (
          <div className="mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    id="search" 
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder={`Search ${activeTab}...`} 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-white/70 mb-2">Sort by</label>
                {activeTab === 'creators' ? (
                  <select 
                    id="sort" 
                    className="w-full px-3 py-3 border border-white/20 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={sortCreators} 
                    onChange={(e) => setSortCreators(e.target.value as any)}
                  >
                    <option value="downloads">Most downloads</option>
                    <option value="rating">Highest rating</option>
                    <option value="newest">Newest</option>
                  </select>
                ) : (
                  <select 
                    id="sort" 
                    className="w-full px-3 py-3 border border-white/20 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={sortTunes} 
                    onChange={(e) => setSortTunes(e.target.value as any)}
                  >
                    <option value="downloads">Most downloads</option>
                    <option value="rating">Highest rating</option>
                    <option value="updated">Recently updated</option>
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Filters</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.slice(0, 3).map((f) => {
                    const sel = filters.includes(f);
                    return (
                      <button 
                        key={f} 
                        type="button" 
                        onClick={() => toggleFilter(f)} 
                        className={cx(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          sel ? 'bg-blue-600 text-white' : 'border border-white/20 text-white/70 hover:text-white hover:bg-white/5'
                        )} 
                        aria-pressed={sel}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Additional filters */}
            {filterOptions.length > 3 && (
              <div className="flex flex-wrap gap-2">
                {filterOptions.slice(3).map((f) => {
                  const sel = filters.includes(f);
                  return (
                    <button 
                      key={f} 
                      type="button" 
                      onClick={() => toggleFilter(f)} 
                      className={cx(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        sel ? 'bg-blue-600 text-white' : 'border border-white/20 text-white/70 hover:text-white hover:bg-white/5'
                      )} 
                      aria-pressed={sel}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content Panels */}
        <div className="min-h-[400px]">
          {/* Creators Panel */}
          <section role="tabpanel" id="panel-creators" aria-labelledby="tab-creators" hidden={activeTab !== 'creators'}>
            {creatorsQ.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : creatorsQ.isError ? (
              <div className="text-center py-16">
                <p className="text-rose-400 mb-4" role="alert">Failed to load creators.</p>
                <button 
                  onClick={() => creatorsQ.refetch()} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (creatorsQ.data || []).length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(creatorsQ.data || []).map((c: Creator) => (
                    <CreatorCard 
                      key={c.id} 
                      creator={c} 
                      onFollow={onFollow} 
                      following={followingIds.has(c.id)} 
                    />
                  ))}
                </div>
                <div ref={creatorsSentinelRef} className="h-8" aria-hidden />
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-white/90 mb-2">No creators found</h3>
                <p className="text-white/60">Try adjusting your search or filters</p>
              </div>
            )}
          </section>

          {/* Tunes Panel */}
          <section role="tabpanel" id="panel-tunes" aria-labelledby="tab-tunes" hidden={activeTab !== 'tunes'}>
            {tunesQ.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-96 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : tunesQ.isError ? (
              <div className="text-center py-16">
                <p className="text-rose-400 mb-4" role="alert">Failed to load tunes.</p>
                <button 
                  onClick={() => tunesQ.refetch()} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (tunesQ.data || []).length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(tunesQ.data || []).map((t: CommunityTune) => (
                    <TuneCard key={t.id} tune={t} onSave={onSave} />
                  ))}
                </div>
                <div ref={tunesSentinelRef} className="h-8" aria-hidden />
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔓</div>
                <h3 className="text-xl font-semibold text-white/90 mb-2">No tunes found</h3>
                <p className="text-white/60">Try adjusting your search or filters</p>
              </div>
            )}
          </section>

          {/* Upload Panel */}
          <section role="tabpanel" id="panel-upload" aria-labelledby="tab-upload" hidden={activeTab !== 'upload'}>
            <UploadFlow />
          </section>
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;
