from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import read

app = FastAPI(
    title="Daily Fuel Log API",
    version="0.1.0",
    description="Python backend for the Daily Fuel Log tracker. Auth is Supabase (Bearer token); "
    "every query runs as the signed-in user so Postgres RLS stays the isolation layer.",
)


def _configure_cors() -> None:
    try:
        origins = get_settings().cors_origin_list
    except Exception:
        # Settings are only needed at request time; don't block import (tests,
        # tooling) when env vars aren't present.
        origins = ["http://localhost:3000"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )


_configure_cors()
app.include_router(read.router)
