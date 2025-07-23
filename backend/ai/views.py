import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserRidingProfile, TuneAIAnalysis, AIRecommendation, UserInteractionLog
from .llm_service import get_llm_service, UserProfile as LLMUserProfile
from tunes.models import Tune
from tunes.serializers import TuneListSerializer

logger = logging.getLogger(__name__)

class OnboardingAPIView(APIView):
    """
    🚀 User onboarding API for collecting riding profile
    
    Creates user profile for AI-powered recommendations
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        📝 Complete user onboarding
        
        Expected payload:
        {
            "motorcycleType": "sport",
            "skillLevel": "intermediate", 
            "ridingStyle": ["commuting", "sport_street"],
            "goals": ["performance", "smoothness"],
            "experience": "3 years of riding experience..."
        }
        """
        try:
            data = request.data
            user = request.user
            
            # 🔍 Validate required fields
            required_fields = ['motorcycleType', 'skillLevel', 'ridingStyle', 'goals']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Missing required field: {field}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # 🏍️ Create or update riding profile
            profile, created = UserRidingProfile.objects.get_or_create(
                user=user,
                defaults={
                    'motorcycle_type': data['motorcycleType'],
                    'skill_level': data['skillLevel'],
                    'riding_styles': data['ridingStyle'],
                    'goals': data['goals'],
                    'experience_description': data.get('experience', ''),
                }
            )
            
            if not created:
                # Update existing profile
                profile.motorcycle_type = data['motorcycleType']
                profile.skill_level = data['skillLevel']
                profile.riding_styles = data['ridingStyle']
                profile.goals = data['goals']
                profile.experience_description = data.get('experience', '')
                profile.save()
            
            # 🤖 Generate AI rider type and safety profile
            import asyncio
            asyncio.run(self._generate_ai_insights(profile))
            
            # 🎯 Generate initial recommendations
            asyncio.run(self._generate_initial_recommendations(profile))
            
            # 📊 Log onboarding completion
            UserInteractionLog.objects.create(
                user=user,
                interaction_type='onboarding_completed',
                interaction_context={
                    'profile_data': data,
                    'is_new_user': created,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            logger.info(f"Onboarding completed for user {user.username}")
            
            return Response({
                'message': 'Onboarding completed successfully!',
                'profile_id': profile.id,
                'ai_rider_type': profile.ai_rider_type,
                'recommendations_ready': True
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Onboarding failed for user {request.user.username}: {str(e)}")
            return Response(
                {'error': 'Onboarding failed. Please try again.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request):
        """
        📊 Get current user profile
        """
        try:
            profile = UserRidingProfile.objects.get(user=request.user)
            return Response({
                'motorcycleType': profile.motorcycle_type,
                'skillLevel': profile.skill_level,
                'ridingStyle': profile.riding_styles,
                'goals': profile.goals,
                'experience': profile.experience_description,
                'aiRiderType': profile.ai_rider_type,
                'createdAt': profile.created_at,
                'updatedAt': profile.updated_at,
            })
        except UserRidingProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found. Complete onboarding first.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    async def _generate_ai_insights(self, profile: UserRidingProfile):
        """
        🤖 Generate AI insights for user profile
        """
        try:
            llm_service = get_llm_service()
            
            # Create LLM user profile
            llm_profile = LLMUserProfile(
                user_id=profile.user.id,
                motorcycle_type=profile.motorcycle_type,
                skill_level=profile.skill_level,
                riding_styles=profile.riding_styles,
                goals=profile.goals,
                experience=profile.experience_description
            )
            
            # 🧠 Generate rider archetype using AI
            rider_type_prompt = f"""
            Analyze this motorcycle rider profile and determine their rider archetype:
            
            Motorcycle: {profile.motorcycle_type}
            Skill: {profile.skill_level}
            Styles: {', '.join(profile.riding_styles)}
            Goals: {', '.join(profile.goals)}
            
            Return one of these archetypes:
            - "Speed Demon" (performance focused, track oriented)
            - "Daily Commuter" (practical, efficiency focused)
            - "Weekend Warrior" (recreational, touring focused)
            - "Track Enthusiast" (racing, performance focused)
            - "Adventure Seeker" (off-road, touring focused)
            - "Cruiser" (relaxed, comfort focused)
            
            Also provide a safety profile with risk tolerance and recommended tune safety levels.
            
            Respond in JSON:
            {{
                "rider_type": "Weekend Warrior",
                "safety_profile": {{
                    "risk_tolerance": "moderate",
                    "recommended_safety_levels": ["SAFE", "MODERATE"],
                    "avoid_modifications": ["experimental_fuel_maps"]
                }}
            }}
            """
            
            ai_response = await llm_service._call_llm(rider_type_prompt, max_tokens=300)
            
            # Parse and save AI insights
            import json
            ai_data = json.loads(ai_response)
            
            profile.ai_rider_type = ai_data.get('rider_type', 'General Rider')
            profile.ai_safety_profile = ai_data.get('safety_profile', {})
            profile.save()
            
        except Exception as e:
            logger.error(f"Failed to generate AI insights: {str(e)}")
            # Set fallback values
            profile.ai_rider_type = "General Rider"
            profile.ai_safety_profile = {"risk_tolerance": "moderate"}
            profile.save()
    
    async def _generate_initial_recommendations(self, profile: UserRidingProfile):
        """
        🎯 Generate initial recommendations for new user
        """
        try:
            llm_service = get_llm_service()
            
            # Get available tunes (limit for initial recommendations)
            available_tunes = Tune.objects.filter(is_active=True)[:50]
            tune_data = [self._tune_to_dict(tune) for tune in available_tunes]
            
            # Create LLM user profile
            llm_profile = LLMUserProfile(
                user_id=profile.user.id,
                motorcycle_type=profile.motorcycle_type,
                skill_level=profile.skill_level,
                riding_styles=profile.riding_styles,
                goals=profile.goals,
                experience=profile.experience_description
            )
            
            # Get AI recommendations
            recommendations = await llm_service.get_personalized_recommendations(
                llm_profile, tune_data, limit=10
            )
            
            # Save recommendations to database
            for i, rec_data in enumerate(recommendations):
                tune = available_tunes.get(id=rec_data['id'])
                
                AIRecommendation.objects.create(
                    user=profile.user,
                    tune=tune,
                    recommendation_type='personalized',
                    match_score=rec_data.get('ai_match_score', 50),
                    ai_explanation=rec_data.get('ai_explanation', 'AI recommended'),
                    safety_assessment_for_user=rec_data.get('ai_safety_assessment', 'Safe for your level'),
                    expected_benefits=rec_data.get('ai_expected_benefits', []),
                    recommendation_reason=rec_data.get('ai_recommendation_reason', 'Good match'),
                    user_profile_snapshot={
                        'motorcycle_type': profile.motorcycle_type,
                        'skill_level': profile.skill_level,
                        'riding_styles': profile.riding_styles,
                        'goals': profile.goals,
                    }
                )
            
            logger.info(f"Generated {len(recommendations)} initial recommendations for user {profile.user.username}")
            
        except Exception as e:
            logger.error(f"Failed to generate initial recommendations: {str(e)}")
    
    def _tune_to_dict(self, tune: Tune) -> Dict[str, Any]:
        """Convert Tune model to dictionary for LLM processing"""
        return {
            'id': tune.id,
            'name': tune.name,
            'description': tune.description,
            'category': tune.category.name if tune.category else 'Unknown',
            'creator': tune.creator.username if tune.creator else 'Unknown',
            'safety_level': getattr(tune, 'safety_level', 'MODERATE'),
            'average_rating': getattr(tune, 'average_rating', 3.0),
            'download_count': getattr(tune, 'download_count', 0),
            'performance_summary': getattr(tune, 'performance_summary', 'Performance tune'),
            'published_at': tune.created_at.isoformat() if tune.created_at else None,
        }


class AIRecommendationsAPIView(APIView):
    """
    🎯 AI-powered tune recommendations
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        🤖 Get personalized recommendations
        
        Query params:
        - limit: Number of recommendations (default: 10)
        - type: Recommendation type (personalized, trending, similar)
        - refresh: Force refresh recommendations (true/false)
        """
        try:
            user = request.user
            limit = int(request.query_params.get('limit', 10))
            rec_type = request.query_params.get('type', 'personalized')
            force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'
            
            # 🔍 Check if user has profile
            try:
                profile = UserRidingProfile.objects.get(user=user)
            except UserRidingProfile.DoesNotExist:
                return Response(
                    {'error': 'Complete onboarding first to get personalized recommendations.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 🎯 Get or generate recommendations
            if force_refresh or self._need_fresh_recommendations(user):
                import asyncio
                recommendations = asyncio.run(self._generate_fresh_recommendations(profile, limit, rec_type))
            else:
                recommendations = self._get_cached_recommendations(user, limit, rec_type)
            
            # 📊 Mark recommendations as viewed
            for rec in recommendations:
                if hasattr(rec, 'mark_viewed'):
                    rec.mark_viewed()
            
            # 🔄 Serialize recommendations
            serialized_recommendations = []
            for rec in recommendations:
                tune_data = TuneListSerializer(rec.tune).data if hasattr(rec, 'tune') else rec
                
                # Add AI insights
                if hasattr(rec, 'ai_explanation'):
                    tune_data.update({
                        'ai_match_score': rec.match_score,
                        'ai_explanation': rec.ai_explanation,
                        'ai_safety_assessment': rec.safety_assessment_for_user,
                        'ai_expected_benefits': rec.expected_benefits,
                        'ai_recommendation_reason': rec.recommendation_reason,
                    })
                
                serialized_recommendations.append(tune_data)
            
            return Response({
                'recommendations': serialized_recommendations,
                'user_profile': {
                    'motorcycle_type': profile.motorcycle_type,
                    'skill_level': profile.skill_level,
                    'ai_rider_type': profile.ai_rider_type,
                },
                'recommendation_metadata': {
                    'type': rec_type,
                    'generated_at': timezone.now().isoformat(),
                    'algorithm': 'llm_enhanced_hybrid',
                }
            })
            
        except Exception as e:
            logger.error(f"Failed to get recommendations for user {request.user.username}: {str(e)}")
            return Response(
                {'error': 'Failed to generate recommendations. Please try again.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _need_fresh_recommendations(self, user: User) -> bool:
        """Check if user needs fresh recommendations"""
        try:
            latest_rec = AIRecommendation.objects.filter(user=user).order_by('-created_at').first()
            if not latest_rec:
                return True
            
            # Refresh if recommendations are older than 24 hours
            return (timezone.now() - latest_rec.created_at) > timedelta(hours=24)
        except:
            return True
    
    def _get_cached_recommendations(self, user: User, limit: int, rec_type: str) -> List[AIRecommendation]:
        """Get cached recommendations"""
        return AIRecommendation.objects.filter(
            user=user,
            recommendation_type=rec_type
        ).order_by('-match_score')[:limit]
    
    async def _generate_fresh_recommendations(
        self, profile: UserRidingProfile, limit: int, rec_type: str
    ) -> List[AIRecommendation]:
        """Generate fresh recommendations using LLM"""
        try:
            llm_service = get_llm_service()
            
            # Get available tunes
            available_tunes = Tune.objects.filter(is_active=True)[:100]
            tune_data = [self._tune_to_dict(tune) for tune in available_tunes]
            
            # Create LLM user profile
            llm_profile = LLMUserProfile(
                user_id=profile.user.id,
                motorcycle_type=profile.motorcycle_type,
                skill_level=profile.skill_level,
                riding_styles=profile.riding_styles,
                goals=profile.goals,
                experience=profile.experience_description
            )
            
            # Get AI recommendations
            ai_recommendations = await llm_service.get_personalized_recommendations(
                llm_profile, tune_data, limit=limit
            )
            
            # Clear old recommendations of this type
            AIRecommendation.objects.filter(
                user=profile.user,
                recommendation_type=rec_type
            ).delete()
            
            # Save new recommendations
            new_recommendations = []
            for rec_data in ai_recommendations:
                try:
                    tune = available_tunes.get(id=rec_data['id'])
                    
                    recommendation = AIRecommendation.objects.create(
                        user=profile.user,
                        tune=tune,
                        recommendation_type=rec_type,
                        match_score=rec_data.get('ai_match_score', 50),
                        ai_explanation=rec_data.get('ai_explanation', 'AI recommended'),
                        safety_assessment_for_user=rec_data.get('ai_safety_assessment', 'Safe for your level'),
                        expected_benefits=rec_data.get('ai_expected_benefits', []),
                        recommendation_reason=rec_data.get('ai_recommendation_reason', 'Good match'),
                        user_profile_snapshot={
                            'motorcycle_type': profile.motorcycle_type,
                            'skill_level': profile.skill_level,
                            'riding_styles': profile.riding_styles,
                            'goals': profile.goals,
                        }
                    )
                    new_recommendations.append(recommendation)
                except Tune.DoesNotExist:
                    logger.warning(f"Tune {rec_data.get('id')} not found")
                    continue
            
            return new_recommendations
            
        except Exception as e:
            logger.error(f"Failed to generate fresh recommendations: {str(e)}")
            return []
    
    def _tune_to_dict(self, tune: Tune) -> Dict[str, Any]:
        """Convert Tune model to dictionary for LLM processing"""
        return {
            'id': tune.id,
            'name': tune.name,
            'description': tune.description,
            'category': tune.category.name if tune.category else 'Unknown',
            'creator': tune.creator.username if tune.creator else 'Unknown',
            'safety_level': getattr(tune, 'safety_level', 'MODERATE'),
            'average_rating': getattr(tune, 'average_rating', 3.0),
            'download_count': getattr(tune, 'download_count', 0),
            'performance_summary': getattr(tune, 'performance_summary', 'Performance tune'),
            'published_at': tune.created_at.isoformat() if tune.created_at else None,
        }


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def track_interaction(request):
    """
    📊 Track user interactions for ML training
    
    Payload:
    {
        "interaction_type": "view|click|download|like|dislike",
        "tune_id": 123,
        "recommendation_id": 456,  // optional
        "context": {...}  // optional additional context
    }
    """
    try:
        data = request.data
        user = request.user
        
        # 🔍 Validate required fields
        if 'interaction_type' not in data:
            return Response(
                {'error': 'Missing interaction_type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 🏍️ Get tune if provided
        tune = None
        if 'tune_id' in data:
            try:
                tune = Tune.objects.get(id=data['tune_id'])
            except Tune.DoesNotExist:
                return Response(
                    {'error': 'Tune not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # 🎯 Get recommendation if provided
        recommendation = None
        if 'recommendation_id' in data:
            try:
                recommendation = AIRecommendation.objects.get(
                    id=data['recommendation_id'],
                    user=user
                )
                
                # Update recommendation tracking
                if data['interaction_type'] == 'click':
                    recommendation.mark_clicked()
                elif data['interaction_type'] == 'download':
                    recommendation.mark_downloaded()
                
            except AIRecommendation.DoesNotExist:
                logger.warning(f"Recommendation {data['recommendation_id']} not found for user {user.username}")
        
        # 📊 Log interaction
        UserInteractionLog.objects.create(
            user=user,
            tune=tune,
            interaction_type=data['interaction_type'],
            interaction_context=data.get('context', {}),
            was_recommended=recommendation is not None,
            recommendation_id=recommendation,
            session_id=request.session.session_key or '',
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({
            'message': 'Interaction tracked successfully',
            'interaction_type': data['interaction_type'],
            'tune_id': tune.id if tune else None,
            'recommendation_id': recommendation.id if recommendation else None,
        })
        
    except Exception as e:
        logger.error(f"Failed to track interaction: {str(e)}")
        return Response(
            {'error': 'Failed to track interaction'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_insights(request):
    """
    📊 Get AI insights about user preferences and behavior
    """
    try:
        user = request.user
        
        # Get user profile
        try:
            profile = UserRidingProfile.objects.get(user=user)
        except UserRidingProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get interaction statistics
        total_interactions = UserInteractionLog.objects.filter(user=user).count()
        downloads = UserInteractionLog.objects.filter(
            user=user, interaction_type='download'
        ).count()
        
        # Get recommendation performance
        total_recommendations = AIRecommendation.objects.filter(user=user).count()
        clicked_recommendations = AIRecommendation.objects.filter(
            user=user, was_clicked=True
        ).count()
        
        click_through_rate = (clicked_recommendations / total_recommendations * 100) if total_recommendations > 0 else 0
        
        # Get top categories
        category_interactions = UserInteractionLog.objects.filter(
            user=user,
            tune__isnull=False
        ).values('tune__category__name').annotate(
            count=models.Count('id')
        ).order_by('-count')[:5]
        
        return Response({
            'user_profile': {
                'motorcycle_type': profile.motorcycle_type,
                'skill_level': profile.skill_level,
                'riding_styles': profile.riding_styles_display,
                'goals': profile.goals_display,
                'ai_rider_type': profile.ai_rider_type,
                'created_at': profile.created_at,
            },
            'interaction_stats': {
                'total_interactions': total_interactions,
                'total_downloads': downloads,
                'total_recommendations': total_recommendations,
                'clicked_recommendations': clicked_recommendations,
                'click_through_rate': round(click_through_rate, 2),
            },
            'preferences': {
                'top_categories': list(category_interactions),
                'ai_safety_profile': profile.ai_safety_profile,
            },
            'generated_at': timezone.now().isoformat(),
        })
        
    except Exception as e:
        logger.error(f"Failed to get user insights: {str(e)}")
        return Response(
            {'error': 'Failed to generate insights'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 