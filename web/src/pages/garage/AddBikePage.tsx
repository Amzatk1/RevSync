import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

// Add Bike Page - Professional motorcycle registration with comprehensive form
// Enhanced web version with rich features, validation, and backend integration

// ---- Types ----
interface BikeFormData {
  make: string;
  model: string;
  year: number;
  displacement_cc?: number;
  max_power_hp?: number;
  max_torque_nm?: number;
  fuel_type: string;
  engine_type: string;
  transmission: string;
  vin?: string;
  ecu_type: string;
  connection_protocol: string;
  abs: boolean;
  traction_control: boolean;
  quick_shifter: boolean;
  launch_control: boolean;
  wheelie_control: boolean;
  engine_braking_control: boolean;
  notes?: string;
  purchase_date?: string;
  purchase_price?: number;
  mileage_km?: number;
  service_due_km?: number;
  service_due_date?: string;
  insurance_expiry?: string;
  image_url?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// ---- API Configuration ----
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Auth headers hook - using React Context properly
const useAuthHeaders = (): { Authorization?: string } => {
  // For now, return empty headers - this will be replaced with proper auth integration
  // Return type ensures TypeScript knows about the Authorization property
  return {};
};

// ---- Constants ----
const MOTORCYCLE_MAKES = [
  'Yamaha', 'Honda', 'Kawasaki', 'Suzuki', 'Ducati', 'BMW', 'KTM', 'Aprilia', 
  'Triumph', 'Harley-Davidson', 'Indian', 'Royal Enfield', 'Husqvarna', 'MV Agusta'
];

const FUEL_TYPES = ['Gasoline', 'Electric', 'Hybrid'];

const ENGINE_TYPES = [
  'Single', 'Parallel Twin', 'V-Twin', 'Inline-3', 'Inline-4', 
  'V4', 'Boxer Twin', 'Triple', 'V6', 'Electric Motor'
];

const TRANSMISSION_TYPES = [
  '6-speed', '5-speed', '4-speed', 'CVT', 'Automatic', 'Single-speed'
];

const ECU_TYPES = [
  'Mikuni', 'Keihin', 'Magneti Marelli', 'Bosch', 'Denso', 'Continental', 
  'Delphi', 'Siemens', 'Custom', 'Other'
];

const CONNECTION_PROTOCOLS = [
  'OBD-II', 'CAN-Bus', 'K-Line', 'Bluetooth', 'WiFi', 'USB', 'Serial', 'Custom'
];

// ---- Hooks ----
const useAddBike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: BikeFormData) => {
      if (!supabase) {
        // Mock successful response for development
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { id: 'new-bike-id', success: true };
      }

      const { data, error } = await supabase
        .from('motorcycles')
        .insert([{
          ...formData,
          current_tune: 'Stock',
          connection_status: 'never_connected',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage', 'motorcycles'] });
      queryClient.invalidateQueries({ queryKey: ['garage', 'stats'] });
    },
  });
};

// ---- Validation ----
const validateForm = (data: BikeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.make.trim()) errors.make = 'Make is required';
  if (!data.model.trim()) errors.model = 'Model is required';
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.year = 'Valid year is required';
  }
  if (!data.fuel_type) errors.fuel_type = 'Fuel type is required';
  if (!data.engine_type) errors.engine_type = 'Engine type is required';
  if (!data.transmission) errors.transmission = 'Transmission is required';
  if (!data.ecu_type) errors.ecu_type = 'ECU type is required';
  if (!data.connection_protocol) errors.connection_protocol = 'Connection protocol is required';

  if (data.displacement_cc && (data.displacement_cc < 50 || data.displacement_cc > 3000)) {
    errors.displacement_cc = 'Displacement must be between 50-3000cc';
  }

  if (data.max_power_hp && (data.max_power_hp < 1 || data.max_power_hp > 500)) {
    errors.max_power_hp = 'Power must be between 1-500 HP';
  }

  if (data.max_torque_nm && (data.max_torque_nm < 1 || data.max_torque_nm > 300)) {
    errors.max_torque_nm = 'Torque must be between 1-300 Nm';
  }

  if (data.vin && (data.vin.length < 10 || data.vin.length > 17)) {
    errors.vin = 'VIN must be 10-17 characters';
  }

  if (data.purchase_price && data.purchase_price < 0) {
    errors.purchase_price = 'Purchase price cannot be negative';
  }

  if (data.mileage_km && data.mileage_km < 0) {
    errors.mileage_km = 'Mileage cannot be negative';
  }

  return errors;
};

