"""Health endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_reports_backend_database_and_model_status(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "Vistara AI Backend"
    assert body["database"]["status"] == "ok"
    assert body["database"]["schemaVersion"] == 1
    assert body["database"]["message"] is None
    assert body["model"]["status"] == "not_trained"
    assert body["model"]["loaded"] is False
    assert body["model"]["version"] is None
    assert body["uptimeSeconds"] >= 0
    assert "timestamp" in body
