"""Batch prediction and batch job logging tests."""

from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from app.config import Settings
from tests.conftest import make_image_bytes


def test_batch_prediction_is_model_unavailable_and_logs_job_and_items(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    response = client.post(
        "/api/v1/predict/batch",
        files=[
            ("files", ("first.png", make_image_bytes(), "image/png")),
            (
                "files",
                ("second.jpg", make_image_bytes((10, 20, 30), "JPEG"), "image/jpeg"),
            ),
        ],
    )

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "model_unavailable"
    assert body["isDemo"] is False
    assert body["itemCount"] == 2
    assert body["acceptedCount"] == 2
    assert body["rejectedCount"] == 0
    assert body["predictions"] == []
    assert body["batchId"] > 0

    job = db_connection.execute("SELECT * FROM batch_jobs").fetchone()
    assert job["status"] == "model_unavailable"
    assert job["file_count"] == 2
    assert job["accepted_count"] == 2
    assert job["rejected_count"] == 0
    assert job["completed_at"] is not None

    logs = db_connection.execute(
        "SELECT * FROM prediction_logs WHERE batch_job_id = ?",
        (body["batchId"],),
    ).fetchall()
    assert len(logs) == 2
    assert {row["source"] for row in logs} == {"batch"}
    assert {row["status"] for row in logs} == {"model_unavailable"}
    assert all(row["is_demo"] == 0 for row in logs)


def test_batch_with_only_invalid_files_returns_rejected(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    response = client.post(
        "/api/v1/predict/batch",
        files=[("files", ("bad.txt", b"nope", "text/plain"))],
    )

    assert response.status_code == 400
    body = response.json()
    assert body["status"] == "rejected"
    assert body["acceptedCount"] == 0
    assert body["rejectedCount"] == 1
    assert body["items"][0]["errorCode"] == "unsupported_image_extension"

    job = db_connection.execute("SELECT * FROM batch_jobs").fetchone()
    assert job["status"] == "rejected"
    assert job["rejected_count"] == 1


def test_batch_over_configured_limit_is_rejected_before_logging(
    settings: Settings, client: TestClient, db_connection: sqlite3.Connection
) -> None:
    settings.max_batch_files = 1

    response = client.post(
        "/api/v1/predict/batch",
        files=[
            ("files", ("first.png", make_image_bytes(), "image/png")),
            ("files", ("second.png", make_image_bytes(), "image/png")),
        ],
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "too_many_files"
    assert db_connection.execute("SELECT COUNT(*) FROM batch_jobs").fetchone()[0] == 0
