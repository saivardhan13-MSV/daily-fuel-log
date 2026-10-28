from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Reads backend/.env, then falls back to the Next.js app's .env.local so
    the Supabase keys are configured in one place rather than copied around.

    Only the anon key is used. Requests run as the signed-in user (their JWT
    is forwarded to Postgres), so Row Level Security stays the final isolation
    layer, exactly as it is with the Next.js server client today.
    """

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env.local"),
        extra="ignore",
        populate_by_name=True,
    )

    supabase_url: str = Field(validation_alias=AliasChoices("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"))
    supabase_anon_key: str = Field(
        validation_alias=AliasChoices("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    usda_fdc_api_key: str | None = Field(default=None, validation_alias="USDA_FDC_API_KEY")
    # "jwks": verify the token's signature locally (default, no Supabase round
    # trip). "remote": ask Supabase Auth on every request, which also catches
    # revoked sessions. See app/jwt_verify.py.
    auth_mode: Literal["jwks", "remote"] = Field(default="jwks", validation_alias="AUTH_MODE")
    cors_origins: str = Field(default="http://localhost:3000", validation_alias="CORS_ORIGINS")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
