import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Edit Bike Page - Professional motorcycle editing with comprehensive form validation
// Enhanced web version with rich features, validation, and seamless UX

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

// ---- Supabase Client ----
let supabase: SupabaseClient | null = null;
try {
  const url = (process.env.REACT_APP_SUPABASE_URL || '').trim();
  const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
  if (url && key) {
    supabase = createClient(url, key);
  }
} catch {}

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
const useBikeDetail = (bikeId: string) =>
  useQuery({
    queryKey: ['garage', 'bike', bikeId],
    queryFn: async (): Promise<BikeFormData> => {
      if (!supabase) {
        // Mock data for development
        return {
          make: 'Yamaha',
          model: 'R1',
          year: 2023,
          displacement_cc: 998,
          max_power_hp: 200,
          max_torque_nm: 113,
          fuel_type: 'Gasoline',
          engine_type: 'Inline-4',
          transmission: '6-speed',
          vin: 'JYARN23E0PA123456',
          ecu_type: 'Mikuni',
          connection_protocol: 'OBD-II',
          abs: true,
          traction_control: true,
          quick_shifter: true,
          launch_control: true,
          wheelie_control: true,
          engine_braking_control: true,
          notes: 'Track-focused setup with Akrapovic exhaust and custom ECU mapping',
          purchase_date: '2023-05-15',
          purchase_price: 18999,
          mileage_km: 15420,
          service_due_km: 16000,
          service_due_date: '2024-03-15',
          insurance_expiry: '2024-05-15',
          image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
        };
      }

      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .eq('id', bikeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bikeId,
    staleTime: 30_000,
  });

const useUpdateBike = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bikeId, formData }: { bikeId: string; formData: BikeFormData }) => {
      if (!supabase) {
        // Mock successful response for development
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { id: bikeId, success: true };
      }

      const { data, error } = await supabase
        .from('motorcycles')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bikeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['garage', 'motorcycles'] });
      queryClient.invalidateQueries({ queryKey: ['garage', 'bike', variables.bikeId] });
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
const EditBikePage: React.FC = () => {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const bikeQuery = useBikeDetail(bikeId!);
  const updateBikeMutation = useUpdateBike();
  
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
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (bikeQuery.data) {
      setFormData(bikeQuery.data);
      document.title = `Edit ${bikeQuery.data.year} ${bikeQuery.data.make} ${bikeQuery.data.model} • RevSync`;
    }
  }, [bikeQuery.data]);

  const handleInputChange = (field: keyof BikeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await updateBikeMutation.mutateAsync({ bikeId: bikeId!, formData });
      setHasChanges(false);
      navigate(`/garage/${bikeId}`);
    } catch (error) {
      console.error('Failed to update bike:', error);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/garage/${bikeId}`);
      }
    } else {
      navigate(`/garage/${bikeId}`);
    }
  };

  if (bikeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
        <div className="animate-pulse">
          <div className="h-16 bg-white/5 border-b border-white/10" />
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="space-y-6">
              <div className="h-8 bg-white/10 rounded w-1/3" />
              <div className="h-96 bg-white/5 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bikeQuery.isError || !bikeQuery.data) {
    return (
      <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-white/90 mb-2">Motorcycle Not Found</h1>
          <p className="text-white/60 mb-4">The motorcycle you're trying to edit doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/garage')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Garage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--rs-bg,#0b0b0c)] text-[var(--rs-fg,#e8e8ea)]">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/60 border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white/90">Edit Motorcycle</h1>
              <p className="text-sm text-white/60 mt-1">
                {formData.year} {formData.make} {formData.model}
              </p>
            </div>
            <button
              onClick={handleCancel}
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
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 mb-8">
            
            {/* Basic Information */}
            <section className="mb-8">
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
                  <label className="block text-sm font-medium text-white/80 mb-2">VIN</label>
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
            </section>

            {/* Performance Specifications */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Performance Specifications</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </section>

            {/* Technical Specifications */}
            <section className="mb-8">
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
              </div>

              {/* Electronic Features */}
              <div className="mt-6">
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
            </section>

            {/* Maintenance & Ownership */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white/90 mb-6">Maintenance & Ownership</h2>
              
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

              <div className="mt-6">
                <label className="block text-sm font-medium text-white/80 mb-2">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value || undefined)}
                  placeholder="Additional notes about your motorcycle..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-white/20 text-white/90 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateBikeMutation.isPending || !hasChanges}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateBikeMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

          {updateBikeMutation.isError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300">Failed to update motorcycle. Please try again.</p>
            </div>
          )}

          {hasChanges && (
            <div className="mt-4 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
              <p className="text-yellow-300 text-sm">You have unsaved changes.</p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default EditBikePage;
