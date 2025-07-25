"""
Authentication Utilities for RevSync

Helper functions for OTP generation, email verification, security logging,
and other authentication-related utilities.
"""

import secrets
import string
import hashlib
import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from .models import SecurityEvent, OTPCode


def generate_otp(length: int = 6, alphanumeric: bool = False) -> str:
    """
    Generate a random OTP code
    
    Args:
        length: Length of the OTP (default: 6)
        alphanumeric: Whether to include letters (default: False, numbers only)
    
    Returns:
        OTP string
    """
    if alphanumeric:
        characters = string.ascii_uppercase + string.digits
        # Exclude confusing characters
        characters = characters.replace('0', '').replace('O', '').replace('1', '').replace('I', '')
    else:
        characters = string.digits
    
    return ''.join(secrets.choice(characters) for _ in range(length))


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure token
    
    Args:
        length: Length of the token in bytes (default: 32)
    
    Returns:
        Hex-encoded token string
    """
    return secrets.token_hex(length)


def hash_token(token: str) -> str:
    """
    Hash a token using SHA-256
    
    Args:
        token: Token to hash
    
    Returns:
        Hex-encoded hash
    """
    return hashlib.sha256(token.encode()).hexdigest()


def generate_qr_code(data: str) -> str:
    """
    Generate QR code for 2FA setup
    
    Args:
        data: Data to encode (usually TOTP URI)
    
    Returns:
        Base64-encoded QR code image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


async def send_verification_email(user, verification_type: str = 'email_verification', 
                                context: Dict[str, Any] = None) -> bool:
    """
    Send verification email to user
    
    Args:
        user: User instance
        verification_type: Type of verification email
        context: Additional context for email template
    
    Returns:
        True if email sent successfully, False otherwise
    """
    context = context or {}
    context.update({
        'user': user,
        'site_name': 'RevSync',
        'domain': getattr(settings, 'DOMAIN', 'revsync.com'),
    })
    
    templates = {
        'email_verification': {
            'subject': 'Verify your RevSync email address',
            'template': 'auth/emails/email_verification.html'
        },
        'password_reset': {
            'subject': 'Reset your RevSync password',
            'template': 'auth/emails/password_reset.html'
        },
        'account_created': {
            'subject': 'Welcome to RevSync!',
            'template': 'auth/emails/welcome.html'
        },
        'login_alert': {
            'subject': 'New login to your RevSync account',
            'template': 'auth/emails/login_alert.html'
        },
        'security_alert': {
            'subject': 'Security alert for your RevSync account',
            'template': 'auth/emails/security_alert.html'
        }
    }
    
    if verification_type not in templates:
        return False
    
    template_info = templates[verification_type]
    
    try:
        # Render email content
        html_message = render_to_string(template_info['template'], context)
        plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject=template_info['subject'],
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@revsync.com'),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


async def log_security_event(user, event_type: str, description: str = None, 
                            request=None, risk_level: str = 'low') -> SecurityEvent:
    """
    Log a security event for auditing
    
    Args:
        user: User instance
        event_type: Type of security event
        description: Event description
        request: HTTP request object (optional)
        risk_level: Risk level (low, medium, high, critical)
    
    Returns:
        Created SecurityEvent instance
    """
    # Extract request information if available
    ip_address = None
    user_agent = None
    device_info = {}
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        device_info = extract_device_info(request)
    
    # Create security event
    event = SecurityEvent.objects.create(
        user=user,
        event_type=event_type,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        device_info=device_info,
        risk_level=risk_level
    )
    
    # Send alert for high-risk events
    if risk_level in ['high', 'critical']:
        await send_security_alert(user, event)
    
    return event


async def send_security_alert(user, security_event: SecurityEvent) -> bool:
    """
    Send security alert email for high-risk events
    
    Args:
        user: User instance
        security_event: SecurityEvent instance
    
    Returns:
        True if alert sent successfully
    """
    context = {
        'event': security_event,
        'timestamp': security_event.created_at.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'ip_address': security_event.ip_address,
        'device_info': security_event.device_info,
    }
    
    return await send_verification_email(user, 'security_alert', context)


def get_client_ip(request) -> Optional[str]:
    """
    Extract client IP address from request
    
    Args:
        request: HTTP request object
    
    Returns:
        Client IP address or None
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def extract_device_info(request) -> Dict[str, Any]:
    """
    Extract device information from request
    
    Args:
        request: HTTP request object
    
    Returns:
        Dictionary with device information
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Basic device detection (you might want to use a more sophisticated library)
    device_info = {
        'user_agent': user_agent,
        'platform': 'unknown',
        'browser': 'unknown',
        'device_type': 'unknown'
    }
    
    # Simple device detection
    user_agent_lower = user_agent.lower()
    
    # Platform detection
    if 'windows' in user_agent_lower:
        device_info['platform'] = 'Windows'
    elif 'macintosh' in user_agent_lower or 'mac os' in user_agent_lower:
        device_info['platform'] = 'macOS'
    elif 'linux' in user_agent_lower:
        device_info['platform'] = 'Linux'
    elif 'android' in user_agent_lower:
        device_info['platform'] = 'Android'
    elif 'iphone' in user_agent_lower or 'ipad' in user_agent_lower:
        device_info['platform'] = 'iOS'
    
    # Browser detection
    if 'chrome' in user_agent_lower:
        device_info['browser'] = 'Chrome'
    elif 'firefox' in user_agent_lower:
        device_info['browser'] = 'Firefox'
    elif 'safari' in user_agent_lower:
        device_info['browser'] = 'Safari'
    elif 'edge' in user_agent_lower:
        device_info['browser'] = 'Edge'
    
    # Device type detection
    if 'mobile' in user_agent_lower or 'android' in user_agent_lower or 'iphone' in user_agent_lower:
        device_info['device_type'] = 'mobile'
    elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
        device_info['device_type'] = 'tablet'
    else:
        device_info['device_type'] = 'desktop'
    
    return device_info


