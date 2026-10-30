"""Prediction endpoint schemas.

Phase 4 does not load a trained model. Response models therefore describe
explicit unavailable states and reject fabricated predictions.
"""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from .common import CamelModel


class PredictionCandidate(CamelModel):
    class_id: str
    crop: str | None = None
    label: str | None = None
    score: float


class PredictionUnavailableResponse(CamelModel):
    status: Literal["model_unavailable"] = "model_unavailable"
    message: str
    model_version: str | None = None
    is_demo: Literal[False] = False
    request_id: str
    filename: str | None = None
    elapsed_ms: float | None = None
    predictions: list[PredictionCandidate] = Field(default_factory=list)
    logged: bool = True


class BatchItemResult(CamelModel):
    filename: str
    status: Literal["accepted", "rejected"]
    size_bytes: int | None = None
    image_format: str | None = None
    error_code: str | None = None
    message: str | None = None


class BatchPredictionResponse(CamelModel):
    status: Literal["model_unavailable", "rejected"] = "model_unavailable"
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
