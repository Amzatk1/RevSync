from typing import List, Dict, Optional, Tuple
from django.db import models
from dataclasses import dataclass
import re
import logging

logger = logging.getLogger(__name__)


@dataclass
class CompatibilityResult:
    """Result of compatibility check"""
    is_compatible: bool
    confidence_score: float  # 0.0 to 1.0
    issues: List[str]
    warnings: List[str]
    required_hardware: List[str]
    connection_method: str


class BikeCompatibilityService:
    """Service for checking bike-tune compatibility"""
    
    # ECU mappings for different manufacturers
    ECU_MAPPINGS = {
        'DUCATI': {
            'panigale_v4': {
                'years': range(2018, 2025),
                'ecu_types': ['Bosch ME17', 'Bosch ME18'],
                'connection': 'DUCATI_3PIN',
                'protocols': ['CAN', 'K_LINE'],
                'flash_supported': True,
            },
            'monster': {
                'years': range(2014, 2025),
                'ecu_types': ['Bosch ME7', 'Bosch ME17'],
                'connection': 'DUCATI_3PIN',
                'protocols': ['CAN', 'K_LINE'],
                'flash_supported': True,
            },
        },
        'YAMAHA': {
            'r6': {
                'years': range(2017, 2025),
                'ecu_types': ['Yamaha YCC-T', 'Yamaha YEC'],
                'connection': 'YAMAHA_4PIN',
                'protocols': ['CAN', 'UART'],
                'flash_supported': True,
            },
            'r1': {
                'years': range(2015, 2025),
                'ecu_types': ['Yamaha YCC-T', 'Yamaha YEC'],
                'connection': 'YAMAHA_4PIN',
                'protocols': ['CAN', 'UART'],
                'flash_supported': True,
            },
        },
        'HONDA': {
            'cbr1000rr': {
                'years': range(2017, 2025),
                'ecu_types': ['Honda PGM-FI', 'Keihin'],
                'connection': 'HONDA_4PIN',
                'protocols': ['CAN', 'K_LINE'],
                'flash_supported': True,
            },
        },
        'KAWASAKI': {
            'zx10r': {
                'years': range(2016, 2025),
                'ecu_types': ['Keihin', 'Denso'],
                'connection': 'KAWASAKI_4PIN',
                'protocols': ['CAN'],
                'flash_supported': True,
            },
        },
    }
    
    def check_compatibility(
        self, 
        motorcycle_data: Dict, 
        tune_data: Dict
    ) -> CompatibilityResult:
        """
        Check if a tune is compatible with a motorcycle
        
        Args:
            motorcycle_data: Dict with make, model, year, ecu_type
            tune_data: Dict with compatible_bikes, ecu_requirements, etc.
        
        Returns:
            CompatibilityResult with detailed compatibility information
        """
        issues = []
        warnings = []
        confidence_score = 1.0
        required_hardware = []
        
        # Basic bike info validation
        if not all(k in motorcycle_data for k in ['make', 'model', 'year']):
            issues.append("Incomplete motorcycle information")
            confidence_score *= 0.5
        
        # Check manufacturer compatibility
        make = motorcycle_data.get('make', '').upper()
        model = motorcycle_data.get('model', '').lower()
        year = motorcycle_data.get('year')
        
        if make not in self.ECU_MAPPINGS:
            issues.append(f"Unsupported motorcycle make: {make}")
            confidence_score *= 0.3
        else:
            # Find matching model
            bike_config = self._find_bike_config(make, model, year)
            if not bike_config:
                issues.append(f"Unsupported model/year combination: {model} {year}")
                confidence_score *= 0.4
            else:
                # Check ECU compatibility
                ecu_result = self._check_ecu_compatibility(
                    motorcycle_data, tune_data, bike_config
                )
                issues.extend(ecu_result['issues'])
                warnings.extend(ecu_result['warnings'])
                confidence_score *= ecu_result['confidence_factor']
                required_hardware.extend(ecu_result['required_hardware'])
        
        # Check year range compatibility
        if year and 'year_range' in tune_data:
            year_range = tune_data['year_range']
            if year < year_range.get('min', 0) or year > year_range.get('max', 9999):
                issues.append(f"Year {year} not supported by this tune")
                confidence_score *= 0.6
        
        # Check displacement compatibility
        if 'displacement' in motorcycle_data and 'displacement_range' in tune_data:
            displacement = motorcycle_data['displacement']
            disp_range = tune_data['displacement_range']
            if displacement < disp_range.get('min', 0) or displacement > disp_range.get('max', 9999):
                warnings.append(f"Displacement {displacement}cc may not be optimal")
                confidence_score *= 0.9
        
        # Determine connection method
        connection_method = 'OBD2'  # Default
        if make in self.ECU_MAPPINGS and model in self.ECU_MAPPINGS[make]:
            connection_method = self.ECU_MAPPINGS[make][model]['connection']
        
        is_compatible = len(issues) == 0 and confidence_score >= 0.7
        
        return CompatibilityResult(
            is_compatible=is_compatible,
            confidence_score=confidence_score,
            issues=issues,
            warnings=warnings,
            required_hardware=required_hardware,
            connection_method=connection_method
        )
    
    def _find_bike_config(self, make: str, model: str, year: int) -> Optional[Dict]:
        """Find configuration for a specific bike"""
        if make not in self.ECU_MAPPINGS:
            return None
        
        for bike_model, config in self.ECU_MAPPINGS[make].items():
            if self._model_matches(model, bike_model) and year in config['years']:
                return config
        
        return None
    
    def _model_matches(self, model: str, pattern: str) -> bool:
        """Check if model matches pattern (handles variations)"""
        # Normalize strings
        model = re.sub(r'[^a-z0-9]', '', model.lower())
        pattern = re.sub(r'[^a-z0-9]', '', pattern.lower())
        
        # Direct match
        if model == pattern:
            return True
        
        # Partial matches for variations
        if pattern in model or model in pattern:
            return True
        
        # Handle specific cases
        if 'panigale' in pattern and 'panigale' in model:
            return True
        
        return False
    
    def _check_ecu_compatibility(
        self, 
        motorcycle_data: Dict, 
        tune_data: Dict, 
        bike_config: Dict
    ) -> Dict:
        """Check ECU-specific compatibility"""
        issues = []
        warnings = []
        confidence_factor = 1.0
        required_hardware = []
        
        motorcycle_ecu = motorcycle_data.get('ecu_type', '')
        tune_ecu_requirements = tune_data.get('ecu_requirements', [])
        
        if motorcycle_ecu and tune_ecu_requirements:
            ecu_match = any(
                ecu.lower() in motorcycle_ecu.lower() 
                for ecu in tune_ecu_requirements
            )
            if not ecu_match:
                issues.append(f"ECU type {motorcycle_ecu} not supported by this tune")
                confidence_factor *= 0.3
        
        # Check if flashing is supported
        if not bike_config.get('flash_supported', False):
            issues.append("This motorcycle does not support ECU flashing")
            confidence_factor *= 0.2
        
        # Add required hardware based on connection type
        connection = bike_config.get('connection', 'OBD2')
        if connection != 'OBD2':
            required_hardware.append(f"{connection} adapter cable")
        
        # Check protocol support
        protocols = bike_config.get('protocols', [])
        tune_protocols = tune_data.get('supported_protocols', ['OBD2'])
        
        if not any(protocol in protocols for protocol in tune_protocols):
            issues.append("No compatible communication protocol")
            confidence_factor *= 0.2
        
        return {
            'issues': issues,
            'warnings': warnings,
            'confidence_factor': confidence_factor,
            'required_hardware': required_hardware
        }
    
    def get_compatible_tunes(self, motorcycle_data: Dict, tune_listings: List[Dict]) -> List[Dict]:
        """Filter tune listings by compatibility"""
        compatible_tunes = []
        
        for tune in tune_listings:
            result = self.check_compatibility(motorcycle_data, tune)
            if result.is_compatible:
                tune['compatibility_score'] = result.confidence_score
                tune['required_hardware'] = result.required_hardware
                tune['connection_method'] = result.connection_method
                compatible_tunes.append(tune)
        
        # Sort by compatibility score
        compatible_tunes.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        return compatible_tunes
    
    def validate_bike_info(self, make: str, model: str, year: int) -> Dict:
        """Validate and enhance bike information"""
        result = {
            'is_valid': False,
            'normalized_make': make.upper(),
            'normalized_model': model.lower(),
            'supported_features': [],
            'recommendations': [],
            'ecu_info': {}
        }
        
        if make.upper() in self.ECU_MAPPINGS:
            bike_config = self._find_bike_config(make.upper(), model, year)
            if bike_config:
                result['is_valid'] = True
                result['ecu_info'] = {
                    'types': bike_config['ecu_types'],
                    'connection': bike_config['connection'],
                    'protocols': bike_config['protocols'],
                    'flash_supported': bike_config['flash_supported']
                }
                
                if bike_config['flash_supported']:
                    result['supported_features'].append('ECU Flashing')
                
                result['supported_features'].extend([
                    'Real-time Data',
                    'Diagnostics',
                    'Parameter Reading'
                ])
                
                # Add recommendations
                if bike_config['connection'] != 'OBD2':
                    result['recommendations'].append(
                        f"Purchase {bike_config['connection']} adapter cable for best compatibility"
                    )
        
        return result


