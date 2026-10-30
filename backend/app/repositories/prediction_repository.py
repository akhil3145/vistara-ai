"""Data access for prediction telemetry rows."""

from __future__ import annotations

import sqlite3
from typing import Any

from ..database import utc_now_iso


class PredictionLogRepository:
    """Parameterized access to the ``prediction_logs`` table."""

    def create(
        self,
        connection: sqlite3.Connection,
        *,
        request_id: str,
        source: str,
        status: str,
        created_at: str | None = None,
        batch_job_id: int | None = None,
        filename: str | None = None,
        mime_type: str | None = None,
        size_bytes: int | None = None,
        image_format: str | None = None,
        error_code: str | None = None,
        error_message: str | None = None,
        model_version: str | None = None,
        predicted_class_id: str | None = None,
        predicted_class_label: str | None = None,
        top_score: float | None = None,
        latency_ms: float | None = None,
        is_demo: bool = False,
    ) -> int:
        cursor = connection.execute(
            """
            INSERT INTO prediction_logs (
                request_id, batch_job_id, created_at, source, filename,
                mime_type, size_bytes, image_format, status, error_code,
                error_message, model_version, predicted_class_id,
                predicted_class_label, top_score, latency_ms, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                request_id,
                batch_job_id,
                created_at or utc_now_iso(),
                source,
                filename,
                mime_type,
                size_bytes,
                image_format,
                status,
                error_code,
                error_message,
                model_version,
                predicted_class_id,
                predicted_class_label,
                top_score,
                latency_ms,
                1 if is_demo else 0,
            ),
        )
        return int(cursor.lastrowid)

    def count_all(self, connection: sqlite3.Connection) -> int:
        row = connection.execute("SELECT COUNT(*) AS total FROM prediction_logs").fetchone()
        return int(row["total"]) if row else 0

    def totals(self, connection: sqlite3.Connection) -> dict[str, int]:
        row = connection.execute(
            """
            SELECT
                COUNT(*) AS total_requests,
                COALESCE(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END), 0)
                    AS successful_predictions,
                COALESCE(SUM(CASE WHEN status = 'model_unavailable' THEN 1 ELSE 0 END), 0)
                    AS model_unavailable,
                COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0)
                    AS rejected_uploads,
                COALESCE(SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END), 0)
                    AS error_responses
            FROM prediction_logs
            """
        ).fetchone()
        if not row:
            return {
                "total_requests": 0,
                "successful_predictions": 0,
                "model_unavailable": 0,
                "rejected_uploads": 0,
                "error_responses": 0,
            }
        return {key: int(row[key]) for key in row.keys()}

    def latency_samples(self, connection: sqlite3.Connection) -> list[float]:
        rows = connection.execute(
            """
            SELECT latency_ms
            FROM prediction_logs
            WHERE latency_ms IS NOT NULL
            ORDER BY latency_ms ASC
            """
        ).fetchall()
        return [float(row["latency_ms"]) for row in rows]

    def confidence_stats(self, connection: sqlite3.Connection) -> tuple[float | None, int]:
        row = connection.execute(
            """
            SELECT AVG(top_score) AS mean_score, COUNT(top_score) AS sample_count
            FROM prediction_logs
            WHERE top_score IS NOT NULL
            """
        ).fetchone()
        if not row or row["sample_count"] == 0:
            return None, 0
        return float(row["mean_score"]), int(row["sample_count"])

    def class_distribution(
        self, connection: sqlite3.Connection, limit: int = 10
    ) -> list[sqlite3.Row]:
        return connection.execute(
            """
            SELECT
                predicted_class_id AS class_id,
                predicted_class_label AS label,
                COUNT(*) AS count
            FROM prediction_logs
            WHERE predicted_class_id IS NOT NULL
            GROUP BY predicted_class_id, predicted_class_label
            ORDER BY count DESC, predicted_class_id ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    def recent_events(
        self, connection: sqlite3.Connection, limit: int = 10
    ) -> list[sqlite3.Row]:
        return connection.execute(
            """
            SELECT
                id, request_id, created_at, filename, source, status,
                predicted_class_id, predicted_class_label, top_score,
                latency_ms, error_code
            FROM prediction_logs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    def confidence_trend(
        self, connection: sqlite3.Connection, limit: int = 20
    ) -> list[sqlite3.Row]:
        rows = connection.execute(
            """
            SELECT created_at, top_score
            FROM prediction_logs
            WHERE top_score IS NOT NULL
            ORDER BY created_at DESC, id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return list(reversed(rows))
