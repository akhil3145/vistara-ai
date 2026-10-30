"""Prediction endpoint, model-unavailable, and upload validation tests."""

from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from app.config import Settings
from tests.conftest import make_image_bytes


def test_single_prediction_returns_explicit_model_unavailable(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    response = client.post(
        "/api/v1/predict",
        files={"file": ("leaf.png", make_image_bytes(), "image/png")},
    )

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "model_unavailable"
    assert body["isDemo"] is False
    assert body["predictions"] == []
    assert body["logged"] is True
    assert body["requestId"]
    assert body["filename"] == "leaf.png"

    row = db_connection.execute("SELECT * FROM prediction_logs").fetchone()
    assert row is not None
    assert row["status"] == "model_unavailable"
    assert row["source"] == "single"
    assert row["predicted_class_id"] is None
    assert row["top_score"] is None
    assert row["latency_ms"] is None
    assert row["is_demo"] == 0
    assert row["image_format"] == "PNG"


def test_monitoring_reflects_logged_unavailable_attempt(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/predict",
        files={"file": ("leaf.png", make_image_bytes(), "image/png")},
    )
    request_id = response.json()["requestId"]

    metrics = client.get("/api/v1/monitoring/metrics").json()

    assert metrics["status"] == "partial"
    assert metrics["available"] is False
    assert metrics["totals"]["totalRequests"] == 1
    assert metrics["totals"]["modelUnavailable"] == 1
    assert metrics["totals"]["successfulPredictions"] == 0
    assert metrics["latency"]["sampleCount"] == 0
    assert metrics["confidence"]["sampleCount"] == 0
    assert len(metrics["recentEvents"]) == 1
    assert metrics["recentEvents"][0]["requestId"] == request_id


def test_unsupported_extension_is_rejected(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    response = client.post(
        "/api/v1/predict",
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["error"]["code"] == "unsupported_image_extension"

    row = db_connection.execute("SELECT * FROM prediction_logs").fetchone()
    assert row["status"] == "rejected"
    assert row["error_code"] == "unsupported_image_extension"


def test_corrupt_image_content_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/predict",
        files={"file": ("leaf.png", b"this is not a png", "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_image_content"


def test_empty_file_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/v1/predict",
        files={"file": ("leaf.png", b"", "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "empty_file"


def test_oversized_image_is_rejected(settings: Settings, client: TestClient) -> None:
    settings.max_upload_size_bytes = 8

    response = client.post(
        "/api/v1/predict",
        files={"file": ("leaf.png", make_image_bytes(), "image/png")},
    )

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "image_too_large"


def test_jpeg_upload_is_accepted(client: TestClient) -> None:
    response = client.post(
        "/api/v1/predict",
        files={
            "file": (
                "leaf.jpg",
                make_image_bytes(image_format="JPEG"),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 503
    assert response.json()["status"] == "model_unavailable"
