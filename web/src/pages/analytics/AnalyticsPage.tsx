import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Personal Analytics Page - World-class user analytics with AI insights
const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'insights' | 'goals'>('overview');

  useEffect(() => {
    document.title = 'Personal Analytics • RevSync';
  }, []);

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white/90">Personal Analytics</h1>
                <p className="text-sm text-white/60">Track your performance, goals, and AI-powered insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/analytics/reports"
                className="px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
              >
                Detailed Reports
              </Link>
              <Link
                to="/analytics/trending"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Trending Analysis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-3xl font-bold text-white/90 mb-4">Advanced Personal Analytics</h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Comprehensive performance tracking with AI-powered insights, goal management, and personalized recommendations based on your riding behavior.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="font-semibold text-white/90 mb-2">Performance Tracking</h3>
              <p className="text-sm text-white/60">Monitor tune performance, safety scores, and riding improvements</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-white/90 mb-2">AI Insights</h3>
              <p className="text-sm text-white/60">Machine learning recommendations and behavioral analysis</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold text-white/90 mb-2">Goal Management</h3>
              <p className="text-sm text-white/60">Set and track personal goals with achievement systems</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-semibold text-white/90 mb-2">Community Comparison</h3>
              <p className="text-sm text-white/60">Compare your progress with similar riders and experts</p>
            </div>
          </div>

          <div className="mt-8 space-x-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              View Full Analytics
            </button>
            <button className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
