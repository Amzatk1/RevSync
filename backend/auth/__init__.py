"""
RevSync Authentication Module

This module provides comprehensive authentication services using Supabase Auth,
including email/password, social login, OTP, and 2FA capabilities.
"""

from .services import AuthService
from .models import User, UserProfile, AuthSession
from .middleware import SupabaseAuthMiddleware
from .decorators import require_auth, require_verified_email
from .utils import generate_otp, verify_otp, send_verification_email

__all__ = [
    'AuthService',
    'User',
    'UserProfile', 
    'AuthSession',
    'SupabaseAuthMiddleware',
    'require_auth',
    'require_verified_email',
    'generate_otp',
    'verify_otp',
    'send_verification_email',
] 