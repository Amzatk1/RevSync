import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Edit Profile Page - Comprehensive profile management with avatar upload
interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  dateOfBirth?: string;
  language: string;
  timezone: string;
  units: 'metric' | 'imperial' | 'mixed';
  isPublic: boolean;
  createdAt: string;
  lastLogin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// Auth hook
const useAuthHeaders = () => {
  try {
    const { useAuth } = require('../../contexts/AuthContext');
    const { auth } = useAuth?.() ?? {};
    return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
  } catch {
    return {};
  }
};

// Profile hook
const useUserProfile = () => {
  const authHeaders = useAuthHeaders();
  
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async (): Promise<UserProfile> => {
      // Mock user profile (replace with real API)
      return {
        id: 'user_123',
        email: 'john.doe@example.com',
        username: 'speedrider_pro',
        displayName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1 (555) 123-4567',
        bio: 'Passionate motorcycle enthusiast and track day regular. Love exploring the limits of both my bike and my skills on two wheels.',
        location: 'San Francisco, CA',
        website: 'https://speedriderpro.com',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        dateOfBirth: '1990-05-15',
        language: 'en',
        timezone: 'America/Los_Angeles',
        units: 'imperial',
        isPublic: true,
        createdAt: '2023-01-15T10:30:00Z',
        lastLogin: '2024-02-15T14:45:00Z',
        emailVerified: true,
        phoneVerified: false,
      };
    },
    staleTime: 300_000, // 5 minutes
    enabled: !!authHeaders.Authorization,
  });
};

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const profile = useUserProfile();
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    document.title = 'Edit Profile • Settings • RevSync';
  }, []);

  useEffect(() => {
    if (profile.data) {
      setFormData(profile.data);
      setAvatarPreview(profile.data.avatar_url || '');
    }
  }, [profile.data]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      // Mock API call to update profile
      console.log('Updating profile:', data);
      return data;
    },
    onSuccess: () => {
      setIsEditing(false);
      // Show success toast
    },
  });

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (formData) {
      updateProfileMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    if (profile.data) {
      setFormData(profile.data);
      setAvatarPreview(profile.data.avatar_url || '');
      setAvatarFile(null);
    }
    setIsEditing(false);
  };

  if (!profile.data) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white/90">Edit Profile</h1>
                <p className="text-sm text-white/60">Manage your personal information and public profile</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Profile Photo</h2>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={avatarPreview || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                />
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-white/90 mb-1">Profile Picture</h3>
                <p className="text-sm text-white/60 mb-3">
                  Upload a photo to help others recognize you
                </p>
                {isEditing && (
                  <div className="flex gap-2">
                    <label className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-sm">
                      Choose Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    <button className="px-4 py-2 text-red-400 hover:text-red-300 text-sm">
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Display Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.displayName || ''}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90">{formData.displayName}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90">@{formData.username}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90">{formData.firstName}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90">{formData.lastName}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                <div className="px-4 py-3 bg-white/5 rounded-lg text-white/60 flex items-center justify-between">
                  <span>{formData.email}</span>
                  {formData.emailVerified ? (
                    <span className="text-green-400 text-sm">✓ Verified</span>
                  ) : (
                    <span className="text-yellow-400 text-sm">Unverified</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90 flex items-center justify-between">
                    <span>{formData.phoneNumber || 'Not provided'}</span>
                    {formData.phoneNumber && (
                      <span className={`text-sm ${formData.phoneVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                        {formData.phoneVerified ? '✓ Verified' : 'Unverified'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Profile Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    placeholder="Tell others about yourself and your riding experience..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90 min-h-[80px]">
                    {formData.bio || 'No bio provided'}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, State/Country"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90">{formData.location || 'Not specified'}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://your-website.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-white/5 rounded-lg text-white/90">
                      {formData.website ? (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {formData.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Privacy Settings</h2>
            
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <div>
                <div className="font-medium text-white/90">Public Profile</div>
                <div className="text-sm text-white/60 mt-1">
                  Allow others to see your profile information and activity
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic || false}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white/90 mb-6">Account Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Member Since</label>
                <div className="px-4 py-3 bg-white/5 rounded-lg text-white/60">
                  {new Date(formData.createdAt || '').toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Last Login</label>
                <div className="px-4 py-3 bg-white/5 rounded-lg text-white/60">
                  {new Date(formData.lastLogin || '').toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfilePage;
