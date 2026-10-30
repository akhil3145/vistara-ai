"""Data access for the drift baseline table."""

from __future__ import annotations

import sqlite3


class DriftBaselineRepository:
    """Parameterized access to the ``drift_baseline`` table."""

    def list_all(self, connection: sqlite3.Connection) -> list[sqlite3.Row]:
        return connection.execute(
            """
            SELECT id, class_id, class_label, baseline_share, sample_count,
                   source, created_at
            FROM drift_baseline
            ORDER BY class_id ASC
            """
        ).fetchall()

    def count(self, connection: sqlite3.Connection) -> int:
        row = connection.execute("SELECT COUNT(*) AS total FROM drift_baseline").fetchone()
        return int(row["total"]) if row else 0
