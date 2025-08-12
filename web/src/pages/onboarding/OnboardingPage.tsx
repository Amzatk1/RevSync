import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MotorcycleType {
  id: string;
  name: string;
  icon: string;
  description: string;
  examples: string;
  imageUrl: string;
}

interface SelectedBike {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  displacement?: number;
}

interface SkillLevel {
  id: string;
  name: string;
  description: string;
}

interface RidingStyle {
  id: string;
  title: string;
  description: string;
}

interface Goal {
  id: string;
  name: string;
  description: string;
}

interface FormState {
  motorcycleType: string;
  selectedBike: SelectedBike | null;
  skillLevel: string;
  ridingStyle: string;
  ridingExperience?: string;
  performanceGoals: string[];
  safetyTolerance: string;
}

// Match mobile's motorcycle types
const motorcycleTypes: MotorcycleType[] = [
  {
    id: "sport",
    name: "Sportbike",
    icon: "🏁",
    description: "Supersport, track-focused",
    examples: "R1, CBR1000RR, GSX-R1000",
    imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop&crop=center"
  },
  {
    id: "cruiser",
    name: "Cruiser",
    icon: "🛤️",
    description: "Relaxed, low-slung",
    examples: "Harley, Indian, Yamaha Bolt",
    imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=200&fit=crop&crop=center"
  },
  {
    id: "touring",
    name: "Touring",
    icon: "🛣️",
    description: "Long-distance comfort",
    examples: "K1600GT, FJR1300, Concours",
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop&crop=center"
  },
  {
    id: "adventure",
    name: "Adventure",
    icon: "🏔️",
    description: "On/off-road capability",
    examples: "GS1250, KTM Adventure, Africa Twin",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300&h=200&fit=crop&crop=center"
  },
  {
    id: "standard",
    name: "Standard",
    icon: "🏙️",
    description: "Urban riding, comfortable",
    examples: "MT-09, Z900, Street Triple",
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=200&fit=crop&crop=center"
  },
  {
    id: "other",
    name: "Other",
    icon: "🏜️",
    description: "Other motorcycle types",
    examples: "YZ450F, CRF450R, KX450",
    imageUrl: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=200&fit=crop&crop=center"
  },
];

// Match mobile's skill levels
const skillLevels: SkillLevel[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "New to riding or have limited experience.",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Comfortable with basic riding skills and some experience.",
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Experienced rider with advanced skills and confidence.",
  },
];

// Match mobile's riding styles
const ridingStyles: RidingStyle[] = [
  {
    id: "casual",
    title: "Casual Cruising",
    description: "Relaxed rides, scenic routes, and leisurely pace",
  },
  {
    id: "commuting",
    title: "Daily Commuting",
    description: "City riding, traffic navigation, fuel efficiency",
  },
  {
    id: "sport",
    title: "Sport Riding",
    description: "Performance-focused, spirited rides, handling",
  },
  {
    id: "touring",
    title: "Long Distance Touring",
    description: "Extended journeys, comfort, reliability",
  },
  {
    id: "track",
    title: "Track Days",
    description: "Racing circuits, maximum performance, lap times",
  },
  {
    id: "adventure",
    title: "Adventure Riding",
    description: "Off-road exploration, dual-sport adventures",
  },
];

// Match mobile's goals
const goals: Goal[] = [
  {
    id: "performance",
    name: "Improve Performance",
    description: "Unlock your bike's full potential.",
  },
  {
    id: "efficiency",
    name: "Increase Fuel Efficiency",
    description: "Go further on every tank.",
  },
  {
    id: "track",
    name: "Improve Track Times",
    description: "Shave seconds off your lap.",
  },
  {
    id: "torque",
    name: "More Torque",
    description: "Increase low-end power delivery.",
  },
  {
    id: "top_speed",
    name: "Top Speed",
    description: "Maximize high-end performance.",
  },
  {
    id: "comfort",
    name: "Touring Comfort",
    description: "Optimize for long-distance rides.",
  },
];

const safetyTolerances = [
  { id: 'conservative', name: 'Conservative', description: 'Safety first, minimal risk' },
  { id: 'moderate', name: 'Moderate', description: 'Balanced performance and safety' },
  { id: 'aggressive', name: 'Aggressive', description: 'Maximum performance, higher risk' },
];

