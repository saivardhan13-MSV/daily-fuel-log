from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .errors import StorageError
from .routers import read, write

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


@app.exception_handler(RequestValidationError)
async def _validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
    """One readable string in `detail`, like every other error from this API,
    so the Next.js layer can show it directly."""
    first = exc.errors()[0]
    field = ".".join(str(p) for p in first["loc"] if p not in ("body", "query", "path"))
    message = f"{field}: {first['msg']}" if field else first["msg"]
    return JSONResponse(status_code=422, content={"detail": message})


@app.exception_handler(StorageError)
async def _storage_error(_request: Request, exc: StorageError) -> JSONResponse:
    # The repository already logged the driver error; clients only get the
    # action-level message ("Failed to add item"), never Postgres text.
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(read.router)
app.include_router(write.router)