def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength
    
    Args:
        password: Password to validate
    
    Returns:
        Dictionary with validation results
    """
    result = {
        'is_valid': True,
        'score': 0,
        'feedback': [],
        'requirements': {
            'min_length': False,
            'has_uppercase': False,
            'has_lowercase': False,
            'has_digit': False,
            'has_special': False,
            'no_common_patterns': True
        }
    }
    
    # Check minimum length
    if len(password) >= 8:
        result['requirements']['min_length'] = True
        result['score'] += 1
    else:
        result['feedback'].append('Password must be at least 8 characters long')
    
    # Check for uppercase
    if any(c.isupper() for c in password):
        result['requirements']['has_uppercase'] = True
        result['score'] += 1
    else:
        result['feedback'].append('Password must contain at least one uppercase letter')
    
    # Check for lowercase
    if any(c.islower() for c in password):
        result['requirements']['has_lowercase'] = True
        result['score'] += 1
    else:
        result['feedback'].append('Password must contain at least one lowercase letter')
    
    # Check for digit
    if any(c.isdigit() for c in password):
        result['requirements']['has_digit'] = True
        result['score'] += 1
    else:
        result['feedback'].append('Password must contain at least one digit')
    
    # Check for special characters
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if any(c in special_chars for c in password):
        result['requirements']['has_special'] = True
        result['score'] += 1
    else:
        result['feedback'].append('Password must contain at least one special character')
    
    # Check for common patterns
    common_patterns = [
        '123456', 'password', 'qwerty', 'abc123', 'letmein',
        'welcome', 'monkey', 'dragon', 'master', 'admin'
    ]
    
    password_lower = password.lower()
    for pattern in common_patterns:
        if pattern in password_lower:
            result['requirements']['no_common_patterns'] = False
            result['feedback'].append('Password contains common patterns')
            break
    
    # Overall validation
    result['is_valid'] = all(result['requirements'].values())
    
    # Calculate strength level
    if result['score'] <= 2:
        result['strength'] = 'weak'
    elif result['score'] <= 3:
        result['strength'] = 'fair'
    elif result['score'] <= 4:
        result['strength'] = 'good'
    else:
        result['strength'] = 'strong'
    
    return result


def create_backup_codes(count: int = 10) -> List[str]:
    """
    Generate backup codes for 2FA recovery
    
    Args:
        count: Number of backup codes to generate
    
    Returns:
        List of backup codes
    """
    return [generate_otp(8, alphanumeric=True) for _ in range(count)]


def is_session_expired(session_record) -> bool:
    """
    Check if authentication session is expired
    
    Args:
        session_record: AuthSession instance
    
    Returns:
        True if expired, False otherwise
    """
    return timezone.now() > session_record.expires_at


def clean_expired_sessions():
    """
    Clean up expired sessions from the database
    """
    from .models import AuthSession
    
    expired_sessions = AuthSession.objects.filter(
        expires_at__lt=timezone.now()
    )
    
    count = expired_sessions.count()
    expired_sessions.delete()
    
    return count


def clean_expired_otp_codes():
    """
    Clean up expired OTP codes from the database
    """
    expired_otps = OTPCode.objects.filter(
        expires_at__lt=timezone.now()
    )
    
    count = expired_otps.count()
    expired_otps.delete()
    
    return count


def format_phone_number(phone: str, country_code: str = '+1') -> str:
    """
    Format phone number for SMS delivery
    
    Args:
        phone: Phone number
        country_code: Country code (default: +1 for US)
    
    Returns:
        Formatted phone number
    """
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Add country code if not present
    if not digits.startswith('1') and country_code == '+1':
        digits = '1' + digits
    
    return country_code + digits if not digits.startswith('+') else digits


def generate_verification_token() -> str:
    """
    Generate a verification token for email/phone verification
    
    Returns:
        Secure verification token
    """
    return generate_secure_token(32)


class RateLimiter:
    """
    Simple rate limiter for authentication attempts
    """
    
    def __init__(self):
        self.attempts = {}
    
    def is_allowed(self, key: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        """
        Check if action is allowed based on rate limiting
        
        Args:
            key: Unique key for rate limiting (e.g., IP + email)
            max_attempts: Maximum attempts allowed
            window_minutes: Time window in minutes
        
        Returns:
            True if allowed, False if rate limited
        """
        now = timezone.now()
        window_start = now - timedelta(minutes=window_minutes)
        
        # Clean old attempts
        if key in self.attempts:
            self.attempts[key] = [
                attempt for attempt in self.attempts[key]
                if attempt > window_start
            ]
        
        # Check if allowed
        if key not in self.attempts:
            self.attempts[key] = []
        
        if len(self.attempts[key]) >= max_attempts:
            return False
        
        # Record attempt
        self.attempts[key].append(now)
        return True


# Create global rate limiter instance
rate_limiter = RateLimiter() 