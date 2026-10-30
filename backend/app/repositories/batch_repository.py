"""Data access for batch job telemetry rows."""

from __future__ import annotations

import sqlite3

from ..database import utc_now_iso


class BatchJobRepository:
    """Parameterized access to the ``batch_jobs`` table."""

    def create(
        self,
        connection: sqlite3.Connection,
        *,
        request_id: str,
        status: str,
        file_count: int,
        accepted_count: int = 0,
        rejected_count: int = 0,
        model_version: str | None = None,
        error_message: str | None = None,
        notes: str | None = None,
        created_at: str | None = None,
        completed_at: str | None = None,
    ) -> int:
        cursor = connection.execute(
            """
            INSERT INTO batch_jobs (
                request_id, created_at, completed_at, status, file_count,
                accepted_count, rejected_count, model_version, error_message, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                request_id,
                created_at or utc_now_iso(),
                completed_at,
                status,
                file_count,
                accepted_count,
                rejected_count,
                model_version,
                error_message,
                notes,
            ),
        )
        return int(cursor.lastrowid)

    def update_outcome(
        self,
        connection: sqlite3.Connection,
        *,
        batch_id: int,
        status: str,
        accepted_count: int,
        rejected_count: int,
        completed_at: str | None = None,
        error_message: str | None = None,
    ) -> None:
        connection.execute(
            """
            UPDATE batch_jobs
            SET status = ?,
                accepted_count = ?,
                rejected_count = ?,
                completed_at = COALESCE(?, completed_at),
                error_message = ?
            WHERE id = ?
            """,
            (
                status,
                accepted_count,
                rejected_count,
                completed_at or utc_now_iso(),
                error_message,
                batch_id,
            ),
        )

    def count_all(self, connection: sqlite3.Connection) -> int:
        row = connection.execute("SELECT COUNT(*) AS total FROM batch_jobs").fetchone()
        return int(row["total"]) if row else 0
