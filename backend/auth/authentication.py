from typing import Tuple, Optional
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework import exceptions
from jose import jwt


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Authenticate requests using a Supabase access token (GoTrue).
    - Verifies JWT against Supabase project JWKS
    - Maps `sub` to `users.User.supabase_id`
    - Creates a local user if missing (for seamless cross-platform auth)
    """

    _jwks_cache: Optional[dict] = None

    def authenticate(self, request) -> Optional[Tuple[object, None]]:
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b"bearer" or len(auth) != 2:
            return None

        token = auth[1].decode("utf-8")

        try:
            payload = self._verify_supabase_jwt(token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f"Invalid Supabase token: {e}")

        user = self._get_or_create_user(payload)
        return (user, None)

    def _fetch_jwks(self) -> dict:
        if self._jwks_cache:
            return self._jwks_cache
        supabase_url = getattr(settings, "SUPABASE_URL", None) or settings.AI_SETTINGS.get("OLLAMA_HOST", "")
        # Expect SUPABASE_URL in settings or env (e.g., https://xyzcompany.supabase.co)
        supabase_url = getattr(settings, "SUPABASE_URL", supabase_url)
        if not supabase_url:
            raise exceptions.AuthenticationFailed("SUPABASE_URL not configured")
        jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        self._jwks_cache = response.json()
        return self._jwks_cache

    def _verify_supabase_jwt(self, token: str) -> dict:
        jwks = self._fetch_jwks()
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key:
            raise exceptions.AuthenticationFailed("No matching JWK for token")
        payload = jwt.decode(token, key, algorithms=[key.get("alg", "RS256")], options={"verify_aud": False})
        return payload

    def _get_or_create_user(self, payload: dict):
        User = get_user_model()
        supabase_id = payload.get("sub")
        email = payload.get("email")
        if not supabase_id:
            raise exceptions.AuthenticationFailed("Token missing subject")
        user = User.objects.filter(supabase_id=supabase_id).first()
        if user:
            return user
        # Create a minimal user record
        username = (email or supabase_id).split("@")[0]
        user = User.objects.create(
            username=username,
            email=email or "",
            supabase_id=supabase_id,
            email_verified=bool(payload.get("email_verified") or payload.get("email_confirmed_at")),
        )
        try:
            from .models import UserProfile  # local auth app profile
            UserProfile.objects.create(user=user)
        except Exception:
            pass
        return user


