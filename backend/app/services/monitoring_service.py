"""Aggregation of real SQLite telemetry for the monitoring endpoint.

Every value is computed from stored rows. Missing evidence produces ``null``
values rather than synthetic estimates.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone

from ..database import Database
from ..repositories.drift_repository import DriftBaselineRepository
from ..repositories.prediction_repository import PredictionLogRepository
from ..schemas.monitoring import (
    ClassDistributionItem,
    ConfidenceMetrics,
    ConfidencePoint,
    DriftStatus,
    LatencyMetrics,
    MonitoringMetricsResponse,
    RecentPredictionEvent,
    TelemetryTotals,
)

DRIFT_UNAVAILABLE_MESSAGE = (
    "No drift baseline distribution is loaded. PSI and KS statistics cannot be "
    "computed without a verified baseline and live prediction logs."
)


def _percentile(sorted_samples: list[float], percentile: float) -> float | None:
    if not sorted_samples:
        return None
    rank = math.ceil((percentile / 100.0) * len(sorted_samples))
    index = min(max(rank - 1, 0), len(sorted_samples) - 1)
    return round(sorted_samples[index], 2)


class MonitoringService:
    """Builds the monitoring payload from stored telemetry only."""

    def __init__(
        self,
        database: Database,
        prediction_repository: PredictionLogRepository,
        drift_repository: DriftBaselineRepository,
    ) -> None:
        self.database = database
        self.prediction_repository = prediction_repository
        self.drift_repository = drift_repository

    def get_metrics(self) -> MonitoringMetricsResponse:
        with self.database.connection() as connection:
            totals_row = self.prediction_repository.totals(connection)
            latency_samples = self.prediction_repository.latency_samples(connection)
            mean_score, confidence_count = self.prediction_repository.confidence_stats(
                connection
            )
            distribution_rows = self.prediction_repository.class_distribution(connection)
            recent_rows = self.prediction_repository.recent_events(connection)
            trend_rows = self.prediction_repository.confidence_trend(connection)
            baseline_rows = self.drift_repository.list_all(connection)

        totals = TelemetryTotals(**totals_row)

        if totals.total_requests == 0:
            status = "empty"
        elif totals.successful_predictions == 0:
            status = "partial"
        else:
            status = "available"

        latency = LatencyMetrics(
            p50_ms=_percentile(latency_samples, 50),
            p95_ms=_percentile(latency_samples, 95),
            sample_count=len(latency_samples),
            note=(
                "Latency percentiles require successful inference rows with a "
                "recorded latency. No inference latency is available in Phase 4."
            ),
        )

        confidence = ConfidenceMetrics(
            mean_top1_score=round(mean_score, 6) if mean_score is not None else None,
            sample_count=confidence_count,
            note=(
                "Mean top-1 class score from stored predictions. Softmax-style "
                "scores are class scores, not calibrated probabilities."
            ),
        )

        predicted_total = sum(int(row["count"]) for row in distribution_rows)
        class_distribution = [
            ClassDistributionItem(
                class_id=str(row["class_id"]),
                label=row["label"],
                count=int(row["count"]),
                share=round(int(row["count"]) / predicted_total, 6)
                if predicted_total
                else 0.0,
            )
            for row in distribution_rows
        ]

        confidence_trend = [
            ConfidencePoint(
                timestamp=datetime.fromisoformat(str(row["created_at"])),
                mean_top1_score=float(row["top_score"]),
            )
            for row in trend_rows
        ]

        recent_events = [
            RecentPredictionEvent(
                id=int(row["id"]),
                request_id=str(row["request_id"]),
                created_at=datetime.fromisoformat(str(row["created_at"])),
                filename=row["filename"],
                source=str(row["source"]),
                status=str(row["status"]),
                predicted_class_id=row["predicted_class_id"],
                predicted_class_label=row["predicted_class_label"],
                top1_score=row["top_score"],
                latency_ms=row["latency_ms"],
                error_code=row["error_code"],
            )
            for row in recent_rows
        ]

        if not baseline_rows:
            drift = DriftStatus(
                available=False,
                method=None,
                psi=None,
                ks_statistic=None,
                baseline_class_count=0,
                message=DRIFT_UNAVAILABLE_MESSAGE,
            )
        elif totals.successful_predictions == 0:
            drift = DriftStatus(
                available=False,
                method=None,
                psi=None,
                ks_statistic=None,
                baseline_class_count=len(baseline_rows),
                message=(
                    "A baseline distribution exists, but no successful predictions "
                    "have been logged yet, so drift cannot be evaluated."
                ),
            )
        else:
            drift = DriftStatus(
                available=False,
                method=None,
                psi=None,
                ks_statistic=None,
                baseline_class_count=len(baseline_rows),
                message=(
                    "Baseline and predictions exist, but PSI/KS computation is not "
                    "enabled in Phase 4. No drift value is estimated or invented."
                ),
            )

        return MonitoringMetricsResponse(
            status=status,
            available=status == "available",
            generated_at=datetime.now(timezone.utc),
            totals=totals,
            latency=latency,
            confidence=confidence,
            class_distribution=class_distribution,
            confidence_trend=confidence_trend,
            drift=drift,
            recent_events=recent_events,
            notes=[
                "Prediction attempts are logged even while the model is unavailable.",
                "No scores, latency benchmarks, accuracy values, or drift statistics "
                "are fabricated.",
                "Ground-truth accuracy is omitted until verified labels accompany real "
                "inference logs.",
            ],
        )
