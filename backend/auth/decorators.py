"""
Authentication Decorators for RevSync

Decorators for protecting views, enforcing authentication, 2FA requirements,
and other security measures.
"""

import functools
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from .models import SecurityEvent

User = get_user_model()


def require_auth(view_func):
    """
    Decorator to require authentication for a view
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED',
                'message': 'You must be logged in to access this resource'
            }, status=401)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_verified_email(view_func):
    """
    Decorator to require email verification
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        if not request.user.email_verified:
            return JsonResponse({
                'error': 'Email verification required',
                'code': 'EMAIL_VERIFICATION_REQUIRED',
                'message': 'Please verify your email address before accessing this resource'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_2fa(view_func):
    """
    Decorator to require 2FA verification for sensitive operations
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        # Check if user has 2FA enabled
        if not getattr(request.user, 'two_factor_enabled', False):
            return JsonResponse({
                'error': 'Two-factor authentication required',
                'code': '2FA_SETUP_REQUIRED',
                'message': 'Please enable two-factor authentication to access this resource'
            }, status=403)
        
        # Check if 2FA was verified recently (within last 30 minutes)
        session_key = f'2fa_verified_{request.user.id}'
        last_verification = request.session.get(session_key)
        
        if not last_verification:
            return JsonResponse({
                'error': 'Two-factor authentication verification required',
                'code': '2FA_VERIFICATION_REQUIRED',
                'message': 'Please verify your identity with 2FA to continue'
            }, status=403)
        
        try:
            last_verified = datetime.fromisoformat(last_verification)
            if timezone.now() - last_verified > timedelta(minutes=30):
                return JsonResponse({
                    'error': 'Two-factor authentication verification expired',
                    'code': '2FA_VERIFICATION_EXPIRED',
                    'message': 'Your 2FA verification has expired. Please verify again.'
                }, status=403)
        except (ValueError, TypeError):
            return JsonResponse({
                'error': 'Invalid 2FA verification',
                'code': '2FA_VERIFICATION_INVALID',
                'message': 'Please verify your identity with 2FA to continue'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_admin(view_func):
    """
    Decorator to require admin privileges
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        if not request.user.is_staff and not request.user.is_superuser:
            return JsonResponse({
                'error': 'Admin privileges required',
                'code': 'ADMIN_REQUIRED',
                'message': 'You must be an administrator to access this resource'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_superuser(view_func):
    """
    Decorator to require superuser privileges
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        if not request.user.is_superuser:
            return JsonResponse({
                'error': 'Superuser privileges required',
                'code': 'SUPERUSER_REQUIRED',
                'message': 'You must be a superuser to access this resource'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def rate_limit(max_requests=60, window_minutes=60):
    """
    Decorator to apply rate limiting to views
    
    Args:
        max_requests: Maximum requests allowed
        window_minutes: Time window in minutes
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            from .utils import rate_limiter, get_client_ip
            
            # Create rate limit key
            ip_address = get_client_ip(request)
            user_id = getattr(request.user, 'id', 'anonymous') if hasattr(request, 'user') else 'anonymous'
            rate_key = f"{ip_address}:{user_id}:{view_func.__name__}"
            
            # Check rate limit
            if not rate_limiter.is_allowed(rate_key, max_requests, window_minutes):
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'code': 'RATE_LIMIT_EXCEEDED',
                    'message': f'Too many requests. Please try again in {window_minutes} minutes.',
                    'retry_after': window_minutes * 60
                }, status=429)
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def log_access(event_type='resource_accessed', risk_level='low'):
    """
    Decorator to log access to sensitive resources
    
    Args:
        event_type: Type of security event to log
        risk_level: Risk level of the access
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Execute the view first
            response = view_func(request, *args, **kwargs)
            
            # Log the access if user is authenticated
            if hasattr(request, 'user') and request.user:
                from .utils import log_security_event
                
                # Create description
                description = f'Access to {view_func.__name__} from {request.path}'
                
                # Log asynchronously (you might want to use a task queue for this)
                try:
                    SecurityEvent.objects.create(
                        user=request.user,
                        event_type=event_type,
                        description=description,
                        ip_address=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        risk_level=risk_level
                    )
                except Exception as e:
                    print(f"Failed to log security event: {e}")
            
            return response
        
        return wrapper
    return decorator


def require_https(view_func):
    """
    Decorator to require HTTPS for sensitive operations
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.is_secure() and not request.META.get('HTTP_X_FORWARDED_PROTO') == 'https':
            return JsonResponse({
                'error': 'HTTPS required',
                'code': 'HTTPS_REQUIRED',
                'message': 'This operation requires a secure connection'
            }, status=400)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def check_session_security(view_func):
    """
    Decorator to check session security and detect anomalies
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return view_func(request, *args, **kwargs)
        
        from .utils import get_client_ip, extract_device_info
        from .models import AuthSession
        import hashlib
        
        # Get current session info
        current_ip = get_client_ip(request)
        current_device = extract_device_info(request)
        
        # Find the user's current session
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            session = AuthSession.objects.filter(
                user=request.user,
                access_token_hash=token_hash,
                is_active=True
            ).first()
            
            if session:
                # Check for IP address changes
                if session.ip_address and session.ip_address != current_ip:
                    SecurityEvent.objects.create(
                        user=request.user,
                        event_type='ip_address_change',
                        description=f'IP address changed from {session.ip_address} to {current_ip}',
                        ip_address=current_ip,
                        user_agent=current_device['user_agent'],
                        device_info=current_device,
                        risk_level='medium'
                    )
                
                # Update session with current info
                session.ip_address = current_ip
                session.last_used = timezone.now()
                session.save(update_fields=['ip_address', 'last_used'])
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_account_age(min_days=1):
    """
    Decorator to require minimum account age for certain operations
    
    Args:
        min_days: Minimum account age in days
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'user') or not request.user:
                return JsonResponse({
                    'error': 'Authentication required',
                    'code': 'AUTH_REQUIRED'
                }, status=401)
            
            account_age = timezone.now() - request.user.date_joined
            if account_age.days < min_days:
                return JsonResponse({
                    'error': 'Account too new',
                    'code': 'ACCOUNT_AGE_INSUFFICIENT',
                    'message': f'Your account must be at least {min_days} days old to perform this action'
                }, status=403)
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_safety_disclaimer(view_func):
    """
    Decorator to require safety disclaimer acceptance for motorcycle-related operations
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        # Check if user has accepted safety disclaimer
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.safety_disclaimer_accepted:
            return JsonResponse({
                'error': 'Safety disclaimer acceptance required',
                'code': 'SAFETY_DISCLAIMER_REQUIRED',
                'message': 'You must accept the safety disclaimer before performing motorcycle-related operations'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def require_terms_acceptance(view_func):
    """
    Decorator to require terms of service acceptance
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            return JsonResponse({
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=401)
        
        # Check if user has accepted terms
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.terms_accepted:
            return JsonResponse({
                'error': 'Terms of service acceptance required',
                'code': 'TERMS_ACCEPTANCE_REQUIRED',
                'message': 'You must accept the terms of service to access this resource'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


# Combine common decorators for convenience
def secure_endpoint(view_func):
    """
    Decorator that combines common security requirements:
    - Authentication required
    - HTTPS required  
    - Session security check
    - Access logging
    """
    @require_auth
    @require_https
    @check_session_security
    @log_access('secure_endpoint_access', 'medium')
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        return view_func(request, *args, **kwargs)
    
    return wrapper


def admin_endpoint(view_func):
    """
    Decorator for admin-only endpoints with full security
    """
    @require_admin
    @require_2fa
    @require_https
    @check_session_security
    @log_access('admin_endpoint_access', 'high')
    @rate_limit(max_requests=30, window_minutes=60)
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        return view_func(request, *args, **kwargs)
    
    return wrapper


def motorcycle_operation(view_func):
    """
    Decorator for motorcycle-related operations requiring safety acknowledgment
    """
    @require_auth
    @require_verified_email
    @require_safety_disclaimer
    @require_terms_acceptance
    @check_session_security
    @log_access('motorcycle_operation', 'medium')
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        return view_func(request, *args, **kwargs)
    
    return wrapper 