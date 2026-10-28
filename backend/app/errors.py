"""Errors the storage layer raises so routers never see Supabase types."""

from __future__ import annotations


class StorageError(Exception):
    """A database call failed. The detail is logged server-side and never sent
    to the client (Postgres error text can name tables and constraints)."""


class DuplicateWeightDate(Exception):
    """Moving a weigh-in onto a date that already has a different one."""
