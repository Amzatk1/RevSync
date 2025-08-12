import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  backgroundColor: string;
  titleColor: string;
  descriptionColor: string;
  buttonText: string;
}

// Match mobile's comprehensive 7-slide onboarding
const onboardingSlides: OnboardingSlide[] = [
  {
    id: "welcome",
    title: "Welcome to RevSync",
    description: "Experience effortless motorcycle tuning and management, crafted for passionate riders. Get started in minutes—your best ride awaits.",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop&crop=center",
    backgroundColor: "#f8f9fa",
    titleColor: "#212529",
    descriptionColor: "#495057",
    buttonText: "Get Started",
  },
  {
    id: "ai_powered",
    title: "AI‑Powered Tuning",
    subtitle: "Smart Technology",
    description: "Let RevSync analyze your bike and riding habits to deliver personalized, optimized tunes—balancing peak performance and reliability.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop&crop=center",
    backgroundColor: "#f8f9fa",
    titleColor: "#212529",
    descriptionColor: "#495057",
    buttonText: "Amazing!",
  },
  {
    id: "safety_first",
    title: "Safety Comes Standard",
    subtitle: "Your Protection Matters",
    description: "Every adjustment is thoroughly checked for safety. RevSync's advanced analysis helps protect your engine and keeps your ride dependable.",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=400&fit=crop&crop=center",
    backgroundColor: "#f8f9fa",
    titleColor: "#212529",
    descriptionColor: "#495057",
    buttonText: "Got It",
  },
  {
    id: "your_garage",
    title: "Your Digital Garage",
    subtitle: "Manage Your Rides",
    description: "Easily add your motorcycles, track modifications and service, and keep a seamless record of every tune—all in one place.",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop&crop=center",
    backgroundColor: "#f8f9fa",
    titleColor: "#212529",
    descriptionColor: "#495057",
    buttonText: "Cool!",
  },
  {
    id: "discover_tunes",
    title: "Explore World-Class Tunes",
    subtitle: "Endless Possibilities",
    description: "Browse a global library of verified tunes. Find the perfect match by filtering for your goals, riding style, and bike compatibility.",
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=400&fit=crop&crop=center",
    backgroundColor: "#f8f9fa",
    titleColor: "#212529",
    descriptionColor: "#495057",
    buttonText: "Awesome!",
  },
  {
    id: "join_community",
    title: "Connect & Share",
    subtitle: "Join the RevSync Community",
    description: "Ask questions, share your results, and learn from real riders. Get inspired and grow with a passionate, global community.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop&crop=center",
    backgroundColor: "#f8f9fa",
    titleColor: "#212529",
    descriptionColor: "#495057",
    buttonText: "Perfect!",
  },
  {
    id: "ready",
    title: "You're Ready to Ride",
    subtitle: "Let's Get Started",
    description: "Complete your profile and choose your first tune. Need help? Reach out to Amzat Karim at karimamzat26@gmail.com anytime.",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=400&fit=crop&crop=center",
    backgroundColor: "#f8f9fa",
    titleColor: "#212529",
    descriptionColor: "#495057",
    buttonText: "Let's Start!",
  },
];

const ProgressDot: React.FC<{ active: boolean; index: number; total: number }> = ({ active, index, total }) => (
  <div 
    className={`h-2 rounded-full transition-all duration-300 ${
      active ? 'bg-blue-600 w-8' : 'bg-gray-200 w-2'
    }`}
    aria-label={`Step ${index + 1} of ${total}`}
  />
);

const WelcomeOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auth guards - only show for new users
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate('/auth/login');
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  useEffect(() => {
    if (!auth.isLoading && auth.user?.onboardingCompleted) {
      navigate('/dashboard');
    }
  }, [auth.isLoading, auth.user?.onboardingCompleted, navigate]);

  const currentSlide = useMemo(() => onboardingSlides[currentPage], [currentPage]);

  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    if (currentPage < onboardingSlides.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      // Navigate to technical onboarding (like mobile)
      navigate('/onboarding/safety-disclaimer');
    }
  };

  const handlePrevious = () => {
    if (isAnimating || currentPage === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setCurrentPage(prev => prev - 1);
  };

  const handlePageChange = (pageIndex: number) => {
    if (isAnimating || pageIndex === currentPage) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setCurrentPage(pageIndex);
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white shadow-sm">
        <div className="text-xl font-bold text-gray-900">RevSync</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Step {currentPage + 1} / {onboardingSlides.length}
          </span>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Image */}
        <div className="lg:w-1/2 relative">
          <div className="h-64 lg:h-full relative overflow-hidden">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isAnimating ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/20 to-transparent" />
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="lg:w-1/2 flex flex-col justify-center p-8 lg:p-12 bg-white">
          <div className={`transition-all duration-500 ${
            isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}>
            {/* Subtitle */}
            {currentSlide.subtitle && (
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                {currentSlide.subtitle}
              </p>
            )}

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {currentSlide.title}
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              {currentSlide.description}
            </p>

            {/* Progress Dots */}
            <div className="flex items-center gap-2 mb-8">
              {onboardingSlides.map((_, index) => (
                <ProgressDot
                  key={index}
                  active={index === currentPage}
                  index={index}
                  total={onboardingSlides.length}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              {currentPage > 0 && (
                <button
                  onClick={handlePrevious}
                  disabled={isAnimating}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={isAnimating}
                className="flex-1 lg:flex-initial px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {currentSlide.buttonText}
              </button>
            </div>

            {/* Quick Jump */}
            <div className="mt-6 text-sm text-gray-500">
              Already familiar?{' '}
              <button
                onClick={() => navigate('/onboarding')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Jump to setup →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar (Mobile) */}
      <div className="lg:hidden bg-white p-4 border-t">
        <div className="flex justify-center gap-1">
          {onboardingSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index)}
              className={`w-8 h-2 rounded-full transition-colors ${
                index === currentPage ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeOnboardingPage;
