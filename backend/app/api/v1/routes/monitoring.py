"""Monitoring telemetry endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ....schemas.monitoring import MonitoringMetricsResponse
from ....services.monitoring_service import MonitoringService

router = APIRouter(tags=["monitoring"])


@router.get(
    "/monitoring/metrics",
    response_model=MonitoringMetricsResponse,
    summary="Aggregated telemetry from the SQLite store",
)
def monitoring_metrics(request: Request) -> MonitoringMetricsResponse:
    service: MonitoringService = request.app.state.monitoring_service
    return service.get_metrics()
