"""Monitoring and telemetry schemas.

All values are derived from real rows in the SQLite telemetry store. When
there is no evidence (for example no successful inference or no baseline
distribution), values are ``null`` and ``available`` is ``false``.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import Field

from .common import CamelModel


class TelemetryTotals(CamelModel):
    total_requests: int = 0
    successful_predictions: int = 0
    model_unavailable: int = 0
    rejected_uploads: int = 0
    error_responses: int = 0


class LatencyMetrics(CamelModel):
    p50_ms: float | None = None
    p95_ms: float | None = None
    sample_count: int = 0
    note: str


class ConfidenceMetrics(CamelModel):
    mean_top1_score: float | None = None
    sample_count: int = 0
    note: str


class ClassDistributionItem(CamelModel):
    class_id: str
    label: str | None = None
    count: int
    share: float


class ConfidencePoint(CamelModel):
    timestamp: datetime
    mean_top1_score: float


class RecentPredictionEvent(CamelModel):
    id: int
    request_id: str
    created_at: datetime
    filename: str | None = None
    source: str
    status: str
    predicted_class_id: str | None = None
    predicted_class_label: str | None = None
    top1_score: float | None = None
    latency_ms: float | None = None
    error_code: str | None = None


class DriftStatus(CamelModel):
    available: bool
    method: str | None = None
    psi: float | None = None
    ks_statistic: float | None = None
    baseline_class_count: int = 0
    message: str


class MonitoringMetricsResponse(CamelModel):
    status: Literal["empty", "partial", "available"]
    available: bool
    generated_at: datetime
    totals: TelemetryTotals
    latency: LatencyMetrics
    confidence: ConfidenceMetrics
    class_distribution: list[ClassDistributionItem] = Field(default_factory=list)
    confidence_trend: list[ConfidencePoint] = Field(default_factory=list)
    drift: DriftStatus
    recent_events: list[RecentPredictionEvent] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
