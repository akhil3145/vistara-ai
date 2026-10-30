"""Batch prediction and batch job logging tests."""

from __future__ import annotations

import sqlite3

import numpy as np
from fastapi.testclient import TestClient

from app.config import Settings
from tests.conftest import make_image_bytes


class _FakeModel:
    """Minimal Keras-like model returning fixed class scores."""

    def __init__(
        self,
        scores: np.ndarray,
        fail_on_calls: set[int] | None = None,
    ) -> None:
        self.scores = scores
        self.fail_on_calls = set(fail_on_calls or ())
        self.calls = 0

    def predict(self, images: np.ndarray, verbose: int = 0) -> np.ndarray:
        self.calls += 1

        if self.calls in self.fail_on_calls:
            raise RuntimeError("simulated inference failure")

        return np.repeat(self.scores.reshape(1, -1), len(images), axis=0)


def _enable_fake_model(
    client: TestClient,
    fail_on_calls: set[int] | None = None,
) -> _FakeModel:
    scores = np.zeros(38, dtype=np.float32)
    scores[:6] = np.array([0.5, 0.2, 0.1, 0.1, 0.05, 0.05], dtype=np.float32)

    model = _FakeModel(scores, fail_on_calls)

    model_service = client.app.state.model_service
    model_service.model = model
    model_service.class_names = [
        f"crop{index}___label{index}" for index in range(38)
    ]

    return model


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
    assert [item["status"] for item in body["items"]] == [
        "model_unavailable",
        "model_unavailable",
    ]
    assert all(item["predictions"] == [] for item in body["items"])

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


