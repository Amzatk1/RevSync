import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Upload Tune Page - Professional tune submission with AI validation
const UploadTunePage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadStep, setUploadStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    compatibility: [],
    price: 0,
    isOpenSource: true,
  });

  useEffect(() => {
    document.title = 'Upload Tune • RevSync Marketplace';
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
                <h1 className="text-2xl font-bold text-white/90">Upload Tune</h1>
                <p className="text-sm text-white/60">Share your tune with the RevSync community</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📤</div>
          <h2 className="text-3xl font-bold text-white/90 mb-4">Professional Tune Upload</h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Upload your motorcycle tune with AI-powered safety validation, automatic compatibility detection, and comprehensive performance analysis.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold text-white/90 mb-2">Tune Information</h3>
              <p className="text-sm text-white/60">Name, description, category, and compatibility details</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">📁</div>
              <h3 className="font-semibold text-white/90 mb-2">File Upload</h3>
              <p className="text-sm text-white/60">ECU files with automatic format validation</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-white/90 mb-2">AI Validation</h3>
              <p className="text-sm text-white/60">Automated safety analysis and performance prediction</p>
            </div>
            <div className="p-6 border border-white/20 rounded-xl">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-white/90 mb-2">Publication</h3>
              <p className="text-sm text-white/60">Review and publish to marketplace</p>
            </div>
          </div>

          <div className="mt-8 space-x-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Start Upload Process
            </button>
            <button className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors">
              Upload Guidelines
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadTunePage;
