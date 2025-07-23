"""
FREE LLM Service using Local Ollama Deployment
Zero-cost Mistral 7B implementation for RevSync AI features
"""

import json
import asyncio
import logging
import requests
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

from django.conf import settings
from django.core.cache import cache
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)

@dataclass
class UserProfile:
    user_id: int
    motorcycle_type: str
    skill_level: str
    riding_styles: List[str]
    goals: List[str]
    experience: str
    bike_details: Optional[Dict] = None

@dataclass
class TuneAnalysis:
    tune_id: int
    safety_score: float
    safety_level: str
    compatibility_score: float
    performance_impact: Dict[str, Any]
    risks: List[str]
    benefits: List[str]
    recommendation_score: float
    explanation: str

class LLMService:
    """100% FREE Local LLM Service using Ollama + Mistral 7B"""
    
    def __init__(self):
        self.ollama_host = settings.AI_SETTINGS['OLLAMA_HOST']
        self.model_name = settings.AI_SETTINGS['MISTRAL_MODEL']
        self.embedder = SentenceTransformer(settings.AI_SETTINGS['EMBEDDING_MODEL'])
        self.cache_timeout = settings.AI_SETTINGS['RECOMMENDATION_CACHE_TIMEOUT']
        self.use_fallback = settings.AI_SETTINGS['FALLBACK_TO_SIMPLE_RULES']
        
        # Check if Ollama is available
        self.ollama_available = self._check_ollama_health()
        if not self.ollama_available and not self.use_fallback:
            logger.warning("Ollama not available and fallback disabled. AI features limited.")

    def _check_ollama_health(self) -> bool:
        """Check if Ollama service is running"""
        try:
            response = requests.get(f"{self.ollama_host}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False

    async def analyze_tune_safety(self, tune_data: Dict[str, Any]) -> TuneAnalysis:
        """Analyze tune safety using FREE local Mistral 7B"""
        cache_key = f"tune_safety_{tune_data.get('id', 'unknown')}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            return TuneAnalysis(**cached_result)
        
        if self.ollama_available:
            try:
                # Use FREE local Mistral 7B for safety analysis
                analysis = await self._analyze_with_local_llm(tune_data)
            except Exception as e:
                logger.error(f"Local LLM analysis failed: {e}")
                analysis = self._create_rule_based_analysis(tune_data)
        else:
            # Use FREE rule-based analysis as fallback
            analysis = self._create_rule_based_analysis(tune_data)
        
        # Cache the result
        cache.set(cache_key, analysis.__dict__, self.cache_timeout)
        return analysis

    async def _analyze_with_local_llm(self, tune_data: Dict[str, Any]) -> TuneAnalysis:
        """Use FREE local Mistral 7B for tune safety analysis"""
        prompt = self._create_safety_analysis_prompt(tune_data)
        
        # Call FREE local Ollama API
        response = await self._call_ollama(prompt)
        
        if response:
            return self._parse_safety_analysis(response, tune_data)
        else:
            return self._create_rule_based_analysis(tune_data)

    async def _call_ollama(self, prompt: str, max_tokens: int = 1000) -> Optional[str]:
        """Call FREE local Ollama API"""
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
            
            response = requests.post(
                f"{self.ollama_host}/api/generate",
                json=payload,
                timeout=settings.AI_SETTINGS['LLM_TIMEOUT_SECONDS']
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', '')
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Ollama API call failed: {e}")
            return None

    def _create_safety_analysis_prompt(self, tune_data: Dict[str, Any]) -> str:
        """Create prompt for FREE local Mistral safety analysis"""
        return f"""
You are an expert motorcycle ECU tuning safety analyst. Analyze this tune for safety and provide a structured assessment.

TUNE DETAILS:
- Name: {tune_data.get('name', 'Unknown')}
- Category: {tune_data.get('category', 'Unknown')}
- Motorcycle: {tune_data.get('motorcycle_make', 'Unknown')} {tune_data.get('motorcycle_model', 'Unknown')}
- Description: {tune_data.get('description', 'No description')}
- Creator Verified: {tune_data.get('creator_verified', False)}
- Track Mode: {tune_data.get('track_mode_only', False)}

SAFETY ANALYSIS REQUIRED:
1. Safety Score (0-100): Rate overall safety
2. Safety Level: SAFE, MODERATE, RISKY, DANGEROUS
3. Compatibility Score (0-100): How well it matches the motorcycle
4. Performance Impact: Power increase %, fuel efficiency impact
5. Risks: List specific safety concerns
6. Benefits: List performance benefits
7. Recommendation: Should this tune be approved for marketplace?

Provide your analysis in this exact JSON format:
{
    "safety_score": 85,
    "safety_level": "SAFE",
    "compatibility_score": 90,
    "performance_impact": {
        "power_increase_percent": 15,
        "fuel_efficiency_change": -5,
        "engine_stress_level": "moderate"
    },
    "risks": ["Increased engine wear", "Higher fuel consumption"],
    "benefits": ["More responsive throttle", "Improved acceleration"],
    "recommendation_score": 80,
    "explanation": "This tune provides good performance gains with acceptable risk levels."
}

ANALYSIS:
"""

    def _parse_safety_analysis(self, llm_response: str, tune_data: Dict[str, Any]) -> TuneAnalysis:
        """Parse FREE Mistral 7B safety analysis response"""
        try:
            # Try to extract JSON from response
            response_lines = llm_response.strip().split('\n')
            json_lines = []
            in_json = False
            
            for line in response_lines:
                if '{' in line:
                    in_json = True
                if in_json:
                    json_lines.append(line)
                if '}' in line and in_json:
                    break
            
            json_text = '\n'.join(json_lines)
            analysis_data = json.loads(json_text)
            
            return TuneAnalysis(
                tune_id=tune_data.get('id', 0),
                safety_score=analysis_data.get('safety_score', 50),
                safety_level=analysis_data.get('safety_level', 'MODERATE'),
                compatibility_score=analysis_data.get('compatibility_score', 50),
                performance_impact=analysis_data.get('performance_impact', {}),
                risks=analysis_data.get('risks', []),
                benefits=analysis_data.get('benefits', []),
                recommendation_score=analysis_data.get('recommendation_score', 50),
                explanation=analysis_data.get('explanation', 'AI analysis completed')
            )
            
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {e}")
            return self._create_rule_based_analysis(tune_data)

    def _create_rule_based_analysis(self, tune_data: Dict[str, Any]) -> TuneAnalysis:
        """FREE rule-based safety analysis fallback"""
        # Simple rule-based scoring
        base_score = 70
        
        # Adjust based on tune characteristics
        if tune_data.get('creator_verified', False):
            base_score += 15
        
        if tune_data.get('track_mode_only', False):
            base_score -= 20  # Track tunes are riskier
        
        category = tune_data.get('category', '').lower()
        if 'performance' in category:
            base_score -= 10
        elif 'eco' in category or 'economy' in category:
            base_score += 10
        
        safety_score = max(0, min(100, base_score))
        
        # Determine safety level
        if safety_score >= 80:
            safety_level = "SAFE"
        elif safety_score >= 60:
            safety_level = "MODERATE"
        elif safety_score >= 40:
            safety_level = "RISKY"
        else:
            safety_level = "DANGEROUS"
        
        return TuneAnalysis(
            tune_id=tune_data.get('id', 0),
            safety_score=safety_score,
            safety_level=safety_level,
            compatibility_score=safety_score,  # Use similar score
            performance_impact={
                "power_increase_percent": 10,
                "fuel_efficiency_change": -5,
                "engine_stress_level": "moderate"
            },
            risks=["Potential increased engine wear", "May affect warranty"],
            benefits=["Improved performance", "Enhanced throttle response"],
            recommendation_score=safety_score,
            explanation=f"Rule-based analysis indicates {safety_level.lower()} tune with {safety_score}% confidence."
        )

    async def get_personalized_recommendations(
        self, 
        user_profile: UserProfile, 
        candidate_tunes: List[Dict[str, Any]], 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get personalized recommendations using FREE embeddings + local LLM"""
        
        if not candidate_tunes:
            return []
        
        # Step 1: Content-based filtering using FREE embeddings
        content_scores = await self._get_content_based_scores(user_profile, candidate_tunes)
        
        # Step 2: Simple collaborative filtering (FREE)
        collaborative_scores = await self._get_simple_collaborative_scores(user_profile, candidate_tunes)
        
        # Step 3: Combine scores
        combined_tunes = []
        for i, tune in enumerate(candidate_tunes):
            combined_score = (content_scores[i] * 0.6) + (collaborative_scores.get(tune['id'], 0.5) * 0.4)
            tune['match_score'] = combined_score
            combined_tunes.append(tune)
        
        # Step 4: Sort and limit
        sorted_tunes = sorted(combined_tunes, key=lambda x: x['match_score'], reverse=True)[:limit]
        
        # Step 5: Add AI explanations (if Ollama available)
        if self.ollama_available:
            try:
                for tune in sorted_tunes:
                    explanation = await self._generate_recommendation_explanation(user_profile, tune)
                    tune['ai_explanation'] = explanation
            except Exception as e:
                logger.error(f"Failed to generate AI explanations: {e}")
        
        return sorted_tunes

    async def _get_content_based_scores(self, user_profile: UserProfile, tunes: List[Dict[str, Any]]) -> List[float]:
        """FREE content-based filtering using sentence embeddings"""
        # Create user preference text
        user_text = f"Motorcycle type: {user_profile.motorcycle_type}. "
        user_text += f"Skill level: {user_profile.skill_level}. "
        user_text += f"Riding styles: {', '.join(user_profile.riding_styles)}. "
        user_text += f"Goals: {', '.join(user_profile.goals)}. "
        user_text += f"Experience: {user_profile.experience}"
        
        # Get user preference embedding
        user_embedding = self.embedder.encode([user_text])[0]
        
        # Get tune embeddings
        tune_texts = []
        for tune in tunes:
            tune_text = f"Name: {tune.get('name', '')}. "
            tune_text += f"Description: {tune.get('description', '')}. "
            tune_text += f"Category: {tune.get('category', '')}. "
            tune_text += f"Motorcycle: {tune.get('motorcycle_make', '')} {tune.get('motorcycle_model', '')}"
            tune_texts.append(tune_text)
        
        tune_embeddings = self.embedder.encode(tune_texts)
        
        # Calculate cosine similarities
        similarities = []
        for tune_embedding in tune_embeddings:
            similarity = np.dot(user_embedding, tune_embedding) / (
                np.linalg.norm(user_embedding) * np.linalg.norm(tune_embedding)
            )
            similarities.append(max(0, similarity))  # Ensure non-negative
        
        return similarities

    async def _get_simple_collaborative_scores(self, user_profile: UserProfile, tunes: List[Dict[str, Any]]) -> Dict[int, float]:
        """Simple FREE collaborative filtering based on popularity"""
        scores = {}
        
        for tune in tunes:
            # Simple popularity-based scoring
            download_count = tune.get('download_count', 0)
            rating = tune.get('average_rating', 0)
            
            # Normalize and combine
            popularity_score = min(download_count / 100, 1.0)  # Cap at 100 downloads = 1.0
            rating_score = rating / 5.0  # Normalize 5-star rating
            
            # Combine scores
            collaborative_score = (popularity_score * 0.4) + (rating_score * 0.6)
            scores[tune['id']] = collaborative_score
        
        return scores

    async def _generate_recommendation_explanation(self, user_profile: UserProfile, tune: Dict[str, Any]) -> str:
        """Generate FREE explanation using local Mistral 7B"""
        if not self.ollama_available:
            return f"This tune matches your {user_profile.skill_level} skill level and {user_profile.motorcycle_type} motorcycle preferences."
        
        prompt = f"""
Explain why this tune is recommended for this rider in 1-2 sentences:

RIDER PROFILE:
- Motorcycle: {user_profile.motorcycle_type}
- Skill: {user_profile.skill_level}
- Styles: {', '.join(user_profile.riding_styles)}
- Goals: {', '.join(user_profile.goals)}

RECOMMENDED TUNE:
- Name: {tune.get('name', '')}
- Category: {tune.get('category', '')}
- Description: {tune.get('description', '')}

Write a personalized explanation (max 50 words):
"""
        
        try:
            response = await self._call_ollama(prompt, max_tokens=100)
            if response:
                # Clean up the response
                explanation = response.strip().replace('\n', ' ')
                if len(explanation) > 200:
                    explanation = explanation[:200] + "..."
                return explanation
        except:
            pass
        
        # Fallback explanation
        return f"This {tune.get('category', 'tune')} matches your {user_profile.skill_level} skill level and {user_profile.motorcycle_type} motorcycle."

# Singleton factory
_llm_service_instance = None

def get_llm_service() -> LLMService:
    """Get singleton FREE LLM service instance"""
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance 