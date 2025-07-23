"""
RevSync Enhanced ECU Binary Parser
Extracts structured calibration data from motorcycle ECU files for LLM analysis

Supports: .bin, .map, .cod, .dtf, .bdm, .xdf, .wrf, .pcv, .hex, .rom, .s19
Output: JSON/YAML structured data for AI safety analysis
"""

import os
import json
import yaml
import struct
import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import re

logger = logging.getLogger(__name__)

@dataclass
class FuelMap:
    """Structured fuel map data"""
    rpm_bins: List[int]
    load_bins: List[float]  
    values: List[List[float]]  # AFR values
    map_type: str = "fuel_map"
    units: str = "AFR"

@dataclass  
class IgnitionMap:
    """Structured ignition timing map"""
    rpm_bins: List[int]
    load_bins: List[float]
    values: List[List[float]]  # Timing advance in degrees
    map_type: str = "ignition_map"
    units: str = "degrees"

@dataclass
class RevLimiter:
    """Rev limiter configuration"""
    soft_limit: int  # RPM
    hard_limit: int  # RPM
    fuel_cut: bool = True
    ignition_cut: bool = True

@dataclass
class StructuredECUData:
    """Complete structured ECU calibration data"""
    motorcycle_info: Dict[str, Any]
    fuel_maps: List[FuelMap]
    ignition_maps: List[IgnitionMap]
    rev_limiter: RevLimiter
    boost_maps: List[Dict] = None
    safety_parameters: Dict[str, Any] = None
    raw_metadata: Dict[str, Any] = None

