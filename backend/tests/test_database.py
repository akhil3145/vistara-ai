"""Database initialization and health tests."""

from __future__ import annotations

from pathlib import Path

from app.database import SCHEMA_VERSION, Database


def test_initialization_creates_tables_indexes_and_schema_version(
    tmp_path: Path,
) -> None:
    database = Database(tmp_path / "schema_test.db")
    database.initialize()

    with database.connection() as connection:
        tables = {
            row["name"]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' "
                "AND name NOT LIKE 'sqlite_%'"
            )
        }
        indexes = {
            row["name"]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'index' "
                "AND name NOT LIKE 'sqlite_%'"
            )
        }
        version = connection.execute("PRAGMA user_version").fetchone()[0]

    assert tables == {"prediction_logs", "batch_jobs", "drift_baseline"}
    assert version == SCHEMA_VERSION
    assert {
        "idx_prediction_logs_created_at",
        "idx_prediction_logs_status",
        "idx_prediction_logs_predicted_class",
        "idx_prediction_logs_batch_job",
        "idx_prediction_logs_request_id",
        "idx_batch_jobs_created_at",
        "idx_batch_jobs_status",
        "idx_drift_baseline_class_id",
        "idx_drift_baseline_source",
    } <= indexes


def test_healthcheck_reports_ok(tmp_path: Path) -> None:
    database = Database(tmp_path / "health_test.db")
    database.initialize()

    ok, version, error = database.healthcheck()

    assert ok is True
    assert version == SCHEMA_VERSION
    assert error is None


def test_initialization_is_idempotent(tmp_path: Path) -> None:
    database = Database(tmp_path / "idempotent.db")
    database.initialize()
    database.initialize()

    with database.connection() as connection:
        count = connection.execute(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' "
            "AND name = 'prediction_logs'"
        ).fetchone()[0]

    assert count == 1
