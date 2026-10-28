"""Authentication: the Next.js app owns login and the session cookie; this API
only verifies the Supabase access token it is handed as a Bearer header.

user_id is derived exclusively from the verified token. No endpoint ever
accepts a user_id from the client."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import ClientOptions, create_client

from .config import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthedUser:
    user_id: str
    token: str


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not signed in",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> AuthedUser:
    """Ask Supabase Auth to validate the token (the same check the Next.js
    app does with getUser()), rather than trusting an unverified JWT payload."""
    if creds is None or not creds.credentials:
        raise _unauthorized()

    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    try:
        response = client.auth.get_user(creds.credentials)
    except Exception:
        raise _unauthorized() from None

    user = getattr(response, "user", None)
    if user is None or not getattr(user, "id", None):
        raise _unauthorized()
    return AuthedUser(user_id=str(user.id), token=creds.credentials)


def user_scoped_client(user: AuthedUser, settings: Settings):
    """A Supabase client whose requests carry the user's own JWT, so Postgres
    evaluates RLS as that user. (This is deliberately not a service-role
    client: it could not be used to read another user's rows even by mistake.)"""
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {user.token}"}),
    )
