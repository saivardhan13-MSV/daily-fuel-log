"""Local verification of Supabase access tokens.

Supabase signs user tokens with an asymmetric key and publishes the public
half as JWKS, so this API can check a token's signature itself: no secret to
store and no round trip to Supabase per request (which matters on serverless,
where every request is a fresh call).

What this does NOT do is ask Supabase whether the session was revoked, so a
token stays valid until it expires (an hour by default). PostgREST works the
same way: it checks signature and expiry only, so the database's own Row Level
Security accepts exactly the tokens this accepts. Set AUTH_MODE=remote to ask
Supabase Auth on every request instead.
"""

from __future__ import annotations

import logging
import threading
import time

import httpx
import jwt

log = logging.getLogger(__name__)

# Only asymmetric algorithms. Never HS256 or "none": accepting those with a
# key fetched from JWKS is the classic algorithm-confusion attack.
ALLOWED_ALGORITHMS = ("ES256", "RS256")
AUDIENCE = "authenticated"
CLOCK_SKEW_SECONDS = 10
JWKS_TIMEOUT_SECONDS = 5
# A forged `kid` must not let a caller make us hit Supabase on every request.
MIN_REFETCH_INTERVAL_SECONDS = 60
JWKS_TTL_SECONDS = 3600


class InvalidToken(Exception):
    """The token is missing, malformed, expired, or not signed by Supabase."""


def fetch_jwks(jwks_url: str) -> list[dict]:
    response = httpx.get(jwks_url, timeout=JWKS_TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json().get("keys", [])


class _KeyCache:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._keys: dict[str, jwt.PyJWK] = {}
        self._fetched_at = 0.0

    def clear(self) -> None:
        with self._lock:
            self._keys, self._fetched_at = {}, 0.0

    def get(self, jwks_url: str, kid: str) -> jwt.PyJWK:
        with self._lock:
            now = time.monotonic()
            stale = now - self._fetched_at > JWKS_TTL_SECONDS
            can_refetch = now - self._fetched_at > MIN_REFETCH_INTERVAL_SECONDS
            if (kid not in self._keys and can_refetch) or stale:
                self._refresh(jwks_url, now)
            key = self._keys.get(kid)
        if key is None:
            raise InvalidToken("unknown signing key")
        return key

    def _refresh(self, jwks_url: str, now: float) -> None:
        try:
            keys = fetch_jwks(jwks_url)
        except Exception as exc:
            # Keep whatever we had; the caller gets "unknown signing key" and
            # the real cause is in the log.
            log.error("JWKS fetch failed: %s", exc)
            self._fetched_at = now - MIN_REFETCH_INTERVAL_SECONDS + 5  # retry shortly, not every request
            return
        self._keys = {k["kid"]: jwt.PyJWK.from_dict(k) for k in keys if k.get("kid")}
        self._fetched_at = now


_cache = _KeyCache()


def clear_key_cache() -> None:
    _cache.clear()


def verify_access_token(token: str, supabase_url: str) -> str:
    """Return the token's user id (`sub`), or raise InvalidToken."""
    issuer = supabase_url.rstrip("/") + "/auth/v1"
    try:
        header = jwt.get_unverified_header(token)
        alg, kid = header.get("alg"), header.get("kid")
        if alg not in ALLOWED_ALGORITHMS or not kid:
            raise InvalidToken("unsupported token header")
        key = _cache.get(issuer + "/.well-known/jwks.json", kid)
        claims = jwt.decode(
            token,
            key.key,
            algorithms=[alg],
            audience=AUDIENCE,
            issuer=issuer,
            leeway=CLOCK_SKEW_SECONDS,
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
    except InvalidToken:
        raise
    except jwt.PyJWTError as exc:
        raise InvalidToken(str(exc)) from None
    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub:
        raise InvalidToken("missing subject")
    return sub
