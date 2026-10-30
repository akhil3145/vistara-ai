"""Health endpoint schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from .common import CamelModel


class DatabaseStatus(CamelModel):
    status: Literal["ok", "error"]
    path: str
    schema_version: int | None = None
    message: str | None = None


class ModelReadiness(CamelModel):
    status: Literal["not_trained", "loaded", "unavailable"]
    loaded: bool
    version: str | None = None
    message: str


class HealthResponse(CamelModel):
    status: Literal["ok", "degraded"]
    service: str
    version: str
    environment: str
    timestamp: datetime
    uptime_seconds: float
    database: DatabaseStatus
    model: ModelReadiness