const steps = ['Motorcycle', 'Bike Search', 'Skill Level', 'Riding Style', 'Goals', 'Summary'] as const;

type StepKey = typeof steps[number];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth, completeOnboarding } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bikeSearch, setBikeSearch] = useState('');
  const [form, setForm] = useState<FormState>({
    motorcycleType: '',
    selectedBike: null,
    skillLevel: '',
    ridingStyle: '',
    ridingExperience: '',
    performanceGoals: [],
    safetyTolerance: '',
  });

  // Guards: must be logged in and not completed
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

  const step: StepKey = steps[stepIndex];

  const update = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 'Motorcycle') {
      if (!form.motorcycleType.trim()) e.motorcycleType = 'Please select your motorcycle type';
    } else if (step === 'Skill Level') {
      if (!form.skillLevel) e.skillLevel = 'Select your riding skill level';
    } else if (step === 'Riding Style') {
      if (!form.ridingStyle) e.ridingStyle = 'Select your riding style';
    } else if (step === 'Goals') {
      if (form.performanceGoals.length === 0) e.performanceGoals = 'Pick at least one goal';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  };

  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  const toggleGoal = (goalId: string) => {
    setForm((prev) => {
      const has = prev.performanceGoals.includes(goalId);
      return {
        ...prev,
        performanceGoals: has
          ? prev.performanceGoals.filter((g) => g !== goalId)
          : [...prev.performanceGoals, goalId],
      };
    });
  };

  const handleBikeSearch = (query: string) => {
    setBikeSearch(query);
    // In a real app, this would search a motorcycle database
    // For now, we'll just create a mock bike entry
    if (query.length > 3) {
      const [manufacturer, ...modelParts] = query.split(' ');
      const model = modelParts.join(' ') || 'Unknown Model';
      update('selectedBike', {
        id: `manual_${Date.now()}`,
        manufacturer: manufacturer || 'Unknown',
        model,
        year: new Date().getFullYear(),
      });
    }
  };

  const submit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    
    try {
      const res = await completeOnboarding({
        motorcycleType: form.motorcycleType,
        skillLevel: form.skillLevel,
        ridingStyle: form.ridingStyle,
        ridingExperience: form.ridingExperience,
        performanceGoals: form.performanceGoals,
        safetyTolerance: form.safetyTolerance,
        selectedBike: form.selectedBike,
      });
      
      if (res.success) {
        navigate('/dashboard');
      } else {
        alert(res.error || 'Failed to complete onboarding. Please try again.');
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      alert('Connection error. Your data is saved locally and will sync when possible.');
      navigate('/dashboard');
    }
    
    setSaving(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Setup Your Profile</h1>
            <div className="text-sm text-gray-500">Step {stepIndex + 1} / {steps.length}</div>
          </div>
          
          {/* Progress */}
          <div className="mt-4 flex gap-2">
            {steps.map((s, i) => (
              <div 
                key={s} 
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {step === 'Motorcycle' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of motorcycle do you have?</h2>
                  <p className="text-gray-600 mb-8">Select the type that best describes your motorcycle.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {motorcycleTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => update('motorcycleType', type.id)}
                        className={`relative p-4 border-2 rounded-xl transition-all ${
                          form.motorcycleType === type.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-[4/3] mb-3 rounded-lg overflow-hidden">
                          <img
                            src={type.imageUrl}
                            alt={type.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{type.icon}</span>
                            <span className="font-semibold text-gray-900">{type.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                          <p className="text-xs text-gray-500">{type.examples}</p>
                        </div>
                        {form.motorcycleType === type.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.motorcycleType && <p className="mt-4 text-sm text-red-600">{errors.motorcycleType}</p>}
                </div>
              )}

              {step === 'Bike Search' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Specific Bike</h2>
                  <p className="text-gray-600 mb-8">Search for your exact motorcycle model (optional but recommended).</p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search by make and model
                      </label>
                      <input
                        type="text"
                        value={bikeSearch}
                        onChange={(e) => handleBikeSearch(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Yamaha MT-09 2022, Kawasaki Ninja 650"
                      />
                    </div>
                    
                    {form.selectedBike && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="font-medium text-green-900">
                            {form.selectedBike.manufacturer} {form.selectedBike.model} ({form.selectedBike.year})
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <button
                        onClick={() => {
                          update('selectedBike', null);
                          setBikeSearch('');
                          next();
                        }}
                        className="text-blue-600 hover:text-blue-500 text-sm"
                      >
                        Skip - I'll add this later
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'Skill Level' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">How would you describe your riding experience?</h2>
                  <p className="text-gray-600 mb-8">This helps us recommend appropriate tunes for your skill level.</p>
                  
                  <div className="space-y-4">
                    {skillLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => update('skillLevel', level.id)}
                        className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                          form.skillLevel === level.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{level.name}</h3>
                            <p className="text-gray-600 mt-1">{level.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            form.skillLevel === level.id
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {form.skillLevel === level.id && (
                              <div className="w-full h-full rounded-full bg-white transform scale-50" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.skillLevel && <p className="mt-4 text-sm text-red-600">{errors.skillLevel}</p>}
                </div>
              )}

              {step === 'Riding Style' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your riding style?</h2>
                  <p className="text-gray-600 mb-8">This helps us recommend tunes that match how you ride.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ridingStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => update('ridingStyle', style.id)}
                        className={`p-6 border-2 rounded-xl text-left transition-all ${
                          form.ridingStyle === style.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">{style.title}</h3>
                        <p className="text-gray-600">{style.description}</p>
                        {form.ridingStyle === style.id && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Selected
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.ridingStyle && <p className="mt-4 text-sm text-red-600">{errors.ridingStyle}</p>}
                </div>
              )}

              {step === 'Goals' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your goals?</h2>
                  <p className="text-gray-600 mb-8">Select all that apply. This personalizes your tune recommendations.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`p-6 border-2 rounded-xl text-left transition-all ${
                          form.performanceGoals.includes(goal.id)
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">{goal.name}</h3>
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          </div>
                          <div className={`w-6 h-6 border-2 rounded ${
                            form.performanceGoals.includes(goal.id)
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {form.performanceGoals.includes(goal.id) && (
                              <span className="text-white text-sm block text-center">✓</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.performanceGoals && <p className="mt-4 text-sm text-red-600">{errors.performanceGoals}</p>}
                </div>
              )}

              {step === 'Summary' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Profile</h2>
                  <p className="text-gray-600 mb-8">Please review your selections before completing setup.</p>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SummaryCard
                        title="Motorcycle"
                        value={motorcycleTypes.find(t => t.id === form.motorcycleType)?.name || 'Not selected'}
                        icon="🏍️"
                      />
                      {form.selectedBike && (
                        <SummaryCard
                          title="Specific Bike"
                          value={`${form.selectedBike.manufacturer} ${form.selectedBike.model}`}
                          icon="🔧"
                        />
                      )}
                      <SummaryCard
                        title="Skill Level"
                        value={skillLevels.find(l => l.id === form.skillLevel)?.name || 'Not selected'}
                        icon="⭐"
                      />
                      <SummaryCard
                        title="Riding Style"
                        value={ridingStyles.find(s => s.id === form.ridingStyle)?.title || 'Not selected'}
                        icon="🛣️"
                      />
                    </div>
                    
                    {form.performanceGoals.length > 0 && (
                      <div className="border border-gray-200 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          🎯 Performance Goals
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {form.performanceGoals.map(goalId => {
                            const goal = goals.find(g => g.id === goalId);
                            return goal ? (
                              <span key={goalId} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {goal.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex items-center gap-4">
                {stepIndex > 0 && (
                  <button
                    onClick={back}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                )}

                {stepIndex < steps.length - 1 ? (
                  <button
                    onClick={next}
                    className="flex-1 lg:flex-initial px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    disabled={saving}
                    onClick={submit}
                    className="flex-1 lg:flex-initial px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-60"
                  >
                    {saving ? 'Completing Setup...' : 'Complete Setup 🎉'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg mb-6" />
              <h3 className="font-semibold text-gray-900 mb-4">💡 Pro Tips</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Your preferences help our AI recommend the perfect tunes for your riding style.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>You can update these settings anytime in your profile.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>More specific bike info = better tune recommendations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Safety settings help balance performance with reliability.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon }) => (
  <div className="border border-gray-200 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-gray-600">{value}</p>
      </div>
    </div>
  </div>
);

export default OnboardingPage;
