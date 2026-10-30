"""Health endpoint."""

from __future__ import annotations

from datetime import datetime, timezone
from time import monotonic

from fastapi import APIRouter, Request

from ....config import Settings
from ....database import Database
from ....schemas.health import DatabaseStatus, HealthResponse
from ....services.model_service import ModelService

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Service and database health")
def health(request: Request) -> HealthResponse:
    settings: Settings = request.app.state.settings
    database: Database = request.app.state.db
    model_service: ModelService = request.app.state.model_service
    started_at: float = request.app.state.started_at

    database_ok, schema_version, database_error = database.healthcheck()
    database_status = DatabaseStatus(
        status="ok" if database_ok else "error",
        path=str(database.path),
        schema_version=schema_version,
        message=database_error,
    )

    model_readiness = model_service.get_readiness()

    return HealthResponse(
        status="ok" if database_ok else "degraded",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        timestamp=datetime.now(timezone.utc),
        uptime_seconds=round(monotonic() - started_at, 3),
        database=database_status,
        model=model_readiness,
    )
