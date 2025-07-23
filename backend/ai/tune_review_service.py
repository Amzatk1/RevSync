"""
RevSync AI Tune Review Service
Comprehensive AI-powered tune safety analysis and validation system
Uses FREE local Mistral 7B for cost-effective tune review
"""

import os
import hashlib
import time
import logging
import re
from typing import Dict, List, Tuple, Optional, Any
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import requests
import json
from .llm_service import get_llm_service
from datetime import datetime

logger = logging.getLogger(__name__)

class TuneReviewService:
    """Enhanced T-CLOCS Safety Validation System - Layer 2: AI Safety Scoring & Analysis"""
    
    def __init__(self):
        self.llm_service = get_llm_service()
        
        # T-CLOCS Safety Thresholds
        self.SAFE_AFR_RANGE = (12.5, 14.7)      # Safe air-fuel ratio range
        self.CONSERVATIVE_AFR_RANGE = (13.2, 14.2)  # Conservative range
        self.MAX_TIMING_ADVANCE = 35              # Maximum timing advance (degrees)
        self.SAFE_TIMING_ADVANCE = 30             # Conservative timing advance
        self.MAX_REV_LIMIT_INCREASE = 1000        # Maximum rev limit increase (RPM)
        
        # Performance Thresholds
        self.BEGINNER_HP_LIMIT = 20               # Max HP gain for beginners
        self.INTERMEDIATE_HP_LIMIT = 40           # Max HP gain for intermediate
        
    def analyze_tune_comprehensive(self, tune_data: Dict) -> Dict:
        """Comprehensive T-CLOCS safety analysis with structured ECU data parsing and HybridRAG enhancement"""
        
        logger.info(f"Starting comprehensive T-CLOCS + HybridRAG analysis for tune: {tune_data.get('name')}")
        
        try:
            # Import enhanced ECU parser and HybridRAG system
            from .ecu_parser import EnhancedECUParser
            from .hybrid_rag_system import RevSyncHybridRAG, TuneNode
            
            # Initialize HybridRAG system
            hybrid_rag = RevSyncHybridRAG()
            
            # Extract structured calibration data from ECU file
            parser = EnhancedECUParser()
            file_path = tune_data.get('file_path', '')
            file_ext = '.' + file_path.lower().split('.')[-1] if '.' in file_path else ''
            
            # Parse ECU file to structured data
            motorcycle_info = {
                'make': tune_data.get('motorcycle_make'),
                'model': tune_data.get('motorcycle_model'), 
                'year': tune_data.get('motorcycle_year'),
                'engine_type': tune_data.get('engine_type'),
                'ecu_type': tune_data.get('ecu_type')
            }
            
            structured_ecu_data = parser.parse_ecu_to_structured_data(file_path, file_ext, motorcycle_info)
            
            # Convert to JSON for LLM analysis
            structured_json = parser.to_json_for_llm(structured_ecu_data)
            
            # HYBRIDRAG ENHANCEMENT: Get enhanced context from vector + graph search
            hybrid_context = self._get_hybrid_rag_context(tune_data, structured_ecu_data, hybrid_rag)
            
            # Perform enhanced LLM analysis with HybridRAG context
            llm_analysis = self._analyze_structured_calibration_data_with_hybrid_rag(
                structured_json, tune_data, hybrid_context
            )
            
            # Perform traditional binary analysis as backup
            traditional_analysis = self._analyze_safety_parameters("", tune_data)
            
            # Combine structured and traditional analysis
            combined_analysis = self._combine_structured_and_traditional_analysis(
                llm_analysis, traditional_analysis, structured_ecu_data
            )
            
            # Add HybridRAG insights to analysis
            combined_analysis['hybrid_rag_insights'] = hybrid_context.get('insights', [])
            combined_analysis['similar_tune_count'] = len(hybrid_context.get('similar_tunes', []))
            combined_analysis['safety_pattern_matches'] = len(hybrid_context.get('safety_patterns', []))
            
            # CRITICAL: Implement strict safety blocking with HybridRAG awareness
            safety_blocking_result = self._evaluate_safety_blocking_with_hybrid_context(
                combined_analysis, structured_ecu_data, hybrid_context
            )
            
            if safety_blocking_result['block_upload']:
                # LLM flagged critical safety issues - BLOCK UPLOAD
                combined_analysis['review_status'] = 'REJECTED'
                combined_analysis['safety_score'] = min(combined_analysis.get('safety_score', 0), 30)  # Force low score
                combined_analysis['block_reason'] = safety_blocking_result['block_reason']
                combined_analysis['critical_safety_violations'] = safety_blocking_result['violations']
                
                logger.critical(f"HYBRIDRAG SAFETY BLOCKING ACTIVATED for tune {tune_data.get('id')}: {safety_blocking_result['block_reason']}")
                
            else:
                # Add tune to HybridRAG system for future analysis
                self._add_tune_to_hybrid_rag_system(tune_data, structured_ecu_data, combined_analysis, hybrid_rag)
            
            logger.info(f"T-CLOCS + HybridRAG analysis complete for tune {tune_data.get('id')}: Score {combined_analysis.get('safety_score')}")
            return combined_analysis
            
        except Exception as e:
            logger.error(f"Error in comprehensive HybridRAG tune analysis: {str(e)}")
            return self._fallback_analysis(tune_data)
    
    def _analyze_safety_parameters(self, tune_content: str, tune_data: Dict) -> Dict:
        """Analyze core safety parameters using AI and rule-based systems"""
        
        # Prepare detailed analysis prompt
        analysis_prompt = f"""
        COMPREHENSIVE MOTORCYCLE TUNE SAFETY ANALYSIS

        Analyze this ECU tune for motorcycle safety using T-CLOCS methodology:

        TUNE INFORMATION:
        - Motorcycle: {tune_data.get('motorcycle_make')} {tune_data.get('motorcycle_model')} {tune_data.get('motorcycle_year')}
        - Engine: {tune_data.get('engine_type')}
        - ECU Type: {tune_data.get('ecu_type')}
        - Tune Type: {tune_data.get('tune_type')}
        - Required Mods: {tune_data.get('required_exhaust', 'None')}, {tune_data.get('required_air_filter', 'None')}

        SAFETY ANALYSIS REQUIREMENTS:
        1. AIR-FUEL RATIO (AFR) SAFETY:
           - Analyze fuel mapping for safe AFR ranges (12.5-14.7)
           - Flag lean conditions that could cause engine damage
           - Assess rich conditions affecting emissions/performance

        2. IGNITION TIMING SAFETY:
           - Check timing advance limits (safe <30°, dangerous >35°)
           - Identify knock-prone timing maps
           - Assess timing vs octane requirements

        3. REV LIMIT SAFETY:
           - Evaluate rev limit increases (safe <1000 RPM increase)
           - Assess mechanical safety margins
           - Check valve float/spring limitations

        4. ENGINE SAFETY MARGINS:
           - Assess overall conservative vs aggressive approach
           - Identify potential engine damage risks
           - Evaluate long-term reliability impact

        5. EMISSIONS COMPLIANCE:
           - Check if tune maintains reasonable emissions
           - Flag significant emissions increases

        Provide a safety score (0-100) and detailed risk assessment.
        Score 90-100: Conservative, street-safe
        Score 70-89: Moderate risk, experienced riders
        Score 50-69: Higher risk, track/expert use
        Score 0-49: Dangerous, reject

        Tune Content Analysis:
        {tune_content[:2000]}...
        """
        
        # Get AI analysis
        ai_response = self.llm_service._query_ollama(analysis_prompt)
        
        # Parse AI response and combine with rule-based analysis
        parsed_analysis = self._parse_ai_safety_response(ai_response)
        rule_based_analysis = self._rule_based_safety_check(tune_content, tune_data)
        
        # Combine analyses
        combined_score = (parsed_analysis['score'] + rule_based_analysis['score']) // 2
        
        return {
            'overall_score': max(0, min(100, combined_score)),
            'confidence': min(parsed_analysis['confidence'], rule_based_analysis['confidence']),
            'risks': {
                'lean_afr': parsed_analysis['risks'].get('lean_afr', False) or rule_based_analysis['risks'].get('lean_afr', False),
                'excessive_timing': parsed_analysis['risks'].get('timing', False) or rule_based_analysis['risks'].get('timing', False),
                'emissions_concern': parsed_analysis['risks'].get('emissions', False),
                'brick_risk': rule_based_analysis['risks'].get('brick_risk', False),
            },
            'detailed_report': parsed_analysis['detailed_report'],
            'reasoning': f"AI Analysis: {parsed_analysis['reasoning']}\n\nRule-based: {rule_based_analysis['reasoning']}"
        }
    
    def _analyze_structured_calibration_data(self, structured_json: str, tune_data: Dict) -> Dict:
        """Analyze structured ECU calibration data using LLM with specialized prompts"""
        
        try:
            # Prepare comprehensive calibration analysis prompt
            calibration_prompt = f"""
            MOTORCYCLE ECU CALIBRATION SAFETY ANALYSIS

            You are analyzing a motorcycle ECU tune for safety compliance. Your analysis determines if this tune can be safely uploaded to our platform.

            CRITICAL: If you identify ANY serious safety issues, the tune MUST BE BLOCKED from upload.

            MOTORCYCLE INFORMATION:
            - Make/Model: {tune_data.get('motorcycle_make')} {tune_data.get('motorcycle_model')} {tune_data.get('motorcycle_year')}
            - Engine: {tune_data.get('engine_type')}
            - ECU Type: {tune_data.get('ecu_type')}
            - Tune Type: {tune_data.get('tune_type')}
            - Creator Level: {tune_data.get('creator_level', 'BASIC')}

            STRUCTURED ECU CALIBRATION DATA:
            {structured_json}

            PERFORM DETAILED SAFETY ANALYSIS:

            1. FUEL MAP ANALYSIS (CRITICAL SAFETY):
               - Analyze each AFR value in fuel maps
               - Safe AFR range: 12.5-14.7 (stoichiometric ±1.0)
               - DANGER ZONES: AFR < 11.5 (too rich, carbon fouling, oil wash)
               - CRITICAL DANGER: AFR > 15.5 (lean condition, engine damage, piston melt)
               - Check for smooth progression between cells
               - Identify any dangerous lean spots at high RPM/load

            2. IGNITION TIMING ANALYSIS (ENGINE DAMAGE RISK):
               - Analyze timing advance values at each RPM/load point
               - Safe timing: Generally <30° advance
               - DANGER ZONE: >35° advance (knock risk, engine damage)
               - Check timing progression (should advance with RPM, retard with load)
               - Identify aggressive timing that could cause detonation

            3. REV LIMITER SAFETY:
               - Soft limit should be reasonable for engine (typically 10,000-13,000 RPM)
               - Hard limit should not exceed safe mechanical limits
               - DANGER: Limits >15,000 RPM for most motorcycles (valve float, connecting rod failure)

            4. MAP QUALITY AND SMOOTHNESS:
               - Check for abrupt transitions that could cause drivability issues
               - Identify interpolation errors or corrupted data
               - Ensure logical progression across RPM and load ranges

            5. RIDER SKILL LEVEL ASSESSMENT:
               - BEGINNER: Conservative AFR (13.5-14.2), timing <25°, smooth transitions
               - INTERMEDIATE: Moderate performance, AFR 13.0-14.5, timing <30°
               - EXPERT: Advanced performance, AFR 12.8-14.7, timing <35°, track-focused

            PROVIDE YOUR ANALYSIS IN THIS FORMAT:

            SAFETY_SCORE: [0-100]
            CONFIDENCE: [0.0-1.0]
            
            FUEL_MAP_ANALYSIS:
            - Safest AFR found: [value]
            - Leanest AFR found: [value] 
            - Dangerous lean zones: [list any AFR > 15.5]
            - Rich zones: [list any AFR < 11.5]
            - Overall fuel safety: [SAFE/MODERATE/DANGEROUS]

            IGNITION_TIMING_ANALYSIS:
            - Maximum timing advance: [value]°
            - Aggressive timing zones: [list any >35°]
            - Timing progression quality: [SMOOTH/MODERATE/ABRUPT]
            - Overall timing safety: [SAFE/MODERATE/DANGEROUS]

            REV_LIMITER_ANALYSIS:
            - Soft limit: [value] RPM
            - Hard limit: [value] RPM
            - Limit safety: [SAFE/MODERATE/DANGEROUS]

            CRITICAL_SAFETY_VIOLATIONS:
            [List any violations that should BLOCK upload]

            RECOMMENDED_SKILL_LEVEL: [BEGINNER/INTERMEDIATE/EXPERT]

            UPLOAD_DECISION: [APPROVE/REVIEW/BLOCK]
            BLOCK_REASON: [If BLOCK, explain why]

            Remember: Lean AFR conditions and excessive timing advance can cause catastrophic engine failure. Err on the side of caution for rider safety.
            """
            
            # Query LLM with structured data
            llm_response = self.llm_service._query_ollama(calibration_prompt)
            
            # Parse LLM response into structured format
            parsed_analysis = self._parse_structured_calibration_response(llm_response)
            
            return parsed_analysis
            
        except Exception as e:
            logger.error(f"Structured calibration analysis failed: {str(e)}")
            return {
                'safety_score': 50,
                'ai_confidence': 0.5,
                'analysis_method': 'fallback_due_to_error',
                'error': str(e)
            }
    
    def _parse_structured_calibration_response(self, llm_response: str) -> Dict:
        """Parse LLM response for structured calibration analysis"""
        
        try:
            analysis_result = {
                'safety_score': 75,
                'ai_confidence': 0.8,
                'fuel_map_analysis': {},
                'ignition_timing_analysis': {},
                'rev_limiter_analysis': {},
                'critical_safety_violations': [],
                'upload_decision': 'REVIEW',
                'block_reason': '',
                'analysis_method': 'structured_calibration_llm'
            }
            
            # Extract safety score
            score_match = re.search(r'SAFETY_SCORE:\s*(\d+)', llm_response)
            if score_match:
                analysis_result['safety_score'] = int(score_match.group(1))
            
            # Extract confidence
            confidence_match = re.search(r'CONFIDENCE:\s*(\d*\.?\d+)', llm_response)
            if confidence_match:
                confidence = float(confidence_match.group(1))
                analysis_result['ai_confidence'] = confidence if confidence <= 1.0 else confidence / 100.0
            
            # Extract fuel map analysis
            fuel_analysis = {}
            
            safest_afr_match = re.search(r'Safest AFR found:\s*([0-9.]+)', llm_response)
            if safest_afr_match:
                fuel_analysis['safest_afr'] = float(safest_afr_match.group(1))
            
            leanest_afr_match = re.search(r'Leanest AFR found:\s*([0-9.]+)', llm_response)
            if leanest_afr_match:
                fuel_analysis['leanest_afr'] = float(leanest_afr_match.group(1))
            
            fuel_safety_match = re.search(r'Overall fuel safety:\s*(SAFE|MODERATE|DANGEROUS)', llm_response)
            if fuel_safety_match:
                fuel_analysis['overall_safety'] = fuel_safety_match.group(1)
            
            analysis_result['fuel_map_analysis'] = fuel_analysis
            
            # Extract ignition timing analysis
            timing_analysis = {}
            
            max_timing_match = re.search(r'Maximum timing advance:\s*([0-9.]+)', llm_response)
            if max_timing_match:
                timing_analysis['max_timing_advance'] = float(max_timing_match.group(1))
            
            timing_safety_match = re.search(r'Overall timing safety:\s*(SAFE|MODERATE|DANGEROUS)', llm_response)
            if timing_safety_match:
                timing_analysis['overall_safety'] = timing_safety_match.group(1)
            
            analysis_result['ignition_timing_analysis'] = timing_analysis
            
            # Extract critical safety violations
            violations_section = re.search(r'CRITICAL_SAFETY_VIOLATIONS:\s*\n(.*?)\n\n', llm_response, re.DOTALL)
            if violations_section:
                violations_text = violations_section.group(1).strip()
                if violations_text and violations_text != '[List any violations that should BLOCK upload]':
                    # Split violations by lines and clean up
                    violations = [v.strip('- ').strip() for v in violations_text.split('\n') if v.strip() and not v.strip().startswith('[')]
                    analysis_result['critical_safety_violations'] = violations
            
            # Extract upload decision
            upload_decision_match = re.search(r'UPLOAD_DECISION:\s*(APPROVE|REVIEW|BLOCK)', llm_response)
            if upload_decision_match:
                analysis_result['upload_decision'] = upload_decision_match.group(1)
            
            # Extract block reason
            block_reason_match = re.search(r'BLOCK_REASON:\s*(.*?)(?:\n|$)', llm_response)
            if block_reason_match:
                block_reason = block_reason_match.group(1).strip()
                if block_reason and block_reason != '[If BLOCK, explain why]':
                    analysis_result['block_reason'] = block_reason
            
            # Extract recommended skill level
            skill_level_match = re.search(r'RECOMMENDED_SKILL_LEVEL:\s*(BEGINNER|INTERMEDIATE|EXPERT)', llm_response)
            if skill_level_match:
                analysis_result['skill_level_required'] = skill_level_match.group(1)
            
            return analysis_result
            
        except Exception as e:
            logger.warning(f"Error parsing structured calibration response: {e}")
            return {
                'safety_score': 60,
                'ai_confidence': 0.6,
                'critical_safety_violations': [],
                'upload_decision': 'REVIEW',
                'analysis_method': 'structured_calibration_llm_with_parsing_error',
                'parsing_error': str(e)
            }
    
    def _combine_structured_and_traditional_analysis(self, llm_analysis: Dict, traditional_analysis: Dict, structured_data) -> Dict:
        """Combine structured LLM analysis with traditional analysis"""
        
        # Use LLM analysis as primary, traditional as backup
        combined = llm_analysis.copy()
        
        # Take the more conservative (lower) safety score
        llm_score = llm_analysis.get('safety_score', 75)
        traditional_score = traditional_analysis.get('score', 75)
        
        combined['safety_score'] = min(llm_score, traditional_score)
        combined['ai_confidence'] = min(
            llm_analysis.get('ai_confidence', 0.8),
            traditional_analysis.get('confidence', 0.8)
        )
        
        # Combine risk indicators
        combined['lean_afr_risk'] = (
            llm_analysis.get('fuel_map_analysis', {}).get('overall_safety') == 'DANGEROUS' or
            traditional_analysis.get('risks', {}).get('lean_afr', False)
        )
        
        combined['timing_risk'] = (
            llm_analysis.get('ignition_timing_analysis', {}).get('overall_safety') == 'DANGEROUS' or
            traditional_analysis.get('risks', {}).get('timing', False)
        )
        
        # Use structured data for performance predictions if available
        if structured_data.fuel_maps and structured_data.ignition_maps:
            combined['estimated_hp_gain'] = self._estimate_hp_from_structured_data(structured_data)
            combined['estimated_torque_gain'] = combined['estimated_hp_gain'] * 0.8
        else:
            combined['estimated_hp_gain'] = traditional_analysis.get('estimated_hp_gain', 10.0)
            combined['estimated_torque_gain'] = traditional_analysis.get('estimated_torque_gain', 8.0)
        
        # Safety presentation data
        combined['safety_badge'] = self._determine_safety_badge_from_structured(combined)
        combined['risk_flags'] = self._generate_risk_flags_from_structured(combined)
        
        return combined
    
    def _evaluate_safety_blocking(self, analysis: Dict, structured_data) -> Dict:
        """Evaluate if tune should be blocked based on LLM safety analysis"""
        
        blocking_result = {
            'block_upload': False,
            'block_reason': '',
            'violations': []
        }
        
        try:
            # Check LLM upload decision
            upload_decision = analysis.get('upload_decision', 'REVIEW')
            if upload_decision == 'BLOCK':
                blocking_result['block_upload'] = True
                blocking_result['block_reason'] = analysis.get('block_reason', 'LLM flagged critical safety violations')
                blocking_result['violations'] = analysis.get('critical_safety_violations', [])
                return blocking_result
            
            # Check critical safety thresholds
            safety_score = analysis.get('safety_score', 100)
            if safety_score < 40:
                blocking_result['block_upload'] = True
                blocking_result['block_reason'] = f'Safety score too low: {safety_score}/100'
                blocking_result['violations'].append(f'Overall safety score {safety_score} below minimum threshold (40)')
            
            # Check fuel map safety
            fuel_analysis = analysis.get('fuel_map_analysis', {})
            leanest_afr = fuel_analysis.get('leanest_afr')
            if leanest_afr and leanest_afr > 15.5:
                blocking_result['block_upload'] = True
                blocking_result['block_reason'] = f'Dangerous lean AFR detected: {leanest_afr}'
                blocking_result['violations'].append(f'Lean AFR {leanest_afr} exceeds safe limit (15.5) - engine damage risk')
            
            # Check ignition timing safety
            timing_analysis = analysis.get('ignition_timing_analysis', {})
            max_timing = timing_analysis.get('max_timing_advance')
            if max_timing and max_timing > 40:
                blocking_result['block_upload'] = True
                blocking_result['block_reason'] = f'Excessive timing advance: {max_timing}°'
                blocking_result['violations'].append(f'Timing advance {max_timing}° exceeds safe limit (40°) - knock/detonation risk')
            
            # Check for critical violations list
            violations = analysis.get('critical_safety_violations', [])
            if violations:
                blocking_result['block_upload'] = True
                blocking_result['block_reason'] = 'Multiple critical safety violations identified by AI'
                blocking_result['violations'].extend(violations)
            
            return blocking_result
            
        except Exception as e:
            logger.error(f"Safety blocking evaluation error: {str(e)}")
            # On error, be conservative and block
            blocking_result['block_upload'] = True
            blocking_result['block_reason'] = f'Safety evaluation error: {str(e)}'
            blocking_result['violations'] = ['Safety analysis failed - blocking for safety']
            return blocking_result
    
    def _estimate_hp_from_structured_data(self, structured_data) -> float:
        """Estimate HP gain from structured calibration data"""
        
        try:
            if not structured_data.fuel_maps:
                return 10.0
            
            # Analyze fuel map richness for performance estimation
            fuel_map = structured_data.fuel_maps[0]
            
            # Calculate average AFR
            all_afr_values = []
            for row in fuel_map.values:
                all_afr_values.extend(row)
            
            avg_afr = sum(all_afr_values) / len(all_afr_values)
            
            # Estimate based on AFR richness (richer = more power, within limits)
            if 13.0 <= avg_afr <= 13.5:  # Rich for power
                return 18.0
            elif 13.5 <= avg_afr <= 14.0:  # Moderate performance
                return 12.0
            elif 14.0 <= avg_afr <= 14.7:  # Conservative
                return 8.0
            else:
                return 10.0  # Default
                
        except Exception:
            return 10.0
    
    def _determine_safety_badge_from_structured(self, analysis: Dict) -> str:
        """Determine safety badge from structured analysis"""
        
        safety_score = analysis.get('safety_score', 75)
        upload_decision = analysis.get('upload_decision', 'REVIEW')
        
        if upload_decision == 'BLOCK' or safety_score < 50:
            return 'EXPERT'  # If not blocked, only experts should handle
        elif safety_score >= 85:
            return 'SAFE'
        else:
            return 'MODERATE'
    
    def _generate_risk_flags_from_structured(self, analysis: Dict) -> List[str]:
        """Generate risk flags from structured analysis"""
        
        risk_flags = []
        
        # Fuel map risks
        fuel_analysis = analysis.get('fuel_map_analysis', {})
        if fuel_analysis.get('overall_safety') == 'DANGEROUS':
            risk_flags.append('⚠️ Dangerous fuel mapping detected')
        elif fuel_analysis.get('overall_safety') == 'MODERATE':
            risk_flags.append('⚠️ Aggressive fuel mapping - monitor AFR')
        
        # Timing risks
        timing_analysis = analysis.get('ignition_timing_analysis', {})
        if timing_analysis.get('overall_safety') == 'DANGEROUS':
            risk_flags.append('⚠️ Dangerous timing advance - knock risk')
        elif timing_analysis.get('overall_safety') == 'MODERATE':
            risk_flags.append('⚠️ Aggressive timing - use premium fuel')
        
        # Critical violations
        violations = analysis.get('critical_safety_violations', [])
        for violation in violations[:2]:  # Show top 2 violations
            risk_flags.append(f'🚨 {violation}')
        
        return risk_flags[:5]  # Limit to top 5 risk flags
    
    def _rule_based_safety_check(self, tune_content: str, tune_data: Dict) -> Dict:
        """Rule-based safety analysis using engineering principles"""
        
        safety_score = 100  # Start with perfect score, deduct for risks
        confidence = 0.9
        risks = {}
        warnings = []
        
        # File Security Check
        if self._detect_suspicious_patterns(tune_content):
            safety_score -= 50
            risks['brick_risk'] = True
            warnings.append("Suspicious file patterns detected")
        
        # Motorcycle-specific checks
        motorcycle_risks = self._check_motorcycle_specific_risks(tune_data)
        safety_score -= motorcycle_risks['score_penalty']
        risks.update(motorcycle_risks['risks'])
        warnings.extend(motorcycle_risks['warnings'])
        
        # Modification requirements check
        mod_risks = self._assess_modification_requirements(tune_data)
        safety_score -= mod_risks['score_penalty']
        warnings.extend(mod_risks['warnings'])
        
        # Creator experience factor
        creator_bonus = self._calculate_creator_bonus(tune_data.get('creator_level', 'BASIC'))
        safety_score += creator_bonus
        
        return {
            'score': max(0, min(100, safety_score)),
            'confidence': confidence,
            'risks': risks,
            'reasoning': f"Rule-based analysis: {'; '.join(warnings) if warnings else 'No major concerns identified'}"
        }
    
    def _categorize_skill_level(self, safety_analysis: Dict) -> str:
        """Categorize required skill level based on safety analysis"""
        
        score = safety_analysis['overall_score']
        risks = safety_analysis['risks']
        
        # Expert level required for high-risk tunes
        if score < 70 or any(risks.values()):
            return 'EXPERT'
        
        # Intermediate for moderate scores
        elif score < 85:
            return 'INTERMEDIATE'
        
        # Beginner for conservative tunes
        else:
            return 'BEGINNER'
    
    def _predict_performance_impact(self, tune_content: str, tune_data: Dict) -> Dict:
        """Predict performance impact using AI and motorcycle data"""
        
        performance_prompt = f"""
        MOTORCYCLE PERFORMANCE PREDICTION

        Predict the performance impact of this tune:
        
        Motorcycle: {tune_data.get('motorcycle_make')} {tune_data.get('motorcycle_model')} ({tune_data.get('motorcycle_year')})
        Engine: {tune_data.get('engine_type')}
        
        Based on the tune modifications, estimate:
        1. Horsepower gain (HP)
        2. Torque gain (lb-ft)
        3. Throttle response improvement
        4. Fuel efficiency impact
        
        Consider:
        - Stock power output for this motorcycle
        - Typical gains for this type of tune
        - Required modifications impact
        - Conservative vs aggressive tuning approach
        
        Required mods: {tune_data.get('required_exhaust', 'None')}, {tune_data.get('required_air_filter', 'None')}
        
        Provide specific numbers and realistic expectations.
        """
        
        ai_response = self.llm_service._query_ollama(performance_prompt)
        
        # Parse performance predictions
        predictions = self._parse_performance_predictions(ai_response, tune_data)
        
        return predictions
    
    def _assess_comprehensive_risks(self, safety_analysis: Dict, tune_data: Dict) -> Dict:
        """Assess comprehensive risk factors for user display"""
        
        risk_flags = []
        
        if safety_analysis['risks']['lean_afr']:
            risk_flags.append("⚠️ Lean AFR detected - Engine damage risk")
        
        if safety_analysis['risks']['excessive_timing']:
            risk_flags.append("⚠️ Aggressive timing - Knock risk")
        
        if safety_analysis['risks']['emissions_impact']:
            risk_flags.append(" Emissions impact - May not pass inspection")
        
        if safety_analysis['risks']['ecu_brick_risk']:
            risk_flags.append("🚨 ECU brick risk - Professional installation required")
        
        # Motorcycle-specific risks
        if tune_data.get('tune_type') == 'ECU_FLASH':
            risk_flags.append("⚙️ ECU flash required - Create backup first")
        
        if tune_data.get('required_exhaust'):
            risk_flags.append(f"🔧 Requires: {tune_data['required_exhaust']}")
        
        return {
            'risk_flags': risk_flags[:5],  # Limit to top 5 risks
        }
    
    def _determine_safety_badge(self, safety_score: int, skill_level: str) -> str:
        """Determine appropriate safety badge"""
        
        if safety_score >= 85 and skill_level == 'BEGINNER':
            return 'SAFE'
        elif safety_score >= 70 and skill_level in ['BEGINNER', 'INTERMEDIATE']:
            return 'MODERATE'
        else:
            return 'EXPERT'
    
    def _generate_warranty_implications(self, safety_analysis: Dict) -> str:
        """Generate warranty implications text"""
        
        base_text = "ECU modifications may void manufacturer warranty. "
        
        if safety_analysis['overall_score'] < 70:
            return base_text + "Aggressive tune increases warranty void risk and may affect insurance coverage."
        elif safety_analysis['overall_score'] < 85:
            return base_text + "Moderate tune may affect warranty claims related to engine/emission systems."
        else:
            return base_text + "Conservative tune minimizes warranty impact but may still void emission-related coverage."
    
    def _generate_emissions_disclaimer(self, safety_analysis: Dict) -> str:
        """Generate emissions disclaimer"""
        
        if safety_analysis['risks']['emissions_concern']:
            return "⚠️ This tune significantly increases emissions and may not be legal for street use in all areas. Check local regulations."
        else:
            return "This tune may increase emissions. Verify compliance with local emission regulations before street use."
    
    def _assess_installation_complexity(self, tune_data: Dict, safety_analysis: Dict) -> str:
        """Assess installation complexity"""
        
        complexity_factors = 0
        
        if tune_data.get('tune_type') == 'ECU_FLASH':
            complexity_factors += 2
        elif tune_data.get('tune_type') == 'PIGGYBACK':
            complexity_factors += 1
        
        if tune_data.get('required_exhaust'):
            complexity_factors += 1
        
        if safety_analysis['overall_score'] < 70:
            complexity_factors += 1
        
        if complexity_factors >= 3:
            return 'COMPLEX'
        elif complexity_factors >= 1:
            return 'MODERATE'
        else:
            return 'SIMPLE'
    
    def _identify_special_tools(self, tune_data: Dict) -> str:
        """Identify special tools required"""
        
        tools = []
        
        if tune_data.get('tune_type') == 'ECU_FLASH':
            tools.append("ECU flashing cable/device")
            tools.append("Laptop with tuning software")
        
        if tune_data.get('required_exhaust'):
            tools.append("Basic hand tools for exhaust installation")
        
        if tune_data.get('required_air_filter'):
            tools.append("Basic hand tools for air filter installation")
        
        return ", ".join(tools) if tools else "No special tools required"
    
    def _parse_ai_safety_response(self, ai_response: str) -> Dict:
        """Parse AI safety analysis response"""
        
        try:
            # Extract safety score
            score_match = re.search(r'(?:safety\s+score|score):\s*(\d+)', ai_response.lower())
            score = int(score_match.group(1)) if score_match else 75
            
            # Extract confidence
            confidence_match = re.search(r'confidence:\s*(\d+(?:\.\d+)?)', ai_response.lower())
            confidence = float(confidence_match.group(1)) if confidence_match else 0.8
            if confidence > 1.0:
                confidence = confidence / 100.0
            
            # Extract risks
            risks = {
                'lean_afr': 'lean' in ai_response.lower() and ('afr' in ai_response.lower() or 'fuel' in ai_response.lower()),
                'timing': 'timing' in ai_response.lower() and ('aggressive' in ai_response.lower() or 'advance' in ai_response.lower()),
                'emissions': 'emission' in ai_response.lower() and ('concern' in ai_response.lower() or 'impact' in ai_response.lower()),
            }
            
            return {
                'score': score,
                'confidence': confidence,
                'risks': risks,
                'detailed_report': ai_response[:500] + "...",
                'reasoning': "AI analysis completed successfully"
            }
            
        except Exception as e:
            logger.warning(f"Error parsing AI response: {e}")
            return {
                'score': 75,
                'confidence': 0.7,
                'risks': {},
                'detailed_report': "AI analysis completed with limited parsing",
                'reasoning': f"Parsing error: {str(e)}"
            }
    
    def _parse_performance_predictions(self, ai_response: str, tune_data: Dict) -> Dict:
        """Parse AI performance predictions"""
        
        try:
            # Extract HP gain
            hp_match = re.search(r'(?:hp|horsepower)\s+gain:\s*(\d+(?:\.\d+)?)', ai_response.lower())
            hp_gain = float(hp_match.group(1)) if hp_match else self._estimate_hp_gain(tune_data)
            
            # Extract torque gain
            torque_match = re.search(r'torque\s+gain:\s*(\d+(?:\.\d+)?)', ai_response.lower())
            torque_gain = float(torque_match.group(1)) if torque_match else hp_gain * 0.8
            
            # Determine throttle response
            if 'much better' in ai_response.lower() or 'significantly' in ai_response.lower():
                throttle_response = 'Significantly Improved'
            elif 'better' in ai_response.lower() or 'improved' in ai_response.lower():
                throttle_response = 'Moderately Improved'
            else:
                throttle_response = 'Slightly Improved'
            
            # Determine fuel efficiency impact
            if 'worse' in ai_response.lower() or 'decreased' in ai_response.lower():
                fuel_efficiency = 'Reduced (more power-focused)'
            elif 'improved' in ai_response.lower():
                fuel_efficiency = 'Improved'
            else:
                fuel_efficiency = 'Similar to stock'
            
            # Generate highlights
            highlights = []
            if hp_gain > 15:
                highlights.append(f"+{hp_gain:.1f} HP power increase")
            if torque_gain > 10:
                highlights.append(f"+{torque_gain:.1f} lb-ft torque gain")
            if 'better' in throttle_response.lower():
                highlights.append("Improved throttle response")
            
            return {
                'hp_gain': hp_gain,
                'torque_gain': torque_gain,
                'throttle_response': throttle_response,
                'fuel_efficiency': fuel_efficiency,
                'highlights': highlights[:3],  # Top 3 highlights
            }
            
        except Exception as e:
            logger.warning(f"Error parsing performance predictions: {e}")
            return self._fallback_performance_prediction(tune_data)
    
    def _estimate_hp_gain(self, tune_data: Dict) -> float:
        """Estimate HP gain based on motorcycle and tune type"""
        
        # Basic estimates based on motorcycle type and tune type
        base_estimates = {
            'ECU_FLASH': 15.0,
            'PIGGYBACK': 8.0,
            'MAP': 12.0,
            'FULL_SYSTEM': 20.0,
        }
        
        base_gain = base_estimates.get(tune_data.get('tune_type', 'MAP'), 10.0)
        
        # Adjust for motorcycle year (newer bikes typically have more restrictive stock tunes)
        year = tune_data.get('motorcycle_year', 2020)
        if year >= 2018:
            base_gain *= 1.2  # More potential on newer bikes
        elif year <= 2010:
            base_gain *= 0.8  # Less potential on older bikes
        
        return base_gain
    
    def _check_motorcycle_specific_risks(self, tune_data: Dict) -> Dict:
        """Check for motorcycle-specific risks"""
        
        risks = {}
        warnings = []
        score_penalty = 0
        
        # Check for known problematic combinations
        make = tune_data.get('motorcycle_make', '').lower()
        model = tune_data.get('motorcycle_model', '').lower()
        year = tune_data.get('motorcycle_year', 2020)
        
        # Example specific checks (expand based on motorcycle knowledge)
        if 'r6' in model and year >= 2017:
            warnings.append("R6 2017+ requires careful timing due to emissions compliance")
            score_penalty += 5
        
        if 'zx-10r' in model and 'ecu_flash' in tune_data.get('tune_type', '').lower():
            warnings.append("ZX-10R ECU flash requires specific procedures to avoid brick")
            risks['brick_risk'] = True
            score_penalty += 10
        
        return {
            'risks': risks,
            'warnings': warnings,
            'score_penalty': score_penalty
        }
    
    def _assess_modification_requirements(self, tune_data: Dict) -> Dict:
        """Assess risks from required modifications"""
        
        warnings = []
        score_penalty = 0
        
        if tune_data.get('required_exhaust'):
            if 'full system' in tune_data['required_exhaust'].lower():
                warnings.append("Full exhaust system required - significant modification")
                score_penalty += 5
        
        if tune_data.get('required_fuel_system'):
            warnings.append("Fuel system modifications required - complexity increase")
            score_penalty += 10
        
        if tune_data.get('other_required_mods'):
            warnings.append("Additional modifications required - review carefully")
            score_penalty += 5
        
        return {
            'warnings': warnings,
            'score_penalty': score_penalty
        }
    
    def _calculate_creator_bonus(self, creator_level: str) -> int:
        """Calculate safety score bonus based on creator level"""
        
        bonuses = {
            'BASIC': 0,
            'PROFESSIONAL': 5,
            'EXPERT': 10,
            'PARTNER': 15,
        }
        
        return bonuses.get(creator_level, 0)
    
    def _detect_suspicious_patterns(self, tune_content: str) -> bool:
        """Detect suspicious patterns that might indicate malicious content"""
        
        suspicious_patterns = [
            r'\.exe\b',
            r'eval\s*\(',
            r'exec\s*\(',
            r'system\s*\(',
            b'\x4d\x5a',  # PE header
        ]
        
        content_bytes = tune_content.encode() if isinstance(tune_content, str) else tune_content
        
        for pattern in suspicious_patterns:
            if isinstance(pattern, bytes):
                if pattern in content_bytes:
                    return True
            else:
                if re.search(pattern, tune_content, re.IGNORECASE):
                    return True
        
        return False
    
    def _extract_tune_content(self, file_path: str) -> str:
        """Extract content from motorcycle ECU tune file for analysis"""
        
        try:
            if not file_path or not os.path.exists(file_path):
                return "No file content available for analysis"
            
            # Import the ECUBinaryParser for enhanced parsing
            from ..tunes.safety_views import ECUBinaryParser
            
            # Determine file extension
            file_ext = '.' + file_path.lower().split('.')[-1] if '.' in file_path else ''
            
            # Use enhanced ECU binary parser for detailed analysis
            parser = ECUBinaryParser()
            parsing_result = parser.parse_ecu_file(file_path, file_ext)
            
            # Build comprehensive content analysis for AI
            content_analysis = []
            
            content_analysis.append(f"ECU File Analysis for: {os.path.basename(file_path)}")
            content_analysis.append(f"File Format: {file_ext}")
            content_analysis.append(f"File Size: {parsing_result.get('file_size', 0) // 1024}KB")
            content_analysis.append("")
            
            # ECU Metadata
            if parsing_result.get('ecu_metadata'):
                metadata = parsing_result['ecu_metadata']
                content_analysis.append("ECU MANUFACTURER DETECTION:")
                content_analysis.append(f"Primary Manufacturer: {metadata.get('primary_manufacturer', 'Unknown')}")
                if metadata.get('detected_manufacturers'):
                    content_analysis.append(f"Detected Signatures: {', '.join(metadata['detected_manufacturers'])}")
                content_analysis.append(f"Detection Confidence: {metadata.get('confidence', 'Low')}")
                content_analysis.append("")
            
            # Calibration Tables Analysis
            if parsing_result.get('calibration_tables'):
                tables = parsing_result['calibration_tables']
                content_analysis.append("CALIBRATION TABLE ANALYSIS:")
                content_analysis.append(f"Potential Tables Detected: {tables.get('potential_tables_detected', 0)}")
                content_analysis.append(f"Structure Type: {tables.get('structure_type', 'Unknown')}")
                
                if tables.get('detected_types'):
                    content_analysis.append("Detected Table Types:")
                    for table_type in tables['detected_types']:
                        content_analysis.append(f"  - {table_type.replace('_', ' ').title()}")
                
                if tables.get('data_patterns'):
                    content_analysis.append("Data Patterns:")
                    for pattern in tables['data_patterns']:
                        content_analysis.append(f"  - {pattern}")
                content_analysis.append("")
            
            # Safety-Relevant Data
            if parsing_result.get('safety_data'):
                safety = parsing_result['safety_data']
                content_analysis.append("SAFETY-RELEVANT PATTERNS:")
                
                if safety.get('potential_afr_tables'):
                    content_analysis.append("⚠️ AFR Table Patterns Detected - Requires careful analysis")
                if safety.get('potential_timing_tables'):
                    content_analysis.append("⚠️ Timing Table Patterns Detected - Check advance limits")
                if safety.get('rev_limiter_patterns'):
                    content_analysis.append("⚠️ Rev Limiter Patterns Detected - Verify RPM limits")
                
                if safety.get('safety_score_factors'):
                    content_analysis.append("Safety Analysis Factors:")
                    for factor in safety['safety_score_factors']:
                        content_analysis.append(f"  - {factor}")
                
                if safety.get('numerical_values_found'):
                    content_analysis.append(f"Numerical Values Found: {safety['numerical_values_found']}")
                    if safety.get('value_range'):
                        range_info = safety['value_range']
                        content_analysis.append(f"Value Range: {range_info.get('min', 'N/A')} to {range_info.get('max', 'N/A')}")
                
                content_analysis.append("")
            
            # Parsing Warnings
            if parsing_result.get('warnings'):
                content_analysis.append("PARSING WARNINGS:")
                for warning in parsing_result['warnings']:
                    content_analysis.append(f"⚠️ {warning}")
                content_analysis.append("")
            
            # Additional Format-Specific Analysis
            if file_ext in ['.bin', '.bdm', '.rom']:
                content_analysis.append("BINARY ECU ANALYSIS:")
                content_analysis.append("- Raw binary ECU firmware dump detected")
                content_analysis.append("- Contains direct calibration table data")
                content_analysis.append("- Suitable for comprehensive AFR and timing analysis")
                
            elif file_ext == '.hex':
                content_analysis.append("INTEL HEX FORMAT ANALYSIS:")
                content_analysis.append("- Text-based hexadecimal representation")
                content_analysis.append("- Parseable for table extraction")
                
                if parsing_result.get('ecu_metadata', {}).get('hex_records_analyzed'):
                    records = parsing_result['ecu_metadata']['hex_records_analyzed']
                    content_analysis.append(f"- {records} valid HEX records analyzed")
            
            elif file_ext == '.map':
                content_analysis.append("MAP FILE ANALYSIS:")
                content_analysis.append("- Calibration map format detected")
                content_analysis.append("- Contains lookup tables and calibration data")
                
            elif file_ext in ['.pcv', '.fmi', '.wrf', '.tec']:
                content_analysis.append("TUNING TOOL CONTAINER ANALYSIS:")
                content_analysis.append(f"- {file_ext.upper()} container format detected")
                content_analysis.append("- Wrapper around core ECU calibration data")
                content_analysis.append("- May contain additional metadata for safety analysis")
            
            # Parsing Success Status
            content_analysis.append("")
            if parsing_result.get('parsing_success'):
                content_analysis.append("✅ ECU file parsing successful - Ready for AI safety analysis")
            else:
                content_analysis.append("⚠️ Limited parsing success - Using basic analysis methods")
            
            return "\n".join(content_analysis)
        
        except Exception as e:
            logger.warning(f"Enhanced ECU content extraction failed: {e}")
            # Fallback to basic file info
            try:
                file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                return f"ECU Tune File Analysis:\nFile: {os.path.basename(file_path)}\nSize: {file_size//1024}KB\nBasic analysis mode - detailed parsing unavailable"
            except:
                return f"ECU Tune File Analysis for: {file_path}\n[Enhanced content extraction unavailable]"
    
    def _fallback_analysis(self, tune_data: Dict) -> Dict:
        """Fallback analysis when AI fails"""
        
        return {
            'safety_score': 75,
            'ai_confidence': 0.6,
            'skill_level_required': 'INTERMEDIATE',
            'lean_afr_risk': False,
            'timing_risk': False,
            'emissions_impact': True,
            'ecu_brick_risk': False,
            'estimated_hp_gain': 10.0,
            'estimated_torque_gain': 8.0,
            'throttle_response_improvement': 'Moderately Improved',
            'fuel_efficiency_impact': 'Similar',
            'safety_badge': 'MODERATE',
            'risk_flags': ['⚠️ Limited analysis available'],
            'performance_highlights': ['Moderate performance gains expected'],
            'warranty_implications': 'ECU modifications may void warranty.',
            'emissions_disclaimer': 'Verify local emission compliance.',
            'installation_complexity': 'MODERATE',
            'backup_required': True,
            'special_tools_required': 'ECU interface cable recommended',
            'detailed_analysis': 'Fallback analysis used due to AI service unavailability.',
            'ai_reasoning': 'Using conservative safety estimates.'
        }
    
    def _fallback_performance_prediction(self, tune_data: Dict) -> Dict:
        """Fallback performance prediction"""
        
        hp_gain = self._estimate_hp_gain(tune_data)
        
        return {
            'hp_gain': hp_gain,
            'torque_gain': hp_gain * 0.8,
            'throttle_response': 'Moderately Improved',
            'fuel_efficiency': 'Similar to stock',
            'highlights': [f'+{hp_gain:.1f} HP estimated gain', 'Improved throttle response']
        } 

    def _get_hybrid_rag_context(self, tune_data: Dict, structured_ecu_data: Any, hybrid_rag) -> Dict:
        """Get enhanced context using HybridRAG system"""
        
        try:
            # Prepare motorcycle context for graph traversal
            motorcycle_context = {
                'make': tune_data.get('motorcycle_make'),
                'model': tune_data.get('motorcycle_model'),
                'year': tune_data.get('motorcycle_year'),
                'ecu_type': tune_data.get('ecu_type')
            }
            
            # Create search queries based on tune characteristics
            search_queries = []
            
            # Base query
            base_query = f"{tune_data.get('motorcycle_make')} {tune_data.get('motorcycle_model')} ECU tune safety analysis"
            search_queries.append(base_query)
            
            # AFR-specific query if we have fuel map data
            if structured_ecu_data.fuel_maps:
                fuel_map = structured_ecu_data.fuel_maps[0]
                all_afr_values = []
                for row in fuel_map.values:
                    all_afr_values.extend(row)
                
                min_afr = min(all_afr_values)
                max_afr = max(all_afr_values)
                
                if min_afr < 12.5 or max_afr > 15.0:
                    search_queries.append(f"AFR safety {min_afr} to {max_afr} motorcycle engine damage risk")
            
            # Timing-specific query if we have ignition data
            if structured_ecu_data.ignition_maps:
                ignition_map = structured_ecu_data.ignition_maps[0]
                all_timing_values = []
                for row in ignition_map.values:
                    all_timing_values.extend(row)
                
                max_timing = max(all_timing_values)
                
                if max_timing > 30.0:
                    search_queries.append(f"ignition timing advance {max_timing} degrees knock detonation safety")
            
            # Perform hybrid searches
            hybrid_results = []
            for query in search_queries[:3]:  # Limit to 3 queries for performance
                result = hybrid_rag.hybrid_search(query, motorcycle_context, top_k=3)
                hybrid_results.append(result)
            
            # Compile enhanced context
            enhanced_context = {
                'similar_tunes': [],
                'safety_patterns': [],
                'manufacturer_insights': [],
                'hybrid_confidence': 0.0,
                'insights': []
            }
            
            # Aggregate results from all searches
            for result in hybrid_results:
                if result.vector_results:
                    for vector_result in result.vector_results:
                        if vector_result not in enhanced_context['similar_tunes']:
                            enhanced_context['similar_tunes'].append(vector_result)
                
                if result.graph_context:
                    # Merge graph context
                    graph_patterns = result.graph_context.get('safety_patterns', [])
                    for pattern in graph_patterns:
                        if pattern not in enhanced_context['safety_patterns']:
                            enhanced_context['safety_patterns'].append(pattern)
                    
                    # Add manufacturer insights
                    related_models = result.graph_context.get('related_models', [])
                    if related_models:
                        enhanced_context['manufacturer_insights'].extend(related_models)
                
                # Update confidence (take maximum)
                enhanced_context['hybrid_confidence'] = max(
                    enhanced_context['hybrid_confidence'], 
                    result.confidence_score
                )
            
            # Generate safety insights
            enhanced_context['insights'] = self._generate_hybrid_rag_insights(
                enhanced_context, tune_data, structured_ecu_data, hybrid_rag
            )
            
            return enhanced_context
            
        except Exception as e:
            logger.error(f"HybridRAG context generation failed: {str(e)}")
            return {
                'similar_tunes': [],
                'safety_patterns': [],
                'manufacturer_insights': [],
                'hybrid_confidence': 0.0,
                'insights': ['HybridRAG context unavailable - using standard analysis']
            }
    
    def _generate_hybrid_rag_insights(self, context: Dict, tune_data: Dict, structured_ecu_data: Any, hybrid_rag) -> List[str]:
        """Generate actionable insights from HybridRAG analysis"""
        
        insights = []
        
        try:
            # Similar tune insights
            similar_tunes = context.get('similar_tunes', [])
            if similar_tunes:
                high_similarity_tunes = [t for t in similar_tunes if t.get('similarity_score', 0) > 0.8]
                if high_similarity_tunes:
                    insights.append(f"🔍 Found {len(high_similarity_tunes)} highly similar tunes with proven safety records")
                
                # Safety comparison insights
                safe_similar_count = sum(1 for t in similar_tunes if 'safe' in t.get('document', '').lower())
                if safe_similar_count > 0:
                    insights.append(f"✅ {safe_similar_count} similar tunes have been validated as safe")
            
            # Safety pattern insights
            safety_patterns = context.get('safety_patterns', [])
            for pattern in safety_patterns:
                if pattern.get('type') == 'dangerous_afr_pattern':
                    insights.append(f"⚠️ Warning: {pattern['count']} similar tunes flagged for lean AFR conditions")
                elif pattern.get('type') == 'dangerous_timing_pattern':
                    insights.append(f"⚠️ Warning: {pattern['count']} similar tunes flagged for excessive timing advance")
            
            # Manufacturer-specific insights
            manufacturer = tune_data.get('motorcycle_make', '').lower()
            manufacturer_warnings = hybrid_rag.get_manufacturer_warnings(manufacturer)
            if manufacturer_warnings:
                insights.append(f"🏭 {manufacturer.title()} Specific: {manufacturer_warnings[0]}")
            
            # Safety threshold insights
            model_key = f"{manufacturer}_{tune_data.get('motorcycle_model', '').lower().replace('-', '_')}"
            safety_threshold = hybrid_rag.get_safety_threshold(model_key)
            
            if safety_threshold and structured_ecu_data.fuel_maps:
                fuel_map = structured_ecu_data.fuel_maps[0]
                all_afr_values = []
                for row in fuel_map.values:
                    all_afr_values.extend(row)
                
                min_afr = min(all_afr_values)
                max_afr = max(all_afr_values)
                
                if min_afr < safety_threshold.safe_afr_min:
                    insights.append(f"🚨 AFR {min_afr:.1f} below safe minimum {safety_threshold.safe_afr_min} for this model")
                elif max_afr > safety_threshold.safe_afr_max:
                    insights.append(f"🚨 AFR {max_afr:.1f} above safe maximum {safety_threshold.safe_afr_max} for this model")
                else:
                    insights.append(f"✅ AFR values within safe range for {manufacturer.title()} {tune_data.get('motorcycle_model')}")
            
            # High confidence insights
            confidence = context.get('hybrid_confidence', 0.0)
            if confidence > 0.8:
                insights.append(f"🎯 High confidence analysis ({confidence:.1%}) - comprehensive data available")
            elif confidence < 0.5:
                insights.append(f"⚠️ Limited historical data available - exercising extra caution")
            
        except Exception as e:
            logger.error(f"Insight generation failed: {str(e)}")
            insights.append("⚠️ Insight generation encountered issues - manual review recommended")
        
        return insights[:6]  # Limit to top 6 insights
    
    def _analyze_structured_calibration_data_with_hybrid_rag(self, structured_json: str, tune_data: Dict, hybrid_context: Dict) -> Dict:
        """Enhanced LLM analysis with HybridRAG context"""
        
        try:
            # Prepare enhanced calibration analysis prompt with HybridRAG context
            calibration_prompt = f"""
            MOTORCYCLE ECU CALIBRATION SAFETY ANALYSIS WITH HYBRIDRAG ENHANCEMENT

            You are analyzing a motorcycle ECU tune for safety compliance with advanced context from similar tunes and safety patterns. Your analysis determines if this tune can be safely uploaded to our platform.

            CRITICAL: If you identify ANY serious safety issues, the tune MUST BE BLOCKED from upload.

            MOTORCYCLE INFORMATION:
            - Make/Model: {tune_data.get('motorcycle_make')} {tune_data.get('motorcycle_model')} {tune_data.get('motorcycle_year')}
            - Engine: {tune_data.get('engine_type')}
            - ECU Type: {tune_data.get('ecu_type')}
            - Tune Type: {tune_data.get('tune_type')}
            - Creator Level: {tune_data.get('creator_level', 'BASIC')}

            STRUCTURED ECU CALIBRATION DATA:
            {structured_json}

            HYBRIDRAG ENHANCED CONTEXT:
            Similar Tunes Found: {len(hybrid_context.get('similar_tunes', []))}
            Safety Pattern Matches: {len(hybrid_context.get('safety_patterns', []))}
            Analysis Confidence: {hybrid_context.get('hybrid_confidence', 0.0):.1%}

            Historical Safety Insights:
            {chr(10).join('- ' + insight for insight in hybrid_context.get('insights', []))}

            Safety Patterns from Similar Tunes:
            {chr(10).join('- ' + str(pattern.get('description', '')) for pattern in hybrid_context.get('safety_patterns', []))}

            PERFORM DETAILED SAFETY ANALYSIS WITH HISTORICAL CONTEXT:

            1. FUEL MAP ANALYSIS (CRITICAL SAFETY + HISTORICAL COMPARISON):
               - Analyze each AFR value in fuel maps
               - Compare with similar tunes from database
               - Safe AFR range: 12.5-14.7 (stoichiometric ±1.0)
               - DANGER ZONES: AFR < 11.5 (too rich) or > 15.5 (lean engine damage)
               - Consider historical data showing problem patterns
               - Check for smooth progression between cells

            2. IGNITION TIMING ANALYSIS (ENGINE DAMAGE RISK + PATTERN RECOGNITION):
               - Analyze timing advance values at each RPM/load point
               - Reference similar tunes that caused knock/damage
               - Safe timing: Generally <30° advance
               - DANGER ZONE: >35° advance (knock risk, engine damage)
               - Use historical data to validate timing safety for this specific model

            3. REV LIMITER SAFETY (MODEL-SPECIFIC VALIDATION):
               - Compare limits with known safe values for this motorcycle
               - Soft limit should be reasonable (typically 10,000-13,000 RPM)
               - Hard limit should not exceed safe mechanical limits
               - DANGER: Limits >15,000 RPM for most motorcycles

            4. HISTORICAL SAFETY VALIDATION:
               - Consider patterns from {len(hybrid_context.get('similar_tunes', []))} similar tunes
               - Account for any reported safety issues with similar configurations
               - Validate against manufacturer-specific warnings
               - Use confidence level {hybrid_context.get('hybrid_confidence', 0.0):.1%} in decision making

            5. ENHANCED RIDER SKILL ASSESSMENT:
               - BEGINNER: Conservative AFR (13.5-14.2), timing <25°, proven safe configurations
               - INTERMEDIATE: Moderate performance, AFR 13.0-14.5, timing <30°, similar to validated tunes
               - EXPERT: Advanced performance, AFR 12.8-14.7, timing <35°, track-focused with historical success

            PROVIDE YOUR ENHANCED ANALYSIS:

            SAFETY_SCORE: [0-100]
            CONFIDENCE: [0.0-1.0]
            HYBRIDRAG_CONFIDENCE: {hybrid_context.get('hybrid_confidence', 0.0):.2f}
            
            FUEL_MAP_ANALYSIS:
            - Safest AFR found: [value]
            - Leanest AFR found: [value] 
            - Historical comparison: [SAFER/SIMILAR/MORE_AGGRESSIVE than similar tunes]
            - Dangerous lean zones: [list any AFR > 15.5]
            - Overall fuel safety: [SAFE/MODERATE/DANGEROUS]

            IGNITION_TIMING_ANALYSIS:
            - Maximum timing advance: [value]°
            - Historical comparison: [SAFER/SIMILAR/MORE_AGGRESSIVE than similar tunes]
            - Aggressive timing zones: [list any >35°]
            - Overall timing safety: [SAFE/MODERATE/DANGEROUS]

            HISTORICAL_SAFETY_VALIDATION:
            - Similar tune safety record: [EXCELLENT/GOOD/CONCERNING/UNKNOWN]
            - Pattern match concerns: [list any concerning patterns]
            - Manufacturer-specific risks: [list any known issues]

            CRITICAL_SAFETY_VIOLATIONS:
            [List any violations that should BLOCK upload, considering historical data]

            RECOMMENDED_SKILL_LEVEL: [BEGINNER/INTERMEDIATE/EXPERT]

            UPLOAD_DECISION: [APPROVE/REVIEW/BLOCK]
            BLOCK_REASON: [If BLOCK, explain with historical context]

            Enhanced Safety Note: Your analysis benefits from {len(hybrid_context.get('similar_tunes', []))} similar tunes and {len(hybrid_context.get('safety_patterns', []))} safety patterns. Use this historical context to make more informed safety decisions.
            """
            
            # Query LLM with enhanced structured data + HybridRAG context
            llm_response = self.llm_service._query_ollama(calibration_prompt)
            
            # Parse LLM response into structured format
            parsed_analysis = self._parse_structured_calibration_response(llm_response)
            
            # Add HybridRAG-specific data
            parsed_analysis['hybrid_rag_confidence'] = hybrid_context.get('hybrid_confidence', 0.0)
            parsed_analysis['similar_tune_analysis'] = len(hybrid_context.get('similar_tunes', []))
            parsed_analysis['historical_context_used'] = True
            
            return parsed_analysis
            
        except Exception as e:
            logger.error(f"Enhanced HybridRAG calibration analysis failed: {str(e)}")
            return {
                'safety_score': 50,
                'ai_confidence': 0.5,
                'hybrid_rag_confidence': 0.0,
                'analysis_method': 'fallback_due_to_hybridrag_error',
                'historical_context_used': False,
                'error': str(e)
            }
    
    def _evaluate_safety_blocking_with_hybrid_context(self, analysis: Dict, structured_data: Any, hybrid_context: Dict) -> Dict:
        """Enhanced safety blocking evaluation with HybridRAG insights"""
        
        blocking_result = {
            'block_upload': False,
            'block_reason': '',
            'violations': []
        }
        
        try:
            # Standard safety blocking checks
            standard_blocking = self._evaluate_safety_blocking(analysis, structured_data)
            
            if standard_blocking['block_upload']:
                return standard_blocking
            
            # Enhanced HybridRAG-based blocking
            
            # Check for concerning historical patterns
            safety_patterns = hybrid_context.get('safety_patterns', [])
            for pattern in safety_patterns:
                if pattern.get('count', 0) > 3:  # Multiple instances of the same problem
                    blocking_result['block_upload'] = True
                    blocking_result['block_reason'] = f"Historical pattern concern: {pattern.get('description')}"
                    blocking_result['violations'].append(f"Pattern match: {pattern['count']} similar tunes flagged for {pattern.get('type')}")
                    return blocking_result
            
            # Check HybridRAG confidence - if very low confidence and safety score marginal, be more conservative
            hybrid_confidence = hybrid_context.get('hybrid_confidence', 1.0)
            safety_score = analysis.get('safety_score', 100)
            
            if hybrid_confidence < 0.3 and safety_score < 70:
                blocking_result['block_upload'] = True
                blocking_result['block_reason'] = f"Low historical data confidence ({hybrid_confidence:.1%}) with marginal safety score ({safety_score})"
                blocking_result['violations'].append("Insufficient historical validation data for risk assessment")
                return blocking_result
            
            # Check manufacturer-specific thresholds if available
            manufacturer_insights = hybrid_context.get('manufacturer_insights', [])
            if manufacturer_insights and safety_score < 60:
                blocking_result['block_upload'] = True
                blocking_result['block_reason'] = "Safety score below manufacturer-specific threshold with historical context"
                blocking_result['violations'].append("Failed manufacturer-specific safety validation")
                return blocking_result
            
            return blocking_result
            
        except Exception as e:
            logger.error(f"Enhanced safety blocking evaluation error: {str(e)}")
            # On error, be conservative and block
            blocking_result['block_upload'] = True
            blocking_result['block_reason'] = f'HybridRAG safety evaluation error: {str(e)}'
            blocking_result['violations'] = ['Enhanced safety analysis failed - blocking for safety']
            return blocking_result
    
    def _add_tune_to_hybrid_rag_system(self, tune_data: Dict, structured_ecu_data: Any, analysis: Dict, hybrid_rag):
        """Add approved tune to HybridRAG system for future analysis"""
        
        try:
            # Only add approved/safe tunes to the knowledge base
            if analysis.get('review_status') not in ['REJECTED'] and analysis.get('safety_score', 0) >= 60:
                
                # Create TuneNode for graph
                afr_range = (14.7, 14.7)  # Default
                timing_max = 25.0  # Default
                rev_limit = 11000  # Default
                
                if structured_ecu_data.fuel_maps:
                    fuel_map = structured_ecu_data.fuel_maps[0]
                    all_afr_values = []
                    for row in fuel_map.values:
                        all_afr_values.extend(row)
                    afr_range = (min(all_afr_values), max(all_afr_values))
                
                if structured_ecu_data.ignition_maps:
                    ignition_map = structured_ecu_data.ignition_maps[0]
                    all_timing_values = []
                    for row in ignition_map.values:
                        all_timing_values.extend(row)
                    timing_max = max(all_timing_values)
                
                if structured_ecu_data.rev_limiter:
                    rev_limit = structured_ecu_data.rev_limiter.soft_limit
                
                from .hybrid_rag_system import TuneNode
                
                tune_node = TuneNode(
                    tune_id=str(tune_data.get('id', 'unknown')),
                    name=tune_data.get('name', 'Unknown Tune'),
                    motorcycle_make=tune_data.get('motorcycle_make', 'Unknown'),
                    motorcycle_model=tune_data.get('motorcycle_model', 'Unknown'),
                    motorcycle_year=tune_data.get('motorcycle_year', 2020),
                    ecu_type=tune_data.get('ecu_type', 'Unknown'),
                    tune_type=tune_data.get('tune_type', 'ECU_FLASH'),
                    safety_score=analysis.get('safety_score', 75),
                    afr_range=afr_range,
                    timing_max=timing_max,
                    rev_limit=rev_limit,
                    creator_level=tune_data.get('creator_level', 'BASIC'),
                    upload_date=datetime.now().isoformat()
                )
                
                # Add to graph
                hybrid_rag.add_tune_to_graph(tune_node, analysis)
                
                # Add to vector store
                hybrid_rag.add_tune_to_vector_store(tune_data, structured_ecu_data)
                
                logger.info(f"Added tune {tune_data.get('id')} to HybridRAG knowledge base")
                
        except Exception as e:
            logger.error(f"Failed to add tune to HybridRAG system: {str(e)}")
            # Non-critical error - continue with analysis 


# Factory function for easy import
def get_tune_review_service():
    """
    Factory function to get a TuneReviewService instance
    Returns a singleton instance for efficiency
    """
    if not hasattr(get_tune_review_service, '_instance'):
        get_tune_review_service._instance = TuneReviewService()
    return get_tune_review_service._instance