"""Model information and evaluation report schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from .common import CamelModel


class ArtifactStatus(CamelModel):
    directory: str
    expected_files: list[str]
    found_files: list[str]
    missing_files: list[str]
    evaluation_report_present: bool


class ModelInfoResponse(CamelModel):
    status: Literal["not_trained", "loaded", "unavailable"]
    loaded: bool
    version: str | None = None
    architecture: str
    input_shape: list[int]
    planned_class_count: int
    supported_classes: list[str]
    class_list_status: Literal["unavailable", "loaded"]
    artifacts: ArtifactStatus
    message: str


class ModelReportResponse(CamelModel):
    available: bool
    status: Literal["available", "unavailable"]
    generated_at: datetime | None = None
    source: str
    message: str
    artifacts: ArtifactStatus
    report: dict[str, Any] | None = None
