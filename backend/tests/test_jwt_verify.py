from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from jwt.algorithms import ECAlgorithm

from app import jwt_verify
from app.config import get_settings
from app.main import app

SUPABASE_URL = "http://localhost:54321"
ISSUER = SUPABASE_URL + "/auth/v1"
KID = "test-key-1"
USER_ID = "11111111-2222-4333-8444-555555555555"

_private = ec.generate_private_key(ec.SECP256R1())
_other_private = ec.generate_private_key(ec.SECP256R1())
_PUBLIC_JWK = {**json.loads(ECAlgorithm.to_jwk(_private.public_key())), "kid": KID, "alg": "ES256", "use": "sig"}


def make_token(key=_private, *, kid=KID, alg="ES256", **claims) -> str:
    now = int(time.time())
    payload = {"sub": USER_ID, "aud": "authenticated", "iss": ISSUER, "role": "authenticated",
               "iat": now, "exp": now + 3600, **claims}
    payload = {k: v for k, v in payload.items() if v is not None}
    return jwt.encode(payload, key, algorithm=alg, headers={"kid": kid})


@pytest.fixture(autouse=True)
def jwks(monkeypatch):
    calls = {"n": 0}

    def fake_fetch(_url):
        calls["n"] += 1
        return [_PUBLIC_JWK]

    monkeypatch.setattr(jwt_verify, "fetch_jwks", fake_fetch)
    jwt_verify.clear_key_cache()
    yield calls
    jwt_verify.clear_key_cache()


def verify(token):
    return jwt_verify.verify_access_token(token, SUPABASE_URL)


def test_a_valid_token_returns_its_user_id(jwks):
    assert verify(make_token()) == USER_ID


def test_keys_are_cached_not_fetched_per_request(jwks):
    for _ in range(5):
        verify(make_token())
    assert jwks["n"] == 1


@pytest.mark.parametrize(
    "claims",
    [
        {"exp": int(time.time()) - 3600},  # expired
        {"aud": "anon"},
        {"aud": None},
        {"iss": "https://evil.example.com/auth/v1"},
        {"iss": None},
        {"sub": None},  # the anon key itself has no subject
        {"exp": None},
    ],
)
def test_bad_claims_are_rejected(claims):
    with pytest.raises(jwt_verify.InvalidToken):
        verify(make_token(**claims))


def test_a_token_signed_by_another_key_is_rejected():
    with pytest.raises(jwt_verify.InvalidToken):
        verify(make_token(_other_private))


def test_a_tampered_payload_is_rejected():
    head, _payload, sig = make_token().split(".")
    forged = base64.urlsafe_b64encode(json.dumps({"sub": "someone-else", "aud": "authenticated",
                                                  "iss": ISSUER, "exp": int(time.time()) + 3600}).encode()).rstrip(b"=").decode()
    with pytest.raises(jwt_verify.InvalidToken):
        verify(f"{head}.{forged}.{sig}")


def test_algorithm_confusion_is_rejected():
    """HS256 signed with the *public* key as the secret must not verify."""
    # PyJWT itself refuses to build this token, so sign it by hand.
    def b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    head = b64(json.dumps({"alg": "HS256", "typ": "JWT", "kid": KID}).encode())
    body = b64(json.dumps({"sub": "attacker", "aud": "authenticated", "iss": ISSUER,
                           "exp": int(time.time()) + 3600}).encode())
    secret = json.dumps(_PUBLIC_JWK).encode()
    sig = b64(hmac.new(secret, f"{head}.{body}".encode(), hashlib.sha256).digest())
    token = f"{head}.{body}.{sig}"
    with pytest.raises(jwt_verify.InvalidToken):
        verify(token)


def test_alg_none_is_rejected():
    head = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT", "kid": KID}).encode()).rstrip(b"=").decode()
    body = base64.urlsafe_b64encode(json.dumps({"sub": "x", "aud": "authenticated", "iss": ISSUER,
                                                "exp": int(time.time()) + 3600}).encode()).rstrip(b"=").decode()
    with pytest.raises(jwt_verify.InvalidToken):
        verify(f"{head}.{body}.")


@pytest.mark.parametrize("token", ["", "garbage", "a.b.c", "Bearer x"])
def test_malformed_tokens_are_rejected(token):
    with pytest.raises(jwt_verify.InvalidToken):
        verify(token)


def test_unknown_kid_is_rejected_and_refetches_are_rate_limited(jwks):
    verify(make_token())  # warm: 1 fetch
    for _ in range(10):
        with pytest.raises(jwt_verify.InvalidToken):
            verify(make_token(kid="forged"))
    assert jwks["n"] == 1  # forged kids do not make us hit Supabase every time


def test_a_failed_jwks_fetch_is_a_401_not_a_crash(monkeypatch):
    def boom(_url):
        raise RuntimeError("network down")

    monkeypatch.setattr(jwt_verify, "fetch_jwks", boom)
    jwt_verify.clear_key_cache()
    with pytest.raises(jwt_verify.InvalidToken):
        verify(make_token())


# ---- through the API (default AUTH_MODE=jwks) ------------------------------


def _client():
    get_settings.cache_clear()
    app.dependency_overrides.clear()
    return TestClient(app)


def test_the_api_takes_its_user_id_from_the_verified_token():
    res = _client().get("/api/me", headers={"Authorization": f"Bearer {make_token()}"})
    assert res.status_code == 200 and res.json() == {"user_id": USER_ID}


@pytest.mark.parametrize("header", [None, "Bearer ", "Bearer garbage", "Basic abc"])
def test_the_api_rejects_missing_or_bad_tokens(header):
    headers = {"Authorization": header} if header else {}
    assert _client().get("/api/me", headers=headers).status_code == 401


def test_the_api_rejects_an_expired_token():
    token = make_token(exp=int(time.time()) - 3600)
    assert _client().get("/api/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_remote_mode_still_asks_supabase(monkeypatch):
    from app import auth

    asked = []

    class Resp:
        user = type("U", (), {"id": "from-supabase"})()

    class Client:
        class auth:
            @staticmethod
            def get_user(token):
                asked.append(token)
                return Resp

    monkeypatch.setenv("AUTH_MODE", "remote")
    monkeypatch.setattr(auth, "create_client", lambda *a, **k: Client)
    res = _client().get("/api/me", headers={"Authorization": "Bearer opaque"})
    assert res.json() == {"user_id": "from-supabase"} and asked == ["opaque"]


def test_keys_load_on_a_freshly_booted_instance(monkeypatch, jwks):
    """time.monotonic() counts from boot, so on a new serverless instance it is
    a few seconds. The very first lookup must still fetch the keys."""
    monkeypatch.setattr(jwt_verify.time, "monotonic", lambda: 5.0)
    jwt_verify.clear_key_cache()
    assert verify(make_token()) == USER_ID
    assert jwks["n"] == 1
