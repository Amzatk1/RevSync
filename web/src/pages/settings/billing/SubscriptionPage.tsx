import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Subscription Page - World-class subscription management
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  currentPlan?: boolean;
}

interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
}

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    document.title = 'Subscription • Settings • RevSync';
  }, []);

  // Mock subscription data
  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      currency: 'USD',
      interval: 'month',
      features: [
        'Basic tune recommendations',
        'Community access',
        'Up to 3 motorcycles',
        'Standard safety checks',
        'Email support',
      ],
    },
    {
      id: 'pro_monthly',
      name: 'Pro',
      description: 'For serious riders',
      price: billingInterval === 'monthly' ? 29 : 290,
      currency: 'USD',
      interval: billingInterval === 'monthly' ? 'month' : 'year',
      features: [
        'AI-powered tune recommendations',
        'Unlimited motorcycles',
        'Advanced performance analytics',
        'Custom tune creation',
        'Priority support',
        'Exclusive tune library',
        'Real-time diagnostics',
      ],
      isPopular: true,
      currentPlan: true,
    },
    {
      id: 'expert_monthly',
      name: 'Expert',
      description: 'Professional tuning platform',
      price: billingInterval === 'monthly' ? 99 : 990,
      currency: 'USD',
      interval: billingInterval === 'monthly' ? 'month' : 'year',
      features: [
        'Everything in Pro',
        'Professional tuning tools',
        'Marketplace revenue sharing',
        'White-label solutions',
        'Direct engineer support',
        'Beta feature access',
        'API access',
        'Custom integrations',
      ],
    },
  ];

  const currentSubscription: UserSubscription = {
    id: 'sub_123',
    plan: plans[1], // Pro plan
    status: 'active',
    currentPeriodStart: '2024-01-15T00:00:00Z',
    currentPeriodEnd: '2024-02-15T00:00:00Z',
    cancelAtPeriodEnd: false,
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    if (price === 0) return 'Free';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
    return `${formatted}/${interval}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">Active</span>;
      case 'trialing':
        return <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full">Trial</span>;
      case 'canceled':
        return <span className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded-full">Canceled</span>;
      case 'past_due':
        return <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-sm rounded-full">Past Due</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/80 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4">
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
                <h1 className="text-2xl font-bold text-white/90">Subscription Management</h1>
                <p className="text-sm text-white/60">Manage your RevSync subscription and billing</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Current Subscription */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white/90 mb-6">Current Subscription</h2>
          
          <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white/90">{currentSubscription.plan.name}</h3>
                  {getStatusBadge(currentSubscription.status)}
                </div>
                <p className="text-white/60">{currentSubscription.plan.description}</p>
                <p className="text-sm text-white/50">
                  Next billing: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white/90">
                {formatPrice(currentSubscription.plan.price, currentSubscription.plan.currency, currentSubscription.plan.interval)}
              </div>
              <button className="mt-2 px-4 py-2 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors text-sm">
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/[0.03] rounded-xl border border-white/10 p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingInterval === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/[0.03] rounded-2xl border overflow-hidden ${
                plan.isPopular 
                  ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : 'border-white/10'
              } ${
                plan.currentPlan 
                  ? 'ring-2 ring-green-500/50' 
                  : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-center">
                  <span className="text-white text-sm font-medium">Most Popular</span>
                </div>
              )}
              
              <div className={`p-6 ${plan.isPopular ? 'pt-12' : ''}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white/90 mb-2">{plan.name}</h3>
                  <p className="text-white/60 text-sm mb-4">{plan.description}</p>
                  <div className="text-3xl font-bold text-white/90">
                    {formatPrice(plan.price, plan.currency, plan.interval)}
                  </div>
                  {billingInterval === 'yearly' && plan.price > 0 && (
                    <p className="text-white/50 text-sm mt-1">
                      ${Math.round(plan.price / 12)}/month when billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-green-400">✓</span>
                      <span className="text-white/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    plan.currentPlan
                      ? 'bg-green-600/20 text-green-400 cursor-default'
                      : plan.isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-white/20 text-white/90 hover:bg-white/5'
                  }`}
                  disabled={plan.currentPlan}
                >
                  {plan.currentPlan ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Usage & Limits */}
        <div className="mt-8 bg-white/[0.03] rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white/90 mb-6">Usage & Limits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">Motorcycles</span>
                <span className="text-white/60">7 / Unlimited</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/5"></div>
              </div>
            </div>
            
            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">Tune Downloads</span>
                <span className="text-white/60">42 / Unlimited</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-2/5"></div>
              </div>
            </div>
            
            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">AI Recommendations</span>
                <span className="text-white/60">156 / Unlimited</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPage;
