import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Tune Compare Page - Side-by-side comparison of multiple tunes
const TuneComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTunes, setSelectedTunes] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Compare Tunes • RevSync Marketplace';
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
                <h1 className="text-2xl font-bold text-white/90">Compare Tunes</h1>
                <p className="text-sm text-white/60">Side-by-side comparison of tune performance and features</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚖️</div>
          <h2 className="text-3xl font-bold text-white/90 mb-4">Advanced Tune Comparison</h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Compare multiple tunes side-by-side with detailed performance metrics, safety analysis, and compatibility information to make informed decisions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-white/90 mb-2">Performance Metrics</h3>
              <p className="text-sm text-white/60">HP, torque, fuel economy comparison charts</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="font-semibold text-white/90 mb-2">Safety Analysis</h3>
              <p className="text-sm text-white/60">Risk assessment and safety score comparison</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-semibold text-white/90 mb-2">Value Analysis</h3>
              <p className="text-sm text-white/60">Price-to-performance ratio and cost comparison</p>
            </div>
          </div>

          <div className="mt-8">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Select Tunes to Compare
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TuneComparePage;
