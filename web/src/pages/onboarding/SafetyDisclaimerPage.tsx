import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SafetyDisclaimerPage: React.FC = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptedRisks, setAcceptedRisks] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [acceptedCompliance, setAcceptedCompliance] = useState(false);
  const [acceptedProfessional, setAcceptedProfessional] = useState(false);

  // Auth guards - only show for new users
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) navigate('/auth/login');
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  useEffect(() => {
    if (!auth.isLoading && auth.user?.onboardingCompleted) navigate('/dashboard');
  }, [auth.isLoading, auth.user?.onboardingCompleted, navigate]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const paddingToBottom = 20;
    
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + paddingToBottom) {
      if (!hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleAcceptanceChange = (type: string) => {
    switch (type) {
      case "risks":
        setAcceptedRisks(!acceptedRisks);
        break;
      case "legal":
        setAcceptedLegal(!acceptedLegal);
        break;
      case "compliance":
        setAcceptedCompliance(!acceptedCompliance);
        break;
      case "professional":
        setAcceptedProfessional(!acceptedProfessional);
        break;
    }
  };

  const canProceed = () => {
    return (
      acceptedRisks &&
      acceptedLegal &&
      acceptedCompliance &&
      acceptedProfessional &&
      hasScrolledToBottom
    );
  };

  const handleAccept = () => {
    if (!canProceed()) {
      alert("Please scroll through the entire disclaimer and accept all terms before proceeding.");
      return;
    }
    
    // Save acceptance locally
    localStorage.setItem("safety_disclaimer_accepted", "true");
    localStorage.setItem("safety_disclaimer_date", new Date().toISOString());
    localStorage.setItem("safety_disclaimer_version", "2025.2");
    
    navigate('/onboarding/privacy-preferences');
  };

  const handleDecline = () => {
    if (confirm("You must accept the safety disclaimer to use tuning features. Are you sure you want to decline?")) {
      navigate('/dashboard');
    }
  };

  const handleContactSupport = () => {
    window.open('mailto:safety@revsync.com?subject=Safety Question', '_blank');
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
      <div className="bg-red-500 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-bold">Safety First</h1>
          <p className="text-red-100 mt-2">Motorcycle Tuning Safety Disclaimer</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="bg-white rounded-lg shadow-lg p-8 max-h-96 overflow-y-auto mb-6"
        >
          {/* Critical Warning */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-start">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-bold text-lg">CRITICAL SAFETY WARNING</h3>
                <p className="text-red-700 mt-2">
                  Motorcycle ECU tuning carries significant risk. Read this entire notice. Tuning can affect safety, 
                  reliability, emissions compliance and insurance. Proceed only if you fully understand the risks.
                </p>
              </div>
            </div>
          </div>

          {/* Performance Risks */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              ⚠️ PERFORMANCE RISKS
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">Engine and vehicle systems may be damaged or fail, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Engine/ECU damage or failure</li>
                <li>Drivetrain and transmission stress</li>
                <li>Braking and suspension overload</li>
                <li>Tyre wear, degradation or blowouts</li>
                <li>Loss of control or traction</li>
                <li>Fire risk and heat‑related damage</li>
              </ul>
            </div>
          </section>

          {/* Legal Compliance */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              🏛️ LEGAL COMPLIANCE
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">You are responsible for legal compliance where you ride. Examples include:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>UK: DVSA/MOT rules and Road Vehicles (Construction & Use) regs; road‑use legality and noise limits</li>
                <li>EU/EEA: Type‑approval and Euro 4/5 emissions and sound requirements</li>
                <li>US: EPA federal rules; state laws including California CARB (EO exemptions) and DOT safety standards</li>
                <li>Other regions: local registration, insurance and roadworthiness rules</li>
                <li>Track/Off‑road only items must not be used on public roads</li>
              </ul>
            </div>
          </section>

          {/* Track/Off-Road Only */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              🏁 TRACK / OFF‑ROAD ONLY
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Some tunes and parts are designated "track / off‑road only." Where required by law, 
              these must not be used on public roads. Always follow local rules and signage.
            </p>
          </section>

          {/* Technical Limitations */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              🔧 TECHNICAL LIMITATIONS
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">Our AI recommendations are advisory:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>May not account for wear, damage or prior modifications</li>
                <li>Cannot predict individual riding style or conditions</li>
                <li>Based on available datasets and community inputs</li>
                <li>May not reflect the latest recalls or service bulletins</li>
                <li>Compatibility is not guaranteed across aftermarket parts or fuels</li>
              </ul>
            </div>
          </section>

          {/* Professional Requirements */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              👨‍🔧 PROFESSIONAL REQUIREMENTS
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">ECU modifications should be performed by qualified professionals:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Licensed motorcycle technicians or certified tuners</li>
                <li>Authorized service centres with appropriate tools</li>
                <li>DYNO‑equipped facilities for validation where applicable</li>
                <li>Technicians experienced with your specific model</li>
              </ul>
            </div>
          </section>

          {/* Your Responsibilities */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              📋 YOUR RESPONSIBILITIES
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">By using RevSync, you agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Consult qualified professionals before modifications</li>
                <li>Verify road‑use legality and emissions/noise rules in your region</li>
                <li>Use proper safety equipment and procedures</li>
                <li>Understand your motorcycle's specifications and limits</li>
                <li>Accept full responsibility for all modifications and their consequences</li>
                <li>Maintain appropriate insurance coverage</li>
                <li>Follow manufacturer and regulatory safety guidance</li>
                <li>Report safety concerns to safety@revsync.com</li>
              </ul>
            </div>
          </section>

          {/* Liability Disclaimer */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              🚫 LIABILITY DISCLAIMER
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">RevSync Ltd and its affiliates disclaim liability for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Personal injury or death</li>
                <li>Property or environmental damage</li>
                <li>Legal violations, penalties or insurance denials</li>
                <li>Vehicle devaluation or performance degradation</li>
              </ul>
              <p className="mt-3 font-semibold">
                RevSync provides advisory recommendations only and does not guarantee safety or compliance.
              </p>
            </div>
          </section>

          {/* Support & Safety Contacts */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              📞 SUPPORT & SAFETY CONTACTS
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">For safety questions or urgent support:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Safety Hotline (UK): +44 20 1234 0000</li>
                <li>Email: safety@revsync.com</li>
                <li>Technical Support: support@revsync.com</li>
                <li>Emergency: contact local emergency services</li>
              </ul>
            </div>
          </section>

          {!hasScrolledToBottom && (
            <div className="text-center py-4 border-t border-gray-200">
              <div className="text-gray-500 text-sm">
                ↓ Scroll to the end to enable Accept
              </div>
            </div>
          )}
        </div>

        {/* Acceptance Checkboxes */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">ACKNOWLEDGMENT REQUIRED</h3>
          <p className="text-gray-600 mb-6">Please acknowledge each section below to proceed:</p>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedRisks}
                onChange={() => handleAcceptanceChange("risks")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I understand the performance and safety risks
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={() => handleAcceptanceChange("legal")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I will ensure legal compliance in my jurisdiction
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedCompliance}
                onChange={() => handleAcceptanceChange("compliance")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I understand AI limitations and technical requirements
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedProfessional}
                onChange={() => handleAcceptanceChange("professional")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I will only use qualified professionals for modifications
              </span>
            </label>
          </div>
        </div>

        {/* Support Link */}
        <div className="text-center mb-6">
          <button
            onClick={handleContactSupport}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ❓ Need help? Contact Safety Support
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 mb-6">
          <p>By continuing you agree to our Terms, Privacy Policy and EULA.</p>
          <p className="mt-1">Last updated: August 8, 2025 • Doc v2025.2</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleDecline}
            className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            ↓ Decline
          </button>
          
          <button
            onClick={handleAccept}
            disabled={!canProceed()}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              canProceed()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            → I Accept All Terms & Responsibilities
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyDisclaimerPage;
