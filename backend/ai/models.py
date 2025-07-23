from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import json

User = get_user_model()

class UserRidingProfile(models.Model):
    """
    🏍️ User's riding profile for AI recommendations
    
    Collected during onboarding to enable personalized tune recommendations
    """
    
    MOTORCYCLE_TYPES = [
        ('sport', 'Sport'),
        ('naked', 'Naked/Street'),
        ('touring', 'Touring'),
        ('adventure', 'Adventure'),
        ('cruiser', 'Cruiser'),
        ('dirt', 'Dirt/Motocross'),
    ]
    
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    RIDING_STYLES = [
        ('commuting', 'Daily Commuting'),
        ('weekend', 'Weekend Touring'),
        ('sport_street', 'Sport Street'),
        ('track', 'Track Days'),
        ('off_road', 'Off-Road'),
        ('drag', 'Drag Racing'),
    ]
    
    GOALS = [
        ('performance', 'More Power'),
        ('efficiency', 'Better MPG'),
        ('smoothness', 'Smoother Ride'),
        ('reliability', 'Reliability'),
        ('sound', 'Better Sound'),
        ('racing', 'Racing Edge'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_riding_profile')
    
    # 🏍️ Basic motorcycle info
    motorcycle_type = models.CharField(max_length=20, choices=MOTORCYCLE_TYPES)
    skill_level = models.CharField(max_length=20, choices=SKILL_LEVELS)
    
    # 🎯 Riding preferences (JSON arrays)
    riding_styles = models.JSONField(default=list, help_text="Array of riding style IDs")
    goals = models.JSONField(default=list, help_text="Array of goal IDs")
    
    # 📊 Experience details
    experience_years = models.PositiveIntegerField(default=0)
    experience_description = models.TextField(blank=True)
    
    # 🤖 AI-generated insights
    ai_rider_type = models.CharField(max_length=50, blank=True, help_text="AI-determined rider archetype")
    ai_safety_profile = models.JSONField(default=dict, help_text="AI safety analysis")
    ai_preference_vector = models.JSONField(default=list, help_text="ML embedding for recommendations")
    
    # 📅 Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_recommendation_update = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_riding_profiles'
        verbose_name = 'User Riding Profile'
        verbose_name_plural = 'User Riding Profiles'
    
    def __str__(self):
        return f"{self.user.username} - {self.motorcycle_type} {self.skill_level}"
    
    @property
    def riding_styles_display(self):
        """Get display names for riding styles"""
        style_map = dict(self.RIDING_STYLES)
        return [style_map.get(style, style) for style in self.riding_styles]
    
    @property
    def goals_display(self):
        """Get display names for goals"""
        goal_map = dict(self.GOALS)
        return [goal_map.get(goal, goal) for goal in self.goals]


class TuneAIAnalysis(models.Model):
    """
    🤖 AI analysis results for tunes
    
    Stores LLM safety analysis, compatibility assessment, and performance predictions
    """
    
    SAFETY_LEVELS = [
        ('SAFE', 'Safe'),
        ('MODERATE', 'Moderate'),
        ('EXPERT', 'Expert Only'),
        ('EXPERIMENTAL', 'Experimental'),
    ]
    
    APPROVAL_STATUS = [
        ('pending', 'Pending Analysis'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_review', 'Needs Manual Review'),
    ]
    
    # 🏍️ Related tune (assuming you have a Tune model)
    tune = models.OneToOneField('tunes.Tune', on_delete=models.CASCADE, related_name='ai_analysis')
    
    # 🛡️ Safety analysis
    safety_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="AI safety score (0-100)"
    )
    safety_level = models.CharField(max_length=20, choices=SAFETY_LEVELS)
    
    # 📊 Performance analysis
    compatibility_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    performance_impact = models.JSONField(
        default=dict,
        help_text="Expected performance changes (HP, torque, fuel economy)"
    )
    
    # 🎯 Risk and benefit assessment
    identified_risks = models.JSONField(default=list, help_text="Array of risk descriptions")
    identified_benefits = models.JSONField(default=list, help_text="Array of benefit descriptions")
    
    # 📝 LLM explanations
    ai_explanation = models.TextField(help_text="LLM-generated explanation of analysis")
    compatibility_notes = models.TextField(blank=True)
    installation_complexity = models.CharField(max_length=50, blank=True)
    
    # ✅ Approval workflow
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS, default='pending')
    approved_for_skill_levels = models.JSONField(
        default=list,
        help_text="Skill levels this tune is approved for"
    )
    
    # 🤖 Analysis metadata
    llm_model_version = models.CharField(max_length=50, default='mistral-7b')
    analysis_confidence = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        default=0.5,
        help_text="AI confidence in analysis (0-1)"
    )
    
    # 📅 Timestamps
    analyzed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    needs_reanalysis = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'tune_ai_analyses'
        verbose_name = 'Tune AI Analysis'
        verbose_name_plural = 'Tune AI Analyses'
    
    def __str__(self):
        return f"AI Analysis: {self.tune.name} - {self.safety_level} ({self.safety_score})"
    
    @property
    def is_approved(self):
        return self.approval_status == 'approved'
    
    @property
    def is_safe_for_beginners(self):
        return self.safety_level == 'SAFE' and self.safety_score >= 80