// ---- Component ----
const AddBikePage: React.FC = () => {
  const navigate = useNavigate();
  const addBikeMutation = useAddBike();
  const authHeaders = useAuthHeaders();
  
  const [formData, setFormData] = useState<BikeFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'Gasoline',
    engine_type: 'Inline-4',
    transmission: '6-speed',
    ecu_type: 'Mikuni',
    connection_protocol: 'OBD-II',
    abs: true,
    traction_control: true,
    quick_shifter: false,
    launch_control: false,
    wheelie_control: false,
    engine_braking_control: false,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState(0); // Start with search step
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const totalSteps = 4; // 0: Search, 1: Basic, 2: Tech, 3: Additional

  useEffect(() => {
    document.title = 'Add Motorcycle • RevSync';
  }, []);

  const handleInputChange = (field: keyof BikeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Search motorcycles in database
  const searchMotorcycles = async (query: string) => {
    if (!query.trim() || !authHeaders.Authorization) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/garage/search-bikes/?search=${encodeURIComponent(query)}`,
        {
          headers: authHeaders.Authorization ? {
            'Content-Type': 'application/json',
            ...authHeaders,
          } : {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add existing motorcycle to garage
  const addExistingMotorcycle = async (motorcycle: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/garage/`, {
        method: 'POST',
        headers: authHeaders.Authorization ? {
          'Content-Type': 'application/json',
          ...authHeaders,
        } : {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motorcycle_id: motorcycle.id,
          ownership_status: 'owned',
          purchase_date: null,
          purchase_price: null,
          current_mileage_km: null,
        }),
      });

      if (response.ok) {
        navigate('/garage');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add motorcycle');
      }
    } catch (error) {
      console.error('Failed to add motorcycle:', error);
      alert('Failed to add motorcycle');
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Search step - just move to custom form
      setCurrentStep(1);
      return;
    }

    const stepValidation = validateForm(formData);
    const stepErrors: ValidationErrors = {};

    // Validate current step
    if (currentStep === 1) {
      ['make', 'model', 'year', 'fuel_type', 'engine_type', 'transmission'].forEach(field => {
        if (stepValidation[field]) stepErrors[field] = stepValidation[field];
      });
    } else if (currentStep === 2) {
      ['ecu_type', 'connection_protocol'].forEach(field => {
        if (stepValidation[field]) stepErrors[field] = stepValidation[field];
      });
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/garage/add-custom-bike/`, {
        method: 'POST',
        headers: authHeaders.Authorization ? {
          'Content-Type': 'application/json',
          ...authHeaders,
        } : {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer: formData.make,
          model_name: formData.model,
          year: formData.year,
          displacement_cc: formData.displacement_cc,
          max_power_hp: formData.max_power_hp,
          max_torque_nm: formData.max_torque_nm,
          transmission_type: formData.transmission.includes('6') ? 'manual' : 'manual',
          gears: parseInt(formData.transmission.charAt(0)) || 6,
          abs: formData.abs,
          traction_control: formData.traction_control,
          quickshifter: formData.quick_shifter,
          image_url: formData.image_url,
          purchase_date: formData.purchase_date,
          purchase_price: formData.purchase_price,
          current_mileage_km: formData.mileage_km,
          nickname: '',
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        navigate('/garage');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add custom motorcycle');
      }
    } catch (error) {
      console.error('Failed to add bike:', error);
      alert('Failed to add motorcycle');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${index <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 text-white/50'
            }
          `}>
            {index === 0 ? '🔍' : index}
          </div>
          {index < totalSteps - 1 && (
            <div className={`
              w-12 h-1 mx-2
              ${index < currentStep ? 'bg-blue-600' : 'bg-white/10'}
            `} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderSearchStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white/90 mb-6">Find Your Motorcycle</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Search our database of motorcycles
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length > 2) {
                  searchMotorcycles(e.target.value);
                }
              }}
              placeholder="e.g., Yamaha R1, Honda CBR, Ducati Panigale..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-white/90">Search Results</h3>
            {searchResults.map((bike) => (
              <div
                key={bike.id}
                className="p-4 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white/90">
                      {bike.manufacturer.name} {bike.model_name} ({bike.year})
                    </h4>
                    <p className="text-sm text-white/60">
                      {bike.displacement_cc}cc • {bike.max_power_hp}HP
                      {bike.user_owns && <span className="text-green-400 ml-2">• Already in your garage</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => addExistingMotorcycle(bike)}
                    disabled={bike.user_owns}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      bike.user_owns
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {bike.user_owns ? 'Already Added' : 'Add to Garage'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-6 border border-white/20 rounded-lg">
          <h3 className="text-lg font-medium text-white/90 mb-4">Don't see your motorcycle?</h3>
          <p className="text-white/70 mb-4">
            No problem! You can add custom motorcycles with all the details you want to track.
          </p>
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Add Custom Motorcycle
          </button>
        </div>
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white/90 mb-6">Basic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Make *</label>
          <select
            value={formData.make}
            onChange={(e) => handleInputChange('make', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select make</option>
            {MOTORCYCLE_MAKES.map(make => (
              <option key={make} value={make} className="bg-black">{make}</option>
            ))}
          </select>
          {errors.make && <p className="text-red-400 text-sm mt-1">{errors.make}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Model *</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            placeholder="e.g., R1, CBR1000RR"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.model && <p className="text-red-400 text-sm mt-1">{errors.model}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Year *</label>
          <input
            type="number"
            value={formData.year}
            onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
            min="1900"
            max={new Date().getFullYear() + 1}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.year && <p className="text-red-400 text-sm mt-1">{errors.year}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Displacement (cc)</label>
          <input
            type="number"
            value={formData.displacement_cc || ''}
            onChange={(e) => handleInputChange('displacement_cc', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 998"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.displacement_cc && <p className="text-red-400 text-sm mt-1">{errors.displacement_cc}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Fuel Type *</label>
          <select
            value={formData.fuel_type}
            onChange={(e) => handleInputChange('fuel_type', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FUEL_TYPES.map(type => (
              <option key={type} value={type} className="bg-black">{type}</option>
            ))}
          </select>
          {errors.fuel_type && <p className="text-red-400 text-sm mt-1">{errors.fuel_type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Engine Type *</label>
          <select
            value={formData.engine_type}
            onChange={(e) => handleInputChange('engine_type', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ENGINE_TYPES.map(type => (
              <option key={type} value={type} className="bg-black">{type}</option>
            ))}
          </select>
          {errors.engine_type && <p className="text-red-400 text-sm mt-1">{errors.engine_type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Transmission *</label>
          <select
            value={formData.transmission}
            onChange={(e) => handleInputChange('transmission', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TRANSMISSION_TYPES.map(type => (
              <option key={type} value={type} className="bg-black">{type}</option>
            ))}
          </select>
          {errors.transmission && <p className="text-red-400 text-sm mt-1">{errors.transmission}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">VIN (Optional)</label>
          <input
            type="text"
            value={formData.vin || ''}
            onChange={(e) => handleInputChange('vin', e.target.value || undefined)}
            placeholder="17-character VIN"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.vin && <p className="text-red-400 text-sm mt-1">{errors.vin}</p>}
        </div>
      </div>
    </div>
  );

  const renderTechnicalSpecs = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white/90 mb-6">Technical Specifications</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">ECU Type *</label>
          <select
            value={formData.ecu_type}
            onChange={(e) => handleInputChange('ecu_type', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ECU_TYPES.map(type => (
              <option key={type} value={type} className="bg-black">{type}</option>
            ))}
          </select>
          {errors.ecu_type && <p className="text-red-400 text-sm mt-1">{errors.ecu_type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Connection Protocol *</label>
          <select
            value={formData.connection_protocol}
            onChange={(e) => handleInputChange('connection_protocol', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CONNECTION_PROTOCOLS.map(protocol => (
              <option key={protocol} value={protocol} className="bg-black">{protocol}</option>
            ))}
          </select>
          {errors.connection_protocol && <p className="text-red-400 text-sm mt-1">{errors.connection_protocol}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Max Power (HP)</label>
          <input
            type="number"
            value={formData.max_power_hp || ''}
            onChange={(e) => handleInputChange('max_power_hp', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 200"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.max_power_hp && <p className="text-red-400 text-sm mt-1">{errors.max_power_hp}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Max Torque (Nm)</label>
          <input
            type="number"
            value={formData.max_torque_nm || ''}
            onChange={(e) => handleInputChange('max_torque_nm', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 113"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.max_torque_nm && <p className="text-red-400 text-sm mt-1">{errors.max_torque_nm}</p>}
        </div>
      </div>

      {/* Electronic Features */}
      <div>
        <h3 className="text-lg font-medium text-white/90 mb-4">Electronic Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'abs', label: 'ABS' },
            { key: 'traction_control', label: 'Traction Control' },
            { key: 'quick_shifter', label: 'Quick Shifter' },
            { key: 'launch_control', label: 'Launch Control' },
            { key: 'wheelie_control', label: 'Wheelie Control' },
            { key: 'engine_braking_control', label: 'Engine Braking Control' },
          ].map(feature => (
            <label key={feature.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[feature.key as keyof BikeFormData] as boolean}
                onChange={(e) => handleInputChange(feature.key as keyof BikeFormData, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-transparent border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-white/80">{feature.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdditionalInfo = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white/90 mb-6">Additional Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Current Mileage (km)</label>
          <input
            type="number"
            value={formData.mileage_km || ''}
            onChange={(e) => handleInputChange('mileage_km', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 15000"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.mileage_km && <p className="text-red-400 text-sm mt-1">{errors.mileage_km}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Purchase Date</label>
          <input
            type="date"
            value={formData.purchase_date || ''}
            onChange={(e) => handleInputChange('purchase_date', e.target.value || undefined)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Purchase Price</label>
          <input
            type="number"
            value={formData.purchase_price || ''}
            onChange={(e) => handleInputChange('purchase_price', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="e.g., 18999"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.purchase_price && <p className="text-red-400 text-sm mt-1">{errors.purchase_price}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Insurance Expiry</label>
          <input
            type="date"
            value={formData.insurance_expiry || ''}
            onChange={(e) => handleInputChange('insurance_expiry', e.target.value || undefined)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Service Due (km)</label>
          <input
            type="number"
            value={formData.service_due_km || ''}
            onChange={(e) => handleInputChange('service_due_km', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 20000"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Service Due Date</label>
          <input
            type="date"
            value={formData.service_due_date || ''}
            onChange={(e) => handleInputChange('service_due_date', e.target.value || undefined)}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value || undefined)}
          placeholder="Additional notes about your motorcycle..."
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white/90">Add Motorcycle</h1>
              <p className="text-sm text-white/60 mt-1">Register your motorcycle for tuning and performance tracking</p>
            </div>
            <button
              onClick={() => navigate('/garage')}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <form onSubmit={handleSubmit}>
          {renderStepIndicator()}

          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 mb-8">
            {currentStep === 0 && renderSearchStep()}
            {currentStep === 1 && renderBasicInfo()}
            {currentStep === 2 && renderTechnicalSpecs()}
            {currentStep === 3 && renderAdditionalInfo()}
          </div>

          {/* Navigation */}
          {currentStep > 0 && (
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Custom Motorcycle
                </button>
              )}
            </div>
          )}

          {addBikeMutation.isError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300">Failed to add motorcycle. Please try again.</p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default AddBikePage;
