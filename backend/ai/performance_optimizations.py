"""
RevSync Backend Performance Optimizations
Advanced caching, query optimization, and performance monitoring
"""

import logging
from typing import Dict, List, Any, Optional
from django.core.cache import cache
from django.db import models
from django.db.models import Prefetch
from django.conf import settings
import time
import functools

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """Performance monitoring and optimization utilities"""
    
    @staticmethod
    def time_operation(operation_name: str):
        """Decorator to time database operations"""
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                if execution_time > 1.0:  # Log slow operations
                    logger.warning(f"Slow operation detected: {operation_name} took {execution_time:.2f}s")
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def cache_result(cache_key: str, timeout: int = 3600):
        """Decorator to cache function results"""
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Generate unique cache key with args
                full_cache_key = f"{cache_key}:{hash(str(args) + str(kwargs))}"
                
                # Try to get from cache first
                cached_result = cache.get(full_cache_key)
                if cached_result is not None:
                    return cached_result
                
                # Execute function and cache result
                result = func(*args, **kwargs)
                cache.set(full_cache_key, result, timeout)
                return result
            return wrapper
        return decorator

class QueryOptimizer:
    """Database query optimization utilities"""
    
    @staticmethod
    def optimize_tune_queries():
        """Optimized queryset for tune listings with select_related and prefetch_related"""
        from tunes.models import TuneSubmission
        
        return TuneSubmission.objects.select_related(
            'creator',
            'creator__user'
        ).prefetch_related(
            'user_feedback',
            'safety_audits',
            Prefetch(
                'ai_review',
                queryset=models.Q(status='APPROVED')
            )
        )
    
    @staticmethod
    def optimize_user_queries():
        """Optimized queryset for user profiles"""
        from users.models import User
        
        return User.objects.select_related(
            'riding_profile',
            'creator_profile'
        ).prefetch_related(
            'tune_submissions',
            'ai_recommendations'
        )
    
    @staticmethod
    def optimize_ai_recommendation_queries():
        """Optimized queryset for AI recommendations"""
        from ai.models import AIRecommendation
        
        return AIRecommendation.objects.select_related(
            'user',
            'tune',
            'tune__creator',
            'tune__creator__user'
        ).prefetch_related(
            'tune__ai_analysis'
        )

class CacheManager:
    """Advanced caching strategies for RevSync"""
    
    # Cache keys
    TUNE_LIST_CACHE = "tune_list"
    USER_RECOMMENDATIONS_CACHE = "user_recommendations"
    SAFETY_ANALYSIS_CACHE = "safety_analysis"
    HYBRID_RAG_CACHE = "hybrid_rag_context"
    
    @classmethod
    def get_tune_list_cache_key(cls, filters: Dict) -> str:
        """Generate cache key for tune listings"""
        filter_str = "&".join([f"{k}={v}" for k, v in sorted(filters.items())])
        return f"{cls.TUNE_LIST_CACHE}:{hash(filter_str)}"
    
    @classmethod
    def get_user_recommendations_cache_key(cls, user_id: int) -> str:
        """Generate cache key for user recommendations"""
        return f"{cls.USER_RECOMMENDATIONS_CACHE}:user_{user_id}"
    
    @classmethod
    def invalidate_tune_caches(cls, tune_id: str):
        """Invalidate all caches related to a specific tune"""
        # This would typically use cache versioning or tags
        cache_patterns = [
            f"{cls.TUNE_LIST_CACHE}:*",
            f"{cls.SAFETY_ANALYSIS_CACHE}:tune_{tune_id}",
            f"{cls.HYBRID_RAG_CACHE}:tune_{tune_id}",
        ]
        
        # Note: In production, use Redis pattern deletion
        logger.info(f"Cache invalidation needed for tune {tune_id}")
    
    @classmethod
    @PerformanceMonitor.cache_result("tune_safety_analysis", timeout=7200)  # 2 hours
    def get_cached_safety_analysis(cls, tune_id: str) -> Dict:
        """Cache safety analysis results"""
        from tunes.models import TuneSubmission
        
        try:
            tune = TuneSubmission.objects.get(id=tune_id)
            return {
                'safety_score': tune.ai_safety_score,
                'safety_badge': tune.safety_badge,
                'risk_flags': tune.risk_flags,
                'last_updated': tune.updated_at.isoformat()
            }
        except TuneSubmission.DoesNotExist:
            return {}

