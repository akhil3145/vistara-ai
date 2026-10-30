"""SQLite connection management and schema initialization.

Uses only Python's standard library ``sqlite3`` module. Connections are
created per unit of work and always closed by the caller/context manager.
"""

from __future__ import annotations

import logging
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

SCHEMA_VERSION = 1

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS batch_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    file_count INTEGER NOT NULL DEFAULT 0,
    accepted_count INTEGER NOT NULL DEFAULT 0,
    rejected_count INTEGER NOT NULL DEFAULT 0,
    model_version TEXT,
    error_message TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS prediction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL,
    batch_job_id INTEGER,
    created_at TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('single', 'batch')),
    filename TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    image_format TEXT,
    status TEXT NOT NULL CHECK (
        status IN ('success', 'model_unavailable', 'rejected', 'error')
    ),
    error_code TEXT,
    error_message TEXT,
    model_version TEXT,
    predicted_class_id TEXT,
    predicted_class_label TEXT,
    top_score REAL,
    latency_ms REAL,
    is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
    FOREIGN KEY (batch_job_id) REFERENCES batch_jobs (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS drift_baseline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    class_label TEXT,
    baseline_share REAL NOT NULL CHECK (baseline_share >= 0 AND baseline_share <= 1),
    sample_count INTEGER,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (class_id, source)
);

CREATE INDEX IF NOT EXISTS idx_prediction_logs_created_at
    ON prediction_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_status
    ON prediction_logs (status);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_predicted_class
    ON prediction_logs (predicted_class_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_batch_job
    ON prediction_logs (batch_job_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_request_id
    ON prediction_logs (request_id);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at
    ON batch_jobs (created_at);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status
    ON batch_jobs (status);

CREATE INDEX IF NOT EXISTS idx_drift_baseline_class_id
    ON drift_baseline (class_id);
CREATE INDEX IF NOT EXISTS idx_drift_baseline_source
    ON drift_baseline (source);
"""


def utc_now_iso() -> str:
    """Return a timezone-aware UTC timestamp in ISO 8601 form."""
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


class DatabaseError(RuntimeError):
    """Raised when the SQLite database cannot be initialized or queried."""


class Database:
    """Owns the SQLite file path and provides short-lived connections."""

    def __init__(self, path: Path, busy_timeout_seconds: float = 5.0) -> None:
        self.path = Path(path)
        self.busy_timeout_seconds = busy_timeout_seconds

    def initialize(self) -> None:
        """Create the parent directory, tables, and indexes if needed."""
        self.path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with self.connection() as connection:
                connection.executescript(SCHEMA_SQL)
                connection.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
                connection.execute("PRAGMA journal_mode = WAL")
                connection.commit()
        except sqlite3.Error as exc:
            logger.exception("Failed to initialize SQLite database at %s", self.path)
            raise DatabaseError(
                f"Unable to initialize the SQLite database: {exc}"
            ) from exc

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        """Yield a connection with row access by column name."""
        connection: sqlite3.Connection | None = None
        try:
            connection = sqlite3.connect(
                str(self.path),
                timeout=self.busy_timeout_seconds,
                check_same_thread=False,
            )
            connection.row_factory = sqlite3.Row
            connection.execute("PRAGMA foreign_keys = ON")
            connection.execute(
                f"PRAGMA busy_timeout = {int(self.busy_timeout_seconds * 1000)}"
            )
            yield connection
        except sqlite3.Error as exc:
            logger.exception("SQLite operation failed for %s", self.path)
            raise DatabaseError(f"SQLite operation failed: {exc}") from exc
        finally:
            if connection is not None:
                connection.close()

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        """Yield a connection wrapped in an explicit commit/rollback."""
        with self.connection() as connection:
            try:
                yield connection
                connection.commit()
            except Exception:
                connection.rollback()
                raise

    def healthcheck(self) -> tuple[bool, int | None, str | None]:
        """Return database availability, schema version, and an error message."""
        try:
            with self.connection() as connection:
                connection.execute("SELECT 1").fetchone()
                version_row = connection.execute("PRAGMA user_version").fetchone()
                version = int(version_row[0]) if version_row else None
            return True, version, None
        except DatabaseError as exc:
            return False, None, str(exc)
        except sqlite3.Error as exc:  # pragma: no cover - defensive
            return False, None, f"SQLite healthcheck failed: {exc}"