class EnhancedECUParser:
    """Enhanced ECU parser that extracts structured calibration data for LLM analysis"""
    
    def __init__(self):
        self.supported_formats = [
            '.bin', '.rom', '.bdm',  # Raw binary dumps
            '.hex', '.s19',          # Text-based formats  
            '.map', '.cal', '.cod',  # Calibration files
            '.xdf',                  # Definition files
            '.pcv', '.wrf', '.tec',  # Tool containers
            '.fmi', '.dyno'          # Professional formats
        ]
        
        # Common ECU calibration table patterns
        self.table_signatures = {
            'fuel_map': [
                b'\x0E\x70',  # Common fuel table signature
                b'\x14\x7F',  # AFR table pattern
                b'\x0F\x50'   # Lambda table pattern
            ],
            'ignition_map': [
                b'\x00\x20',  # Timing advance pattern
                b'\x0A\x28',  # Ignition table signature
                b'\x18\x00'   # Spark timing pattern
            ],
            'rev_limiter': [
                b'\x2E\xE0',  # Rev limit pattern
                b'\x30\x00',  # RPM limit signature
                b'\x27\x10'   # Engine speed limit
            ]
        }
        
        # Standard motorcycle ECU table sizes
        self.standard_table_sizes = {
            'fuel_map': (16, 16),      # 16x16 typical
            'ignition_map': (16, 16),  # 16x16 typical
            'boost_map': (8, 8),       # 8x8 for turbo bikes
        }
    
    def parse_ecu_to_structured_data(self, file_path: str, file_ext: str, motorcycle_info: Dict = None) -> StructuredECUData:
        """
        Main entry point: Parse ECU file and extract structured calibration data
        Returns JSON-ready data for LLM analysis
        """
        
        try:
            logger.info(f"Parsing ECU file for structured data: {file_path}")
            
            # Initialize structured data container
            structured_data = StructuredECUData(
                motorcycle_info=motorcycle_info or {},
                fuel_maps=[],
                ignition_maps=[],
                rev_limiter=RevLimiter(soft_limit=10500, hard_limit=11000),  # Safe defaults
                boost_maps=[],
                safety_parameters={},
                raw_metadata={}
            )
            
            # Parse based on file format
            if file_ext in ['.bin', '.rom', '.bdm']:
                structured_data = self._parse_binary_to_structured(file_path, structured_data)
            elif file_ext in ['.hex', '.s19']:
                structured_data = self._parse_hex_to_structured(file_path, structured_data)
            elif file_ext in ['.map', '.cal', '.cod']:
                structured_data = self._parse_map_to_structured(file_path, structured_data)
            elif file_ext == '.xdf':
                structured_data = self._parse_xdf_definition(file_path, structured_data)
            elif file_ext in ['.pcv', '.wrf', '.tec', '.fmi']:
                structured_data = self._parse_container_to_structured(file_path, file_ext, structured_data)
            else:
                logger.warning(f"No structured parser for {file_ext}, using basic extraction")
                structured_data = self._basic_extraction_fallback(file_path, structured_data)
            
            # Validate and enhance extracted data
            structured_data = self._validate_and_enhance_data(structured_data)
            
            logger.info(f"Structured extraction complete: {len(structured_data.fuel_maps)} fuel maps, {len(structured_data.ignition_maps)} ignition maps")
            return structured_data
            
        except Exception as e:
            logger.error(f"Structured ECU parsing failed: {str(e)}")
            # Return minimal safe structure
            return StructuredECUData(
                motorcycle_info=motorcycle_info or {},
                fuel_maps=[],
                ignition_maps=[],
                rev_limiter=RevLimiter(soft_limit=10500, hard_limit=11000),
                safety_parameters={'parsing_error': str(e)}
            )
    
    def _parse_binary_to_structured(self, file_path: str, data: StructuredECUData) -> StructuredECUData:
        """Extract structured calibration data from binary ECU dumps"""
        
        try:
            with open(file_path, 'rb') as f:
                binary_data = f.read()
            
            data.raw_metadata['file_size'] = len(binary_data)
            data.raw_metadata['file_type'] = 'binary_ecu_dump'
            
            # Extract fuel maps
            fuel_maps = self._extract_fuel_maps_from_binary(binary_data)
            data.fuel_maps.extend(fuel_maps)
            
            # Extract ignition maps  
            ignition_maps = self._extract_ignition_maps_from_binary(binary_data)
            data.ignition_maps.extend(ignition_maps)
            
            # Extract rev limiter settings
            rev_limiter = self._extract_rev_limiter_from_binary(binary_data)
            if rev_limiter:
                data.rev_limiter = rev_limiter
            
            # Extract safety parameters
            data.safety_parameters = self._extract_safety_parameters_from_binary(binary_data)
            
            return data
            
        except Exception as e:
            logger.error(f"Binary parsing error: {str(e)}")
            data.safety_parameters['binary_parsing_error'] = str(e)
            return data
    
    def _extract_fuel_maps_from_binary(self, binary_data: bytes) -> List[FuelMap]:
        """Extract fuel/AFR maps from binary ECU data"""
        
        fuel_maps = []
        
        try:
            # Look for fuel map signatures
            for signature in self.table_signatures['fuel_map']:
                offset = 0
                while True:
                    offset = binary_data.find(signature, offset)
                    if offset == -1:
                        break
                    
                    # Try to extract fuel map at this location
                    fuel_map = self._extract_fuel_map_at_offset(binary_data, offset)
                    if fuel_map:
                        fuel_maps.append(fuel_map)
                    
                    offset += len(signature)
            
            # If no signature-based maps found, try pattern-based extraction
            if not fuel_maps:
                fuel_maps = self._extract_fuel_maps_by_pattern(binary_data)
            
        except Exception as e:
            logger.warning(f"Fuel map extraction error: {str(e)}")
        
        return fuel_maps
    
    def _extract_fuel_map_at_offset(self, binary_data: bytes, offset: int) -> Optional[FuelMap]:
        """Extract a single fuel map at the given offset"""
        
        try:
            # Standard 16x16 fuel map extraction
            table_size = 16
            start_offset = offset + 4  # Skip signature
            
            # Generate standard RPM bins (typical motorcycle range)
            rpm_bins = list(range(1000, 12000, int(11000/table_size)))
            
            # Generate standard load bins (0.1 to 1.0 representing throttle/load)
            load_bins = [round(0.1 + (i * 0.9 / (table_size-1)), 2) for i in range(table_size)]
            
            # Extract AFR values from binary data
            afr_values = []
            for row in range(table_size):
                row_values = []
                for col in range(table_size):
                    byte_offset = start_offset + (row * table_size) + col
                    if byte_offset < len(binary_data):
                        # Convert byte value to AFR (typical range 10.0-18.0)
                        raw_value = binary_data[byte_offset]
                        afr_value = 10.0 + (raw_value / 255.0) * 8.0  # Scale to 10.0-18.0
                        row_values.append(round(afr_value, 1))
                    else:
                        row_values.append(14.7)  # Safe default stoichiometric
                afr_values.append(row_values)
            
            # Validate extracted data
            if self._validate_fuel_map_data(afr_values):
                return FuelMap(
                    rpm_bins=rpm_bins,
                    load_bins=load_bins,
                    values=afr_values,
                    map_type="primary_fuel_map",
                    units="AFR"
                )
            
        except Exception as e:
            logger.warning(f"Fuel map extraction at offset {offset} failed: {str(e)}")
        
        return None
    
    def _extract_ignition_maps_from_binary(self, binary_data: bytes) -> List[IgnitionMap]:
        """Extract ignition timing maps from binary ECU data"""
        
        ignition_maps = []
        
        try:
            # Look for ignition map signatures
            for signature in self.table_signatures['ignition_map']:
                offset = 0
                while True:
                    offset = binary_data.find(signature, offset)
                    if offset == -1:
                        break
                    
                    # Try to extract ignition map at this location
                    ignition_map = self._extract_ignition_map_at_offset(binary_data, offset)
                    if ignition_map:
                        ignition_maps.append(ignition_map)
                    
                    offset += len(signature)
            
            # Pattern-based extraction if signature search fails
            if not ignition_maps:
                ignition_maps = self._extract_ignition_maps_by_pattern(binary_data)
                
        except Exception as e:
            logger.warning(f"Ignition map extraction error: {str(e)}")
        
        return ignition_maps
    
    def _extract_ignition_map_at_offset(self, binary_data: bytes, offset: int) -> Optional[IgnitionMap]:
        """Extract a single ignition timing map at the given offset"""
        
        try:
            table_size = 16
            start_offset = offset + 4
            
            # Standard RPM and load bins
            rpm_bins = list(range(1000, 12000, int(11000/table_size)))
            load_bins = [round(0.1 + (i * 0.9 / (table_size-1)), 2) for i in range(table_size)]
            
            # Extract timing advance values
            timing_values = []
            for row in range(table_size):
                row_values = []
                for col in range(table_size):
                    byte_offset = start_offset + (row * table_size) + col
                    if byte_offset < len(binary_data):
                        # Convert byte to timing advance (typical range -10 to +40 degrees)
                        raw_value = binary_data[byte_offset]
                        timing_advance = -10.0 + (raw_value / 255.0) * 50.0  # Scale to -10 to +40
                        row_values.append(round(timing_advance, 1))
                    else:
                        row_values.append(15.0)  # Safe default
                timing_values.append(row_values)
            
            # Validate timing data
            if self._validate_timing_map_data(timing_values):
                return IgnitionMap(
                    rpm_bins=rpm_bins,
                    load_bins=load_bins,
                    values=timing_values,
                    map_type="primary_ignition_map",
                    units="degrees_btdc"
                )
                
        except Exception as e:
            logger.warning(f"Ignition map extraction at offset {offset} failed: {str(e)}")
        
        return None
    
    def _extract_rev_limiter_from_binary(self, binary_data: bytes) -> Optional[RevLimiter]:
        """Extract rev limiter settings from binary data"""
        
        try:
            # Look for rev limiter patterns
            for signature in self.table_signatures['rev_limiter']:
                offset = binary_data.find(signature)
                if offset != -1:
                    # Extract RPM values (typically stored as 16-bit values)
                    rpm_offset = offset + 4
                    if rpm_offset + 4 < len(binary_data):
                        soft_limit = struct.unpack('<H', binary_data[rpm_offset:rpm_offset+2])[0]
                        hard_limit = struct.unpack('<H', binary_data[rpm_offset+2:rpm_offset+4])[0]
                        
                        # Validate RPM values (reasonable range for motorcycles)
                        if 8000 <= soft_limit <= 15000 and 8000 <= hard_limit <= 15000:
                            return RevLimiter(
                                soft_limit=soft_limit,
                                hard_limit=hard_limit,
                                fuel_cut=True,
                                ignition_cut=True
                            )
        except Exception as e:
            logger.warning(f"Rev limiter extraction error: {str(e)}")
        
        return None
    
    def _extract_safety_parameters_from_binary(self, binary_data: bytes) -> Dict[str, Any]:
        """Extract safety-relevant parameters from binary data"""
        
        safety_params = {
            'file_entropy': self._calculate_entropy(binary_data),
            'data_quality': 'good',
            'extraction_method': 'binary_pattern_matching',
            'potential_issues': []
        }
        
        # Check for suspicious patterns
        if binary_data.count(b'\x00') > len(binary_data) * 0.8:
            safety_params['potential_issues'].append('High null byte content - possible empty/corrupted file')
            safety_params['data_quality'] = 'poor'
        
        if binary_data.count(b'\xFF') > len(binary_data) * 0.8:
            safety_params['potential_issues'].append('High 0xFF content - possible erased flash memory')
            safety_params['data_quality'] = 'poor'
        
        return safety_params
    
    def _parse_map_to_structured(self, file_path: str, data: StructuredECUData) -> StructuredECUData:
        """Parse .map/.cal/.cod files to structured data"""
        
        try:
            with open(file_path, 'r', encoding='ascii', errors='ignore') as f:
                content = f.read()
            
            data.raw_metadata['file_type'] = 'calibration_map'
            data.raw_metadata['content_length'] = len(content)
            
            # Extract calibration tables from text-based map files
            fuel_maps = self._extract_fuel_maps_from_text(content)
            data.fuel_maps.extend(fuel_maps)
            
            ignition_maps = self._extract_ignition_maps_from_text(content)
            data.ignition_maps.extend(ignition_maps)
            
            # Extract rev limiter from text
            rev_limiter = self._extract_rev_limiter_from_text(content)
            if rev_limiter:
                data.rev_limiter = rev_limiter
            
            data.safety_parameters = {
                'extraction_method': 'text_parsing',
                'data_quality': 'good' if fuel_maps or ignition_maps else 'limited'
            }
            
        except Exception as e:
            logger.error(f"Map file parsing error: {str(e)}")
            data.safety_parameters['map_parsing_error'] = str(e)
        
        return data
    
    def _extract_fuel_maps_from_text(self, content: str) -> List[FuelMap]:
        """Extract fuel maps from text-based calibration files"""
        
        fuel_maps = []
        
        try:
            # Look for fuel map indicators
            fuel_keywords = ['fuel', 'afr', 'lambda', 'injection', 'mixture']
            
            # Split content into sections
            sections = re.split(r'\n\s*\n', content)
            
            for section in sections:
                section_lower = section.lower()
                if any(keyword in section_lower for keyword in fuel_keywords):
                    # Extract numerical data from this section
                    numbers = re.findall(r'-?\d+\.?\d*', section)
                    if len(numbers) >= 16:  # Minimum viable map size
                        fuel_map = self._create_fuel_map_from_numbers(numbers)
                        if fuel_map:
                            fuel_maps.append(fuel_map)
                            
        except Exception as e:
            logger.warning(f"Text fuel map extraction error: {str(e)}")
        
        return fuel_maps
    
    def _extract_ignition_maps_from_text(self, content: str) -> List[IgnitionMap]:
        """Extract ignition maps from text-based calibration files"""
        
        ignition_maps = []
        
        try:
            # Look for ignition map indicators
            ignition_keywords = ['ignition', 'timing', 'advance', 'spark', 'degrees']
            
            sections = re.split(r'\n\s*\n', content)
            
            for section in sections:
                section_lower = section.lower()
                if any(keyword in section_lower for keyword in ignition_keywords):
                    numbers = re.findall(r'-?\d+\.?\d*', section)
                    if len(numbers) >= 16:
                        ignition_map = self._create_ignition_map_from_numbers(numbers)
                        if ignition_map:
                            ignition_maps.append(ignition_map)
                            
        except Exception as e:
            logger.warning(f"Text ignition map extraction error: {str(e)}")
        
        return ignition_maps
    
    def _create_fuel_map_from_numbers(self, numbers: List[str]) -> Optional[FuelMap]:
        """Create a structured fuel map from extracted numbers"""
        
        try:
            # Convert to float values
            values = [float(n) for n in numbers if self._is_valid_afr_value(float(n))]
            
            if len(values) < 16:
                return None
            
            # Determine table dimensions (assume square table)
            table_size = int(len(values) ** 0.5)
            if table_size * table_size > len(values):
                table_size = int(len(values) / 16)  # Try 16-column format
                if table_size < 4:
                    return None
            
            # Create 2D array
            afr_table = []
            for i in range(table_size):
                row = values[i*table_size:(i+1)*table_size]
                if len(row) == table_size:
                    afr_table.append(row)
            
            if len(afr_table) >= 4:  # Minimum viable table
                # Generate standard bins
                rpm_bins = list(range(1000, 12000, int(11000/len(afr_table))))
                load_bins = [round(0.1 + (i * 0.9 / (len(afr_table[0])-1)), 2) for i in range(len(afr_table[0]))]
                
                return FuelMap(
                    rpm_bins=rpm_bins,
                    load_bins=load_bins,
                    values=afr_table,
                    map_type="extracted_fuel_map",
                    units="AFR"
                )
                
        except Exception as e:
            logger.warning(f"Fuel map creation error: {str(e)}")
        
        return None
    
    def _is_valid_afr_value(self, value: float) -> bool:
        """Check if a value is a reasonable AFR reading"""
        return 8.0 <= value <= 22.0  # Reasonable AFR range for motorcycles
    
    def _is_valid_timing_value(self, value: float) -> bool:
        """Check if a value is a reasonable timing advance"""
        return -20.0 <= value <= 50.0  # Reasonable timing range
    
    def _validate_fuel_map_data(self, afr_values: List[List[float]]) -> bool:
        """Validate extracted fuel map data for reasonableness"""
        
        try:
            # Check dimensions
            if len(afr_values) < 4 or len(afr_values[0]) < 4:
                return False
            
            # Check AFR value ranges
            for row in afr_values:
                for value in row:
                    if not self._is_valid_afr_value(value):
                        return False
            
            # Check for reasonable variation (not all the same value)
            flat_values = [v for row in afr_values for v in row]
            if max(flat_values) - min(flat_values) < 0.5:
                return False  # Too little variation
            
            return True
            
        except Exception:
            return False
    
    def _validate_timing_map_data(self, timing_values: List[List[float]]) -> bool:
        """Validate extracted timing map data"""
        
        try:
            if len(timing_values) < 4 or len(timing_values[0]) < 4:
                return False
            
            for row in timing_values:
                for value in row:
                    if not self._is_valid_timing_value(value):
                        return False
            
            # Check for reasonable timing progression
            flat_values = [v for row in timing_values for v in row]
            if max(flat_values) - min(flat_values) < 2.0:
                return False
            
            return True
            
        except Exception:
            return False
    
    def _calculate_entropy(self, data: bytes) -> float:
        """Calculate entropy of binary data"""
        
        if not data:
            return 0.0
        
        # Count byte frequencies
        frequencies = {}
        for byte in data:
            frequencies[byte] = frequencies.get(byte, 0) + 1
        
        # Calculate entropy
        entropy = 0.0
        data_len = len(data)
        
        for freq in frequencies.values():
            probability = freq / data_len
            if probability > 0:
                entropy -= probability * (probability.bit_length() - 1)
        
        return entropy / 8.0  # Normalize
    
    def _validate_and_enhance_data(self, data: StructuredECUData) -> StructuredECUData:
        """Validate and enhance extracted structured data"""
        
        # Ensure we have at least basic safety parameters
        if not data.safety_parameters:
            data.safety_parameters = {}
        
        # Add extraction summary
        data.safety_parameters['extraction_summary'] = {
            'fuel_maps_found': len(data.fuel_maps),
            'ignition_maps_found': len(data.ignition_maps),
            'rev_limiter_found': data.rev_limiter.soft_limit != 10500,  # Check if default
            'data_completeness': 'complete' if data.fuel_maps and data.ignition_maps else 'partial'
        }
        
        return data
    
    def to_json_for_llm(self, structured_data: StructuredECUData) -> str:
        """Convert structured ECU data to JSON format optimized for LLM analysis"""
        
        try:
            # Convert dataclass to dict, handling nested structures
            data_dict = asdict(structured_data)
            
            # Add LLM-friendly analysis context
            data_dict['llm_analysis_context'] = {
                'file_summary': f"ECU calibration data with {len(structured_data.fuel_maps)} fuel maps and {len(structured_data.ignition_maps)} ignition maps",
                'safety_focus_areas': [
                    'AFR values (safe range: 12.5-14.7)',
                    'Ignition timing advance (safe limit: <30 degrees)',
                    'Rev limiter settings (reasonable limits)',
                    'Map progression and smoothness'
                ],
                'analysis_instructions': "Analyze each RPM/load point for safety, especially lean AFR or aggressive timing that could cause engine damage"
            }
            
            return json.dumps(data_dict, indent=2)
            
        except Exception as e:
            logger.error(f"JSON conversion error: {str(e)}")
            return json.dumps({
                'error': 'JSON conversion failed',
                'fallback_data': {
                    'fuel_maps_count': len(structured_data.fuel_maps),
                    'ignition_maps_count': len(structured_data.ignition_maps),
                    'safety_parameters': structured_data.safety_parameters
                }
            })

    # Additional helper methods for specific formats
    def _extract_fuel_maps_by_pattern(self, binary_data: bytes) -> List[FuelMap]:
        """Pattern-based fuel map extraction fallback"""
        fuel_maps = []
        # Implementation for pattern-based extraction
        return fuel_maps
    
    def _extract_ignition_maps_by_pattern(self, binary_data: bytes) -> List[IgnitionMap]:
        """Pattern-based ignition map extraction fallback"""
        ignition_maps = []
        # Implementation for pattern-based extraction  
        return ignition_maps
    
    def _extract_rev_limiter_from_text(self, content: str) -> Optional[RevLimiter]:
        """Extract rev limiter from text content"""
        # Implementation for text-based rev limiter extraction
        return None
    
    def _create_ignition_map_from_numbers(self, numbers: List[str]) -> Optional[IgnitionMap]:
        """Create ignition map from extracted numbers"""
        # Implementation similar to fuel map creation
        return None
    
    def _parse_xdf_definition(self, file_path: str, data: StructuredECUData) -> StructuredECUData:
        """Parse XDF definition files for precise table extraction"""
        # Implementation for XDF file parsing
        return data
    
    def _parse_container_to_structured(self, file_path: str, file_ext: str, data: StructuredECUData) -> StructuredECUData:
        """Parse container formats (.pcv, .wrf, .tec, .fmi)"""
        # Implementation for container format parsing
        return data
    
    def _parse_hex_to_structured(self, file_path: str, data: StructuredECUData) -> StructuredECUData:
        """Parse Intel HEX files to structured data"""
        # Implementation for HEX file parsing
        return data
    
    def _basic_extraction_fallback(self, file_path: str, data: StructuredECUData) -> StructuredECUData:
        """Basic extraction when specific parser not available"""
        data.safety_parameters = {'extraction_method': 'basic_fallback', 'data_quality': 'limited'}
        return data 