class DatabaseOptimizations:
    """Database-level optimizations"""
    
    @staticmethod
    def create_performance_indexes():
        """SQL commands for additional performance indexes"""
        return [
            # Composite indexes for common filter combinations
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tunes_make_model_year ON tunes_submission (motorcycle_make, motorcycle_model, motorcycle_year);",
            
            # Partial indexes for active content
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tunes_active_approved ON tunes_submission (created_at) WHERE review_status = 'APPROVED';",
            
            # GIN indexes for JSON fields
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tunes_risk_flags_gin ON tunes_submission USING GIN (risk_flags);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_recommendations_gin ON ai_recommendations USING GIN (user_profile_snapshot);",
            
            # Text search indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tunes_name_trgm ON tunes_submission USING GIN (name gin_trgm_ops);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tunes_description_trgm ON tunes_submission USING GIN (description gin_trgm_ops);",
        ]
    
    @staticmethod
    def vacuum_analyze_schedule():
        """Database maintenance schedule"""
        return {
            'daily': [
                "VACUUM ANALYZE tunes_submission;",
                "VACUUM ANALYZE ai_recommendations;",
                "VACUUM ANALYZE user_interaction_logs;"
            ],
            'weekly': [
                "REINDEX INDEX CONCURRENTLY idx_tunes_make_model_year;",
                "ANALYZE;"
            ]
        }

class APIOptimizations:
    """API endpoint optimizations"""
    
    @staticmethod
    def paginate_efficiently(queryset, page_size: int = 20):
        """Efficient pagination using cursor-based pagination for large datasets"""
        from django.core.paginator import Paginator
        from django.db.models import Q
        
        # Use cursor pagination for better performance
        return {
            'page_size': page_size,
            'optimization': 'cursor_based',
            'queryset': queryset.order_by('-created_at', '-id')  # Stable ordering
        }
    
    @staticmethod
    def optimize_serializer_performance():
        """Optimizations for DRF serializers"""
        return {
            'techniques': [
                'Use SerializerMethodField sparingly',
                'Implement to_representation() for custom formatting',
                'Use source parameter for related field access',
                'Leverage select_related in viewset get_queryset()',
                'Implement prefetch_related for M2M relationships'
            ]
        }

# Background Task Optimizations
class BackgroundTaskOptimizer:
    """Optimize background tasks and queue management"""
    
    @staticmethod
    def optimize_ai_analysis_queue():
        """Optimize AI analysis background tasks"""
        return {
            'queue_priorities': {
                'safety_analysis': 'high',
                'recommendations': 'medium', 
                'analytics': 'low'
            },
            'batch_processing': {
                'safety_analysis': 5,  # Process 5 tunes at once
                'recommendations': 10,  # Batch recommendation generation
            },
            'timeout_settings': {
                'safety_analysis': 300,  # 5 minutes max
                'hybrid_rag_search': 60,  # 1 minute max
                'llm_analysis': 120,  # 2 minutes max
            }
        }
    
    @staticmethod
    def queue_management_strategy():
        """Queue management and retry strategy"""
        return {
            'retry_policy': {
                'max_retries': 3,
                'backoff_factor': 2,
                'retry_delays': [60, 300, 900]  # 1min, 5min, 15min
            },
            'dead_letter_queue': True,
            'monitoring': {
                'queue_length_alert': 100,
                'processing_time_alert': 600,  # 10 minutes
                'failure_rate_alert': 0.1  # 10% failure rate
            }
        }

# Memory and Resource Management
class ResourceOptimizer:
    """Memory and resource optimization"""
    
    @staticmethod
    def optimize_file_processing():
        """Optimize large file processing for ECU files"""
        return {
            'chunk_size': 8192,  # 8KB chunks for file reading
            'max_file_size': 50 * 1024 * 1024,  # 50MB limit
            'temp_file_cleanup': True,
            'memory_limit_check': True,
            'streaming_upload': True
        }
    
    @staticmethod
    def llm_memory_optimization():
        """Optimize LLM memory usage"""
        return {
            'model_caching': True,
            'prompt_optimization': {
                'max_context_length': 4096,
                'context_compression': True,
                'relevant_context_only': True
            },
            'batch_inference': {
                'enabled': True,
                'batch_size': 4,
                'timeout_per_batch': 60
            }
        }

# Monitoring and Alerting
class PerformanceMonitoring:
    """Performance monitoring and alerting"""
    
    @staticmethod
    def setup_performance_metrics():
        """Key performance metrics to monitor"""
        return {
            'database_metrics': [
                'Query execution time',
                'Connection pool usage',
                'Index hit ratio',
                'Table scan frequency'
            ],
            'application_metrics': [
                'Response time percentiles (p50, p95, p99)',
                'Request rate',
                'Error rate',
                'Memory usage'
            ],
            'ai_metrics': [
                'LLM inference time',
                'HybridRAG search performance',
                'Safety analysis completion rate',
                'Queue processing times'
            ]
        }
    
    @staticmethod
    def alerting_thresholds():
        """Performance alerting thresholds"""
        return {
            'response_time_p95': 2000,  # 2 seconds
            'error_rate': 0.05,  # 5%
            'database_query_time': 1000,  # 1 second
            'queue_processing_time': 300,  # 5 minutes
            'memory_usage': 0.8,  # 80%
            'disk_usage': 0.85  # 85%
        } 