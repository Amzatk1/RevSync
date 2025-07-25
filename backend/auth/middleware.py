"""
Authentication Middleware for RevSync

Django middleware for handling Supabase authentication, session management,
and security features.
"""

import jwt
import hashlib
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from .models import AuthSession, SecurityEvent
from .utils import get_client_ip, extract_device_info, log_security_event

User = get_user_model()


class SupabaseAuthMiddleware(MiddlewareMixin):
    """
    Middleware to handle Supabase authentication tokens and session management
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Process incoming request for authentication
        """
        # Skip authentication for certain paths
        skip_paths = [
            '/auth/login/',
            '/auth/register/',
            '/auth/reset-password/',
            '/auth/verify-otp/',
            '/health/',
            '/api/docs/',
            '/admin/',
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        # Extract token from header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            # No token provided - allow anonymous access for now
            request.user = None
            return None
        
        token = auth_header.split(' ')[1]
        
        # Validate and process token
        user = self._validate_token(request, token)
        if user:
            request.user = user
            # Update last active time
            user.last_active = timezone.now()
            user.save(update_fields=['last_active'])
        else:
            request.user = None
        
        return None
    
    def _validate_token(self, request, token):
        """
        Validate Supabase JWT token and return user
        """
        try:
            # Hash token for session lookup
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Find active session
            session = AuthSession.objects.filter(
                access_token_hash=token_hash,
                is_active=True,
                expires_at__gt=timezone.now()
            ).select_related('user').first()
            
            if not session:
                return None
            
            # Update session last used
            session.last_used = timezone.now()
            session.save(update_fields=['last_used'])
            
            return session.user
            
        except Exception as e:
            # Log authentication error
            print(f"Authentication error: {e}")
            return None


class SecurityMiddleware(MiddlewareMixin):
    """
    Middleware for security monitoring and threat detection
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.suspicious_patterns = [
            'sql injection',
            'script>',
            'javascript:',
            'onerror=',
            'onload=',
            '../../../',
            'passwd',
            '/etc/',
        ]
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Monitor request for suspicious activity
        """
        # Check for suspicious patterns in URL and parameters
        full_path = request.get_full_path().lower()
        request_body = ''
        
        if hasattr(request, 'body'):
            try:
                request_body = request.body.decode('utf-8').lower()
            except:
                pass
        
        # Detect suspicious patterns
        suspicious_found = False
        for pattern in self.suspicious_patterns:
            if pattern in full_path or pattern in request_body:
                suspicious_found = True
                break
        
        # Log suspicious activity
        if suspicious_found and request.user and hasattr(request.user, 'id'):
            # Log as high-risk security event
            SecurityEvent.objects.create(
                user=request.user,
                event_type='suspicious_activity',
                description=f'Suspicious pattern detected in request: {request.path}',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                device_info=extract_device_info(request),
                risk_level='high'
            )
        
        # Check for brute force attempts
        ip_address = get_client_ip(request)
        if request.path.startswith('/auth/') and request.method == 'POST':
            self._check_brute_force(request, ip_address)
        
        return None
    
    def _check_brute_force(self, request, ip_address):
        """
        Check for brute force authentication attempts
        """
        # Count failed login attempts from this IP in the last hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        failed_attempts = SecurityEvent.objects.filter(
            event_type='login_failed',
            ip_address=ip_address,
            created_at__gte=one_hour_ago
        ).count()
        
        # If too many failed attempts, log as critical
        if failed_attempts >= 10:
            SecurityEvent.objects.create(
                user=request.user if hasattr(request, 'user') and request.user else None,
                event_type='suspicious_activity',
                description=f'Possible brute force attack from IP: {ip_address}',
                ip_address=ip_address,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                device_info=extract_device_info(request),
                risk_level='critical'
            )


class CORSMiddleware(MiddlewareMixin):
    """
    CORS middleware for mobile app integration
    """
    
    def process_response(self, request, response):
        """
        Add CORS headers for mobile app
        """
        # Allow requests from mobile app
        allowed_origins = getattr(settings, 'ALLOWED_CORS_ORIGINS', [
            'http://localhost:3000',
            'http://localhost:19006',  # Expo development
            'exp://localhost:19000',   # Expo development
        ])
        
        origin = request.META.get('HTTP_ORIGIN')
        
        if origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
        
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = (
            'Accept, Content-Type, Content-Length, Accept-Encoding, '
            'X-CSRF-Token, Authorization, X-Requested-With'
        )
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'
        
        return response


