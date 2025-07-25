"""
Authentication Services for RevSync

Comprehensive authentication service using Supabase Auth with support for:
- Email/password authentication
- Social login (Google, Apple, etc.)
- OTP and 2FA
- Magic links
- Session management
- Security monitoring
"""

import os
import json
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import pyotp
import jwt
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from supabase import create_client, Client
from gotrue import SyncGoTrueClient
from twilio.rest import Client as TwilioClient
import google.auth.transport.requests
import google.oauth2.id_token
from .models import User, UserProfile, AuthSession, OTPCode, SocialAuthProvider, SecurityEvent
from .utils import generate_otp, send_verification_email, log_security_event

# Get User model
User = get_user_model()


class SupabaseAuthService:
    """
    Main authentication service using Supabase
    """
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Supabase credentials not configured")
        
        # Initialize Supabase client
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.admin_client: Client = create_client(self.supabase_url, self.supabase_service_key)
        
        # Initialize Twilio for SMS (if configured)
        self.twilio_client = None
        if os.getenv('TWILIO_ACCOUNT_SID') and os.getenv('TWILIO_AUTH_TOKEN'):
            self.twilio_client = TwilioClient(
                os.getenv('TWILIO_ACCOUNT_SID'),
                os.getenv('TWILIO_AUTH_TOKEN')
            )
    
    async def register_user(self, email: str, password: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Register a new user with email and password
        """
        try:
            # Register with Supabase
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": metadata or {}
                }
            })
            
            if response.user:
                # Create Django user
                user = await self._create_django_user(response.user, email, metadata)
                
                # Log security event
                await log_security_event(
                    user, 'account_created', 
                    f"New account registered with email: {email}"
                )
                
                return {
                    'success': True,
                    'user': user,
                    'session': response.session,
                    'requires_verification': not response.user.email_confirmed_at
                }
            
            return {'success': False, 'error': 'Registration failed'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def login_user(self, email: str, password: str, device_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Authenticate user with email and password
        """
        try:
            # Authenticate with Supabase
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user and response.session:
                # Get or create Django user
                user = await self._get_or_create_django_user(response.user)
                
                # Check if 2FA is required
                if user.two_factor_enabled:
                    # Generate and send OTP
                    otp_result = await self.generate_2fa_code(user)
                    return {
                        'success': True,
                        'requires_2fa': True,
                        'user': user,
                        'temp_session': response.session.access_token
                    }
                
                # Create session record
                session = await self._create_session_record(user, response.session, device_info)
                
                # Log successful login
                await log_security_event(
                    user, 'login_success',
                    f"Successful login from {device_info.get('ip_address', 'unknown IP')}"
                )
                
                return {
                    'success': True,
                    'user': user,
                    'session': response.session,
                    'django_session': session
                }
            
            return {'success': False, 'error': 'Invalid credentials'}
            
        except Exception as e:
            # Log failed login attempt
            if email:
                try:
                    user = User.objects.get(email=email)
                    await log_security_event(
                        user, 'login_failed',
                        f"Failed login attempt: {str(e)}"
                    )
                except User.DoesNotExist:
                    pass
            
            return {'success': False, 'error': str(e)}
    
    async def social_login(self, provider: str, token: str, device_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Authenticate user with social provider (Google, Apple, etc.)
        """
        try:
            if provider == 'google':
                return await self._google_login(token, device_info)
            elif provider == 'apple':
                return await self._apple_login(token, device_info)
            else:
                return {'success': False, 'error': f'Unsupported provider: {provider}'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def send_magic_link(self, email: str) -> Dict[str, Any]:
        """
        Send magic link for passwordless authentication
        """
        try:
            response = self.supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {
                    "should_create_user": True
                }
            })
            
            return {
                'success': True,
                'message': 'Magic link sent to your email'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def verify_otp(self, email: str, token: str, type: str = 'email') -> Dict[str, Any]:
        """
        Verify OTP token for magic link or phone verification
        """
        try:
            response = self.supabase.auth.verify_otp({
                "email": email,
                "token": token,
                "type": type
            })
            
            if response.user and response.session:
                user = await self._get_or_create_django_user(response.user)
                session = await self._create_session_record(user, response.session)
                
                return {
                    'success': True,
                    'user': user,
                    'session': response.session,
                    'django_session': session
                }
            
            return {'success': False, 'error': 'Invalid or expired OTP'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def enable_2fa(self, user: User) -> Dict[str, Any]:
        """
        Enable two-factor authentication for user
        """
        try:
            # Generate TOTP secret
            secret = pyotp.random_base32()
            
            # Create TOTP URI for QR code
            totp = pyotp.TOTP(secret)
            provisioning_uri = totp.provisioning_uri(
                name=user.email,
                issuer_name="RevSync"
            )
            
            # Store secret temporarily (you might want to encrypt this)
            user.profile.temp_2fa_secret = secret
            user.profile.save()
            
            return {
                'success': True,
                'secret': secret,
                'qr_uri': provisioning_uri,
                'backup_codes': self._generate_backup_codes(user)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def verify_2fa_setup(self, user: User, code: str) -> Dict[str, Any]:
        """
        Verify 2FA setup with initial code
        """
        try:
            secret = getattr(user.profile, 'temp_2fa_secret', None)
            if not secret:
                return {'success': False, 'error': 'No 2FA setup in progress'}
            
            totp = pyotp.TOTP(secret)
            if totp.verify(code):
                # Enable 2FA
                user.two_factor_enabled = True
                user.profile.totp_secret = secret
                user.profile.temp_2fa_secret = None
                user.save()
                user.profile.save()
                
                # Log security event
                await log_security_event(user, '2fa_enabled', 'Two-factor authentication enabled')
                
                return {'success': True, 'message': '2FA enabled successfully'}
            
            return {'success': False, 'error': 'Invalid verification code'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def verify_2fa_login(self, user: User, code: str) -> Dict[str, Any]:
        """
        Verify 2FA code during login
        """
        try:
            # Check TOTP
            secret = getattr(user.profile, 'totp_secret', None)
            if secret:
                totp = pyotp.TOTP(secret)
                if totp.verify(code):
                    return {'success': True, 'method': 'totp'}
            
            # Check backup codes
            backup_codes = getattr(user.profile, 'backup_codes', [])
            if code in backup_codes:
                # Remove used backup code
                backup_codes.remove(code)
                user.profile.backup_codes = backup_codes
                user.profile.save()
                return {'success': True, 'method': 'backup_code'}
            
            # Check SMS OTP
            otp_record = OTPCode.objects.filter(
                user=user,
                code=code,
                code_type='login',
                is_used=False,
                expires_at__gt=timezone.now()
            ).first()
            
            if otp_record and otp_record.attempts_remaining > 0:
                otp_record.is_used = True
                otp_record.used_at = timezone.now()
                otp_record.save()
                return {'success': True, 'method': 'sms'}
            
            return {'success': False, 'error': 'Invalid 2FA code'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def send_sms_otp(self, user: User, phone_number: str) -> Dict[str, Any]:
        """
        Send OTP via SMS for verification or 2FA
        """
        if not self.twilio_client:
            return {'success': False, 'error': 'SMS service not configured'}
        
        try:
            # Generate OTP
            code = generate_otp()
            
            # Save OTP record
            otp_record = OTPCode.objects.create(
                user=user,
                code=code,
                code_type='login',
                delivery_method='sms',
                expires_at=timezone.now() + timedelta(minutes=5)
            )
            
            # Send SMS
            message = self.twilio_client.messages.create(
                body=f"Your RevSync verification code is: {code}",
                from_=os.getenv('TWILIO_PHONE_NUMBER'),
                to=phone_number
            )
            
            return {
                'success': True,
                'message': 'OTP sent via SMS',
                'sid': message.sid
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def refresh_session(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh authentication session
        """
        try:
            response = self.supabase.auth.refresh_session(refresh_token)
            
            if response.session:
                # Update session record
                session_record = AuthSession.objects.filter(
                    refresh_token_hash=hashlib.sha256(refresh_token.encode()).hexdigest()
                ).first()
                
                if session_record:
                    session_record.access_token_hash = hashlib.sha256(
                        response.session.access_token.encode()
                    ).hexdigest()
                    session_record.expires_at = timezone.now() + timedelta(
                        seconds=response.session.expires_in
                    )
                    session_record.save()
                
                return {
                    'success': True,
                    'session': response.session
                }
            
            return {'success': False, 'error': 'Failed to refresh session'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def logout_user(self, access_token: str) -> Dict[str, Any]:
        """
        Logout user and invalidate session
        """
        try:
            # Logout from Supabase
            self.supabase.auth.sign_out()
            
            # Invalidate Django session record
            session_record = AuthSession.objects.filter(
                access_token_hash=hashlib.sha256(access_token.encode()).hexdigest()
            ).first()
            
            if session_record:
                session_record.invalidate()
                
                # Log security event
                await log_security_event(
                    session_record.user, 'logout',
                    f"User logged out from {session_record.device_name or 'unknown device'}"
                )
            
            return {'success': True, 'message': 'Logged out successfully'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def reset_password(self, email: str) -> Dict[str, Any]:
        """
        Send password reset email
        """
        try:
            response = self.supabase.auth.reset_password_email(email)
            
            return {
                'success': True,
                'message': 'Password reset email sent'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def change_password(self, user: User, current_password: str, new_password: str) -> Dict[str, Any]:
        """
        Change user password
        """
        try:
            # First verify current password
            login_result = await self.login_user(user.email, current_password)
            if not login_result['success']:
                return {'success': False, 'error': 'Current password is incorrect'}
            
            # Update password in Supabase
            response = self.supabase.auth.update({
                "password": new_password
            })
            
            if response.user:
                # Log security event
                await log_security_event(
                    user, 'password_changed',
                    'Password changed successfully'
                )
                
                return {'success': True, 'message': 'Password changed successfully'}
            
            return {'success': False, 'error': 'Failed to change password'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # Private helper methods
    
    async def _create_django_user(self, supabase_user, email: str, metadata: Dict[str, Any] = None) -> User:
        """Create Django user from Supabase user"""
        metadata = metadata or {}
        
        user = User.objects.create(
            username=email.split('@')[0],
            email=email,
            supabase_id=supabase_user.id,
            email_verified=bool(supabase_user.email_confirmed_at),
            first_name=metadata.get('first_name', ''),
            last_name=metadata.get('last_name', ''),
        )
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user
    
    async def _get_or_create_django_user(self, supabase_user) -> User:
        """Get or create Django user from Supabase user"""
        user = User.objects.filter(supabase_id=supabase_user.id).first()
        
        if not user:
            user = await self._create_django_user(supabase_user, supabase_user.email)
        
        # Update last active
        user.last_active = timezone.now()
        user.save()
        
        return user
    
    async def _create_session_record(self, user: User, session, device_info: Dict[str, Any] = None) -> AuthSession:
        """Create session record in Django"""
        device_info = device_info or {}
        
        return AuthSession.objects.create(
            user=user,
            session_id=session.access_token,  # You might want to use a different session ID
            access_token_hash=hashlib.sha256(session.access_token.encode()).hexdigest(),
            refresh_token_hash=hashlib.sha256(session.refresh_token.encode()).hexdigest(),
            expires_at=timezone.now() + timedelta(seconds=session.expires_in),
            device_type=device_info.get('device_type'),
            device_name=device_info.get('device_name'),
            user_agent=device_info.get('user_agent'),
            ip_address=device_info.get('ip_address'),
            country=device_info.get('country'),
            city=device_info.get('city'),
        )
    
    async def _google_login(self, token: str, device_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Handle Google OAuth login"""
        try:
            # Verify Google ID token
            request = google.auth.transport.requests.Request()
            id_info = google.oauth2.id_token.verify_oauth2_token(token, request)
            
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            email = id_info['email']
            google_id = id_info['sub']
            
            # Check if user exists
            user = User.objects.filter(email=email).first()
            
            if not user:
                # Create new user
                user = await self._create_django_user(
                    type('obj', (object,), {'id': google_id, 'email': email})(),
                    email,
                    {
                        'first_name': id_info.get('given_name', ''),
                        'last_name': id_info.get('family_name', ''),
                        'avatar_url': id_info.get('picture', '')
                    }
                )
            
            # Create or update social auth provider
            provider, created = SocialAuthProvider.objects.get_or_create(
                user=user,
                provider='google',
                defaults={
                    'provider_id': google_id,
                    'provider_email': email,
                    'provider_data': id_info
                }
            )
            
            if not created:
                provider.provider_data = id_info
                provider.save()
            
            # Create session (you might want to use Supabase for this too)
            session_data = {
                'access_token': jwt.encode(
                    {'user_id': str(user.id), 'exp': timezone.now() + timedelta(hours=1)},
                    settings.SECRET_KEY,
                    algorithm='HS256'
                ),
                'refresh_token': jwt.encode(
                    {'user_id': str(user.id), 'exp': timezone.now() + timedelta(days=30)},
                    settings.SECRET_KEY,
                    algorithm='HS256'
                ),
                'expires_in': 3600
            }
            
            session = await self._create_session_record(user, type('obj', (object,), session_data)(), device_info)
            
            return {
                'success': True,
                'user': user,
                'session': session_data,
                'django_session': session
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _apple_login(self, token: str, device_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Handle Apple Sign In"""
        # Implementation for Apple Sign In would go here
        # This requires validating the Apple JWT token
        return {'success': False, 'error': 'Apple Sign In not yet implemented'}
    
    def _generate_backup_codes(self, user: User, count: int = 10) -> List[str]:
        """Generate backup codes for 2FA"""
        codes = [secrets.token_hex(4).upper() for _ in range(count)]
        
        # Store backup codes (you might want to hash these)
        user.profile.backup_codes = codes
        user.profile.backup_codes_generated = True
        user.profile.save()
        
        return codes


# Create singleton instance
auth_service = SupabaseAuthService() 