"""Monitoring empty-state tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_monitoring_empty_state_is_honest(client: TestClient) -> None:
    response = client.get("/api/v1/monitoring/metrics")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "empty"
    assert body["available"] is False

    assert body["totals"] == {
        "totalRequests": 0,
        "successfulPredictions": 0,
        "modelUnavailable": 0,
        "rejectedUploads": 0,
        "errorResponses": 0,
    }
    assert body["latency"]["p50Ms"] is None
    assert body["latency"]["p95Ms"] is None
    assert body["latency"]["sampleCount"] == 0
    assert body["confidence"]["meanTop1Score"] is None
    assert body["confidence"]["sampleCount"] == 0
    assert body["classDistribution"] == []
    assert body["confidenceTrend"] == []
    assert body["recentEvents"] == []

    assert body["drift"]["available"] is False
    assert body["drift"]["psi"] is None
    assert body["drift"]["ksStatistic"] is None
    assert body["drift"]["baselineClassCount"] == 0
    assert "No drift baseline" in body["drift"]["message"]
    assert any("fabricated" in note for note in body["notes"])
