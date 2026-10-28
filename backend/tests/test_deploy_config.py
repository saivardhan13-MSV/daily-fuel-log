"""Guards the Vercel deployment config, which can't be exercised without a deploy."""

from __future__ import annotations

import importlib
import tomllib
from pathlib import Path

from fastapi import FastAPI

ROOT = Path(__file__).resolve().parent.parent


def _requirements(name: str) -> set[str]:
    lines = (ROOT / name).read_text(encoding="utf-8").splitlines()
    return {line.strip() for line in lines if line.strip() and not line.startswith(("#", "-r"))}


def test_pyproject_and_requirements_list_the_same_dependencies():
    project = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    assert set(project["dependencies"]) == _requirements("requirements.txt")


def test_every_dependency_is_pinned_exactly():
    assert all("==" in dep for dep in _requirements("requirements.txt"))


def test_the_server_is_not_a_runtime_dependency():
    # Vercel provides its own ASGI server; uvicorn is for local runs only.
    assert not any(dep.startswith("uvicorn") for dep in _requirements("requirements.txt"))
    assert any(dep.startswith("uvicorn") for dep in _requirements("requirements-dev.txt"))


def test_the_vercel_entrypoint_resolves_to_the_fastapi_app():
    entrypoint = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["tool"]["vercel"]["entrypoint"]
    module_name, attr = entrypoint.split(":")
    assert isinstance(getattr(importlib.import_module(module_name), attr), FastAPI)
    assert (ROOT / (module_name.replace(".", "/") + ".py")).exists()  # also the key used in vercel.json


def test_python_version_pin_matches_requires_python():
    pinned = (ROOT / ".python-version").read_text().strip()
    requires = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"]["requires-python"]
    assert requires == ">=" + pinned
