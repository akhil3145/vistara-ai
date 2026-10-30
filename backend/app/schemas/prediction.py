
"""Prediction endpoint schemas.

Supports real model predictions, unavailable model states,
and batch inference results.
"""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from .common import CamelModel


class PredictionCandidate(CamelModel):
    """One predicted plant disease class."""

    class_id: str
    crop: str | None = None
    label: str | None = None
    score: float = Field(ge=0.0, le=1.0)


class PredictionUnavailableResponse(CamelModel):
    """Single-image prediction response."""

    status: Literal["success", "model_unavailable"] = "model_unavailable"
    message: str
    model_version: str | None = None
    is_demo: Literal[False] = False
    request_id: str
    filename: str | None = None
    elapsed_ms: float | None = None
    predictions: list[PredictionCandidate] = Field(default_factory=list)
    logged: bool = True


class BatchItemResult(CamelModel):
    """Result for an individual image in a batch."""

    filename: str
    status: Literal["success", "accepted", "rejected", "model_unavailable"]
    size_bytes: int | None = None
    image_format: str | None = None
    elapsed_ms: float | None = None
    predictions: list[PredictionCandidate] = Field(default_factory=list)
    error_code: str | None = None
    message: str | None = None


class BatchPredictionResponse(CamelModel):
    """Batch prediction response."""

    status: Literal[
        "success",
        "partial_success",
        "model_unavailable",
        "rejected",
    ] = "model_unavailable"

    message: str
    model_version: str | None = None
    is_demo: Literal[False] = False
    request_id: str
    batch_id: int
    item_count: int
    accepted_count: int
    rejected_count: int
    items: list[BatchItemResult] = Field(default_factory=list)
    predictions: list[PredictionCandidate] = Field(default_factory=list)
    logged: bool = True