class TwoFactorMiddleware(MiddlewareMixin):
    """
    Middleware to enforce 2FA for sensitive operations
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.sensitive_paths = [
            '/auth/change-password/',
            '/auth/disable-2fa/',
            '/auth/delete-account/',
            '/profile/security/',
            '/admin/',
        ]
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Check if 2FA is required for this operation
        """
        # Skip if not a sensitive path
        if not any(request.path.startswith(path) for path in self.sensitive_paths):
            return None
        
        # Skip if user not authenticated
        if not hasattr(request, 'user') or not request.user:
            return None
        
        # Skip if user doesn't have 2FA enabled
        if not getattr(request.user, 'two_factor_enabled', False):
            return None
        
        # Check if 2FA was verified recently
        session_key = f'2fa_verified_{request.user.id}'
        last_verification = request.session.get(session_key)
        
        if last_verification:
            last_verified = datetime.fromisoformat(last_verification)
            # Require re-verification after 30 minutes for sensitive operations
            if timezone.now() - last_verified < timedelta(minutes=30):
                return None
        
        # 2FA verification required
        return JsonResponse({
            'error': 'Two-factor authentication required',
            'code': '2FA_REQUIRED',
            'message': 'Please verify your identity with 2FA to continue'
        }, status=403)


class SessionCleanupMiddleware(MiddlewareMixin):
    """
    Middleware to periodically clean up expired sessions and OTP codes
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.last_cleanup = timezone.now()
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Periodically clean up expired data
        """
        # Only run cleanup once per hour
        if timezone.now() - self.last_cleanup > timedelta(hours=1):
            self._cleanup_expired_data()
            self.last_cleanup = timezone.now()
        
        return None
    
    def _cleanup_expired_data(self):
        """
        Clean up expired sessions and OTP codes
        """
        try:
            from .utils import clean_expired_sessions, clean_expired_otp_codes
            
            # Clean expired sessions
            expired_sessions = clean_expired_sessions()
            
            # Clean expired OTP codes
            expired_otps = clean_expired_otp_codes()
            
            print(f"Cleaned up {expired_sessions} expired sessions and {expired_otps} expired OTP codes")
            
        except Exception as e:
            print(f"Error during cleanup: {e}")


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware for API endpoints
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limits = {
            '/auth/login/': {'max_requests': 5, 'window_minutes': 15},
            '/auth/register/': {'max_requests': 3, 'window_minutes': 60},
            '/auth/reset-password/': {'max_requests': 3, 'window_minutes': 60},
            '/auth/verify-otp/': {'max_requests': 10, 'window_minutes': 15},
            '/auth/send-otp/': {'max_requests': 5, 'window_minutes': 15},
        }
        self.request_counts = {}
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Apply rate limiting to sensitive endpoints
        """
        # Check if this path has rate limiting
        path_config = None
        for path, config in self.rate_limits.items():
            if request.path.startswith(path):
                path_config = config
                break
        
        if not path_config:
            return None
        
        # Create rate limit key (IP + path)
        ip_address = get_client_ip(request)
        rate_key = f"{ip_address}:{request.path}"
        
        # Check rate limit
        if not self._is_request_allowed(rate_key, path_config):
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'message': f'Too many requests. Please try again in {path_config["window_minutes"]} minutes.',
                'retry_after': path_config['window_minutes'] * 60
            }, status=429)
        
        return None
    
    def _is_request_allowed(self, key, config):
        """
        Check if request is allowed based on rate limiting
        """
        now = timezone.now()
        window_start = now - timedelta(minutes=config['window_minutes'])
        
        # Initialize or clean old requests
        if key not in self.request_counts:
            self.request_counts[key] = []
        
        # Remove old requests outside the window
        self.request_counts[key] = [
            req_time for req_time in self.request_counts[key]
            if req_time > window_start
        ]
        
        # Check if limit exceeded
        if len(self.request_counts[key]) >= config['max_requests']:
            return False
        
        # Record this request
        self.request_counts[key].append(now)
        return True


class DeviceTrackingMiddleware(MiddlewareMixin):
    """
    Track user devices and detect new device logins
    """
    
    def process_request(self, request):
        """
        Track device information for authenticated users
        """
        if not hasattr(request, 'user') or not request.user or not request.user.is_authenticated:
            return None
        
        # Extract device info
        device_info = extract_device_info(request)
        ip_address = get_client_ip(request)
        
        # Create device fingerprint
        device_fingerprint = hashlib.md5(
            f"{device_info['user_agent']}{device_info['platform']}{device_info['browser']}".encode()
        ).hexdigest()
        
        # Check if this is a new device
        recent_sessions = AuthSession.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).values_list('device_info', flat=True)
        
        known_devices = set()
        for session_device_info in recent_sessions:
            if session_device_info:
                known_fingerprint = hashlib.md5(
                    f"{session_device_info.get('user_agent', '')}"
                    f"{session_device_info.get('platform', '')}"
                    f"{session_device_info.get('browser', '')}".encode()
                ).hexdigest()
                known_devices.add(known_fingerprint)
        
        # If new device, log and potentially alert
        if device_fingerprint not in known_devices:
            SecurityEvent.objects.create(
                user=request.user,
                event_type='new_device_login',
                description=f'Login from new device: {device_info["platform"]} - {device_info["browser"]}',
                ip_address=ip_address,
                user_agent=device_info['user_agent'],
                device_info=device_info,
                risk_level='medium'
            )
        
        return None 