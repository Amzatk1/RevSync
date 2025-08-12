import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Recommendations Page - AI-powered personalized recommendations
const RecommendationsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'AI Recommendations • RevSync';
  }, []);

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
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
                <h1 className="text-2xl font-bold text-white/90">AI Recommendations</h1>
                <p className="text-sm text-white/60">Personalized suggestions powered by machine learning</p>
              </div>
            </div>

            <Link
              to="/search"
              className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
            >
              Search Instead
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-3xl font-bold text-white/90 mb-4">AI Recommendations Coming Soon</h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Our advanced machine learning system is being trained to provide personalized tune and motorcycle recommendations based on your preferences and riding style.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold text-white/90 mb-2">Personalized</h3>
              <p className="text-sm text-white/60">Recommendations tailored to your riding style and preferences</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">🔥</div>
              <h3 className="font-semibold text-white/90 mb-2">Trending</h3>
              <p className="text-sm text-white/60">Discover what's popular in the community right now</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-semibold text-white/90 mb-2">Smart Discovery</h3>
              <p className="text-sm text-white/60">Find content you didn't know you were looking for</p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/search"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Explore All Content
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecommendationsPage;