class SafetyLimitsService:
    """Service for enforcing safety limits on tunes"""
    
    # Safety limits by bike category/type
    SAFETY_LIMITS = {
        'SPORT': {
            'max_rpm': 15000,
            'max_boost_psi': 15,
            'min_afr': 11.5,
            'max_afr': 16.0,
            'max_ignition_advance': 45,
            'max_coolant_temp_c': 110,
        },
        'CRUISER': {
            'max_rpm': 8000,
            'max_boost_psi': 10,
            'min_afr': 12.0,
            'max_afr': 15.5,
            'max_ignition_advance': 40,
            'max_coolant_temp_c': 105,
        },
        'TOURING': {
            'max_rpm': 9000,
            'max_boost_psi': 12,
            'min_afr': 12.5,
            'max_afr': 15.0,
            'max_ignition_advance': 38,
            'max_coolant_temp_c': 105,
        },
    }
    
    def validate_tune_safety(self, tune_data: Dict, bike_category: str = 'SPORT') -> Dict:
        """Validate tune parameters against safety limits"""
        limits = self.SAFETY_LIMITS.get(bike_category, self.SAFETY_LIMITS['SPORT'])
        violations = []
        warnings = []
        
        # Check RPM limits
        if 'max_rpm' in tune_data:
            if tune_data['max_rpm'] > limits['max_rpm']:
                violations.append(f"RPM limit {tune_data['max_rpm']} exceeds safe maximum {limits['max_rpm']}")
        
        # Check boost pressure
        if 'boost_pressure' in tune_data:
            if tune_data['boost_pressure'] > limits['max_boost_psi']:
                violations.append(f"Boost pressure {tune_data['boost_pressure']} PSI exceeds safe maximum {limits['max_boost_psi']} PSI")
        
        # Check air/fuel ratio
        if 'afr_map' in tune_data:
            afr_values = tune_data['afr_map']
            if isinstance(afr_values, list):
                for afr in afr_values:
                    if afr < limits['min_afr'] or afr > limits['max_afr']:
                        violations.append(f"AFR value {afr} outside safe range {limits['min_afr']}-{limits['max_afr']}")
        
        # Check ignition timing
        if 'ignition_map' in tune_data:
            ignition_values = tune_data['ignition_map']
            if isinstance(ignition_values, list):
                for timing in ignition_values:
                    if timing > limits['max_ignition_advance']:
                        violations.append(f"Ignition advance {timing}° exceeds safe maximum {limits['max_ignition_advance']}°")
        
        return {
            'is_safe': len(violations) == 0,
            'violations': violations,
            'warnings': warnings,
            'risk_level': 'HIGH' if violations else 'LOW'
        } 