class AIRecommendation(models.Model):
    """
    🎯 AI-generated tune recommendations for users
    
    Stores personalized recommendations with explanations
    """
    
    RECOMMENDATION_TYPES = [
        ('personalized', 'Personalized'),
        ('trending', 'Trending'),
        ('similar', 'Similar to Previous'),
        ('safety_focused', 'Safety Focused'),
        ('performance_focused', 'Performance Focused'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    tune = models.ForeignKey('tunes.Tune', on_delete=models.CASCADE, related_name='ai_recommendations')
    
    # 🎯 Recommendation details
    recommendation_type = models.CharField(max_length=30, choices=RECOMMENDATION_TYPES)
    match_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="AI match score (0-100)"
    )
    
    # 📝 AI explanations
    ai_explanation = models.TextField(help_text="Why this tune is recommended")
    safety_assessment_for_user = models.TextField(help_text="Safety assessment for this specific user")
    expected_benefits = models.JSONField(default=list, help_text="Expected benefits for this user")
    recommendation_reason = models.TextField(help_text="Primary reason for recommendation")
    
    # 📊 Recommendation context
    user_profile_snapshot = models.JSONField(
        default=dict,
        help_text="User profile at time of recommendation"
    )
    collaborative_score = models.FloatField(default=0.5, help_text="Collaborative filtering score")
    content_score = models.FloatField(default=0.5, help_text="Content-based filtering score")
    
    # 📈 Performance tracking
    was_viewed = models.BooleanField(default=False)
    was_clicked = models.BooleanField(default=False)
    was_downloaded = models.BooleanField(default=False)
    user_rating = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="User rating of recommendation quality"
    )
    
    # 📅 Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ai_recommendations'
        verbose_name = 'AI Recommendation'
        verbose_name_plural = 'AI Recommendations'
        unique_together = ['user', 'tune', 'recommendation_type']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Recommendation: {self.tune.name} for {self.user.username} ({self.match_score}%)"
    
    def mark_viewed(self):
        """Mark recommendation as viewed"""
        if not self.was_viewed:
            self.was_viewed = True
            self.viewed_at = models.timezone.now()
            self.save(update_fields=['was_viewed', 'viewed_at'])
    
    def mark_clicked(self):
        """Mark recommendation as clicked"""
        self.mark_viewed()  # Clicking implies viewing
        if not self.was_clicked:
            self.was_clicked = True
            self.clicked_at = models.timezone.now()
            self.save(update_fields=['was_clicked', 'clicked_at'])
    
    def mark_downloaded(self):
        """Mark recommendation as downloaded"""
        self.mark_clicked()  # Downloading implies clicking
        if not self.was_downloaded:
            self.was_downloaded = True
            self.downloaded_at = models.timezone.now()
            self.save(update_fields=['was_downloaded', 'downloaded_at'])


class UserInteractionLog(models.Model):
    """
    📊 Detailed user interaction logging for ML training
    
    Tracks all user interactions for improving recommendations
    """
    
    INTERACTION_TYPES = [
        ('view', 'View'),
        ('click', 'Click'),
        ('download', 'Download'),
        ('like', 'Like'),
        ('dislike', 'Dislike'),
        ('share', 'Share'),
        ('report', 'Report'),
        ('search', 'Search'),
        ('filter', 'Filter'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interaction_logs')
    tune = models.ForeignKey('tunes.Tune', on_delete=models.CASCADE, null=True, blank=True)
    
    # 📊 Interaction details
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    interaction_context = models.JSONField(
        default=dict,
        help_text="Additional context (search query, filter settings, etc.)"
    )
    
    # 🎯 Recommendation tracking
    was_recommended = models.BooleanField(default=False)
    recommendation_id = models.ForeignKey(
        AIRecommendation, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        help_text="If this was from a recommendation"
    )
    
    # 📱 Session context
    session_id = models.CharField(max_length=50, blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # 📅 Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_interaction_logs'
        verbose_name = 'User Interaction Log'
        verbose_name_plural = 'User Interaction Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'interaction_type']),
            models.Index(fields=['tune', 'interaction_type']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        tune_name = self.tune.name if self.tune else "N/A"
        return f"{self.user.username} {self.interaction_type} {tune_name}"


class RecommendationModel(models.Model):
    """
    🤖 ML model metadata and performance tracking
    
    Tracks different recommendation models and their performance
    """
    
    MODEL_TYPES = [
        ('content_based', 'Content-Based'),
        ('collaborative', 'Collaborative Filtering'),
        ('hybrid', 'Hybrid'),
        ('llm_enhanced', 'LLM Enhanced'),
    ]
    
    name = models.CharField(max_length=100)
    model_type = models.CharField(max_length=30, choices=MODEL_TYPES)
    version = models.CharField(max_length=20)
    
    # 📊 Performance metrics
    precision_at_5 = models.FloatField(default=0)
    recall_at_5 = models.FloatField(default=0)
    ndcg_at_5 = models.FloatField(default=0)
    click_through_rate = models.FloatField(default=0)
    download_conversion_rate = models.FloatField(default=0)
    
    # 🎯 Model configuration
    hyperparameters = models.JSONField(default=dict)
    training_data_size = models.PositiveIntegerField(default=0)
    
    # 🚀 Deployment status
    is_active = models.BooleanField(default=False)
    is_training = models.BooleanField(default=False)
    
    # 📅 Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_trained = models.DateTimeField(null=True, blank=True)
    deployed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'recommendation_models'
        verbose_name = 'Recommendation Model'
        verbose_name_plural = 'Recommendation Models'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} v{self.version} ({'Active' if self.is_active else 'Inactive'})" 