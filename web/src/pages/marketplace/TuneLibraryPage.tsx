import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Tune Library Page - User's purchased and downloaded tunes
const TuneLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [libraryTab, setLibraryTab] = useState<'purchased' | 'downloads' | 'favorites'>('purchased');

  useEffect(() => {
    document.title = 'My Library • RevSync Marketplace';
  }, []);

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/marketplace')}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white/90">My Tune Library</h1>
                <p className="text-sm text-white/60">Manage your purchased and downloaded tunes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-3xl font-bold text-white/90 mb-4">Your Tune Library</h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Access all your purchased tunes, free downloads, and favorites in one organized library with cloud sync and offline access.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="font-semibold text-white/90 mb-2">Purchased Tunes</h3>
              <p className="text-sm text-white/60">Premium tunes you've bought with lifetime access</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">📥</div>
              <h3 className="font-semibold text-white/90 mb-2">Free Downloads</h3>
              <p className="text-sm text-white/60">Open source and free tunes in your collection</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">❤️</div>
              <h3 className="font-semibold text-white/90 mb-2">Favorites</h3>
              <p className="text-sm text-white/60">Bookmarked tunes for future reference</p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/marketplace"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TuneLibraryPage;
