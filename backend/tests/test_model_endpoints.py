"""Model info and report endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_model_info_reports_not_trained(client: TestClient) -> None:
    response = client.get("/api/v1/model/info")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "not_trained"
    assert body["loaded"] is False
    assert body["version"] is None
    assert body["supportedClasses"] == []
    assert body["classListStatus"] == "unavailable"
    assert body["plannedClassCount"] == 38
    assert body["artifacts"]["evaluationReportPresent"] is False


def test_model_report_has_honest_empty_state(client: TestClient) -> None:
    response = client.get("/api/v1/model/report")

    assert response.status_code == 200
    body = response.json()
    assert body["available"] is False
    assert body["status"] == "unavailable"
    assert body["report"] is None
    assert body["artifacts"]["foundFiles"] == []
    assert "evaluation_report.json" in body["artifacts"]["missingFiles"]