def test_batch_runs_inference_and_logs_successful_predictions(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    _enable_fake_model(client)

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

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["acceptedCount"] == 2
    assert body["rejectedCount"] == 0
    assert [item["status"] for item in body["items"]] == ["success", "success"]

    for item in body["items"]:
        assert item["elapsedMs"] is not None
        assert len(item["predictions"]) == 5
        assert item["predictions"][0]["classId"] == "0"
        assert item["predictions"][0]["label"] == "label0"

    job = db_connection.execute("SELECT * FROM batch_jobs").fetchone()
    assert job["status"] == "success"
    assert job["accepted_count"] == 2
    assert job["rejected_count"] == 0
    assert job["completed_at"] is not None

    logs = db_connection.execute(
        "SELECT * FROM prediction_logs WHERE batch_job_id = ?",
        (body["batchId"],),
    ).fetchall()
    assert len(logs) == 2
    assert {row["status"] for row in logs} == {"success"}
    assert {row["predicted_class_id"] for row in logs} == {"0"}
    assert {row["predicted_class_label"] for row in logs} == {"label0"}
    assert all(row["top_score"] == 0.5 for row in logs)
    assert all(row["latency_ms"] is not None for row in logs)
    assert all(row["is_demo"] == 0 for row in logs)


def test_batch_mixed_valid_and_invalid_returns_partial_success(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    _enable_fake_model(client)

    response = client.post(
        "/api/v1/predict/batch",
        files=[
            ("files", ("first.png", make_image_bytes(), "image/png")),
            ("files", ("bad.txt", b"nope", "text/plain")),
            (
                "files",
                ("second.jpg", make_image_bytes((10, 20, 30), "JPEG"), "image/jpeg"),
            ),
        ],
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "partial_success"
    assert body["acceptedCount"] == 2
    assert body["rejectedCount"] == 1
    assert [item["status"] for item in body["items"]] == [
        "success",
        "rejected",
        "success",
    ]
    assert body["items"][1]["errorCode"] == "unsupported_image_extension"
    assert body["items"][1]["predictions"] == []

    job = db_connection.execute("SELECT * FROM batch_jobs").fetchone()
    assert job["status"] == "partial_success"
    assert job["accepted_count"] == 2
    assert job["rejected_count"] == 1

    logs = db_connection.execute(
        "SELECT * FROM prediction_logs WHERE batch_job_id = ?",
        (body["batchId"],),
    ).fetchall()
    assert len(logs) == 3
    assert sorted(row["status"] for row in logs) == [
        "rejected",
        "success",
        "success",
    ]
    assert "accepted" not in {row["status"] for row in logs}


def test_batch_continues_after_individual_inference_failure(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    _enable_fake_model(client, fail_on_calls={2})

    response = client.post(
        "/api/v1/predict/batch",
        files=[
            ("files", ("first.png", make_image_bytes(), "image/png")),
            ("files", ("second.png", make_image_bytes(), "image/png")),
            (
                "files",
                ("third.jpg", make_image_bytes((10, 20, 30), "JPEG"), "image/jpeg"),
            ),
        ],
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "partial_success"
    assert body["acceptedCount"] == 3
    assert body["rejectedCount"] == 0
    assert [item["status"] for item in body["items"]] == [
        "success",
        "error",
        "success",
    ]

    failed_item = body["items"][1]
    assert failed_item["errorCode"] == "inference_error"
    assert failed_item["predictions"] == []
    assert failed_item["elapsedMs"] is not None

    for item in (body["items"][0], body["items"][2]):
        assert len(item["predictions"]) == 5
        assert item["predictions"][0]["classId"] == "0"

    job = db_connection.execute("SELECT * FROM batch_jobs").fetchone()
    assert job["status"] == "partial_success"
    assert job["accepted_count"] == 3
    assert job["rejected_count"] == 0
    assert job["completed_at"] is not None

    logs = db_connection.execute(
        "SELECT * FROM prediction_logs WHERE batch_job_id = ?",
        (body["batchId"],),
    ).fetchall()
    assert len(logs) == 3
    assert sorted(row["status"] for row in logs) == [
        "error",
        "success",
        "success",
    ]
    assert {row["batch_job_id"] for row in logs} == {body["batchId"]}

    failed_log = next(row for row in logs if row["status"] == "error")
    assert failed_log["error_code"] == "inference_error"
    assert failed_log["predicted_class_id"] is None
    assert failed_log["top_score"] is None


def test_batch_all_inference_failures_return_error_and_are_persisted(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    _enable_fake_model(client, fail_on_calls={1, 2})

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

    assert response.status_code == 500
    body = response.json()
    assert body["status"] == "error"
    assert body["acceptedCount"] == 2
    assert body["rejectedCount"] == 0
    assert [item["status"] for item in body["items"]] == ["error", "error"]
    assert all(
        item["errorCode"] == "inference_error" for item in body["items"]
    )
    assert all(item["predictions"] == [] for item in body["items"])

    job = db_connection.execute("SELECT * FROM batch_jobs").fetchone()
    assert job["status"] == "error"
    assert job["accepted_count"] == 2
    assert job["rejected_count"] == 0
    assert job["completed_at"] is not None

    logs = db_connection.execute(
        "SELECT * FROM prediction_logs WHERE batch_job_id = ?",
        (body["batchId"],),
    ).fetchall()
    assert len(logs) == 2
    assert {row["status"] for row in logs} == {"error"}
    assert {row["error_code"] for row in logs} == {"inference_error"}
    assert {row["batch_job_id"] for row in logs} == {body["batchId"]}


def test_batch_combines_validation_and_inference_failures(
    client: TestClient, db_connection: sqlite3.Connection
) -> None:
    _enable_fake_model(client, fail_on_calls={1})

    response = client.post(
        "/api/v1/predict/batch",
        files=[
            ("files", ("bad.txt", b"nope", "text/plain")),
            ("files", ("failing.png", make_image_bytes(), "image/png")),
            (
                "files",
                ("succeeding.jpg", make_image_bytes((10, 20, 30), "JPEG"), "image/jpeg"),
            ),
        ],
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "partial_success"
    assert body["itemCount"] == 3
    assert body["acceptedCount"] == 2
    assert body["rejectedCount"] == 1
    assert [item["status"] for item in body["items"]] == [
        "rejected",
        "error",
        "success",
    ]
    assert body["items"][0]["errorCode"] == "unsupported_image_extension"
    assert body["items"][1]["errorCode"] == "inference_error"
    assert body["items"][1]["predictions"] == []
    assert len(body["items"][2]["predictions"]) == 5

    job = db_connection.execute("SELECT * FROM batch_jobs").fetchone()
    assert job["status"] == "partial_success"
    assert job["file_count"] == 3
    assert job["accepted_count"] == 2
    assert job["rejected_count"] == 1
    assert job["completed_at"] is not None

    logs = db_connection.execute(
        "SELECT * FROM prediction_logs WHERE batch_job_id = ?",
        (body["batchId"],),
    ).fetchall()
    assert len(logs) == 3
    assert sorted(row["status"] for row in logs) == [
        "error",
        "rejected",
        "success",
    ]
    assert {row["batch_job_id"] for row in logs} == {body["batchId"]}
    assert sum(row["status"] == "rejected" for row in logs) == 1
    failed_log = next(row for row in logs if row["status"] == "error")
    assert failed_log["error_code"] == "inference_error"


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
