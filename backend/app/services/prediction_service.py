"""Prediction request orchestration.

Phase 4 has no trained model. These methods validate uploads, write honest
telemetry rows (attempts and rejections), and return explicit
``model_unavailable`` responses instead of fabricated predictions.
"""

from __future__ import annotations

from time import perf_counter
from typing import Any, Literal
from uuid import uuid4

from fastapi import UploadFile

from ..config import Settings
from ..database import Database
from ..exceptions import BatchValidationError, ImageValidationError
from ..repositories.batch_repository import BatchJobRepository
from ..repositories.prediction_repository import PredictionLogRepository
from ..schemas.prediction import (
    BatchItemResult,
    BatchPredictionResponse,
    PredictionUnavailableResponse,
)
from .image_validation import validate_image_upload
from .model_service import UNLOADED_MESSAGE, ModelService

MODEL_UNAVAILABLE_MESSAGE = (
    "The model is unavailable, so no prediction was produced. "
    + UNLOADED_MESSAGE
)
ALL_REJECTED_MESSAGE = (
    "Every uploaded file was rejected before inference. No model was called."
)


class PredictionService:
    """Validates uploads, records telemetry, and reports model availability."""

    def __init__(
        self,
        database: Database,
        settings: Settings,
        model_service: ModelService,
        prediction_repository: PredictionLogRepository,
        batch_repository: BatchJobRepository,
    ) -> None:
        self.database = database
        self.settings = settings
        self.model_service = model_service
        self.prediction_repository = prediction_repository
        self.batch_repository = batch_repository

    async def predict_single(
        self, upload: UploadFile
    ) -> tuple[PredictionUnavailableResponse, int]:
        request_id = uuid4().hex
        started = perf_counter()

        try:
            validated = await validate_image_upload(upload, self.settings)
        except ImageValidationError as exc:
            context = exc.context or {}
            with self.database.transaction() as connection:
                self.prediction_repository.create(
                    connection,
                    request_id=request_id,
                    source="single",
                    status="rejected",
                    filename=context.get("filename") or upload.filename,
                    mime_type=upload.content_type,
                    size_bytes=context.get("sizeBytes"),
                    error_code=exc.code,
                    error_message=exc.message,
                )
            raise

        elapsed_ms = round((perf_counter() - started) * 1000, 2)
        with self.database.transaction() as connection:
            self.prediction_repository.create(
                connection,
                request_id=request_id,
                source="single",
                status="model_unavailable",
                filename=validated.filename,
                mime_type=validated.declared_mime_type,
                size_bytes=validated.size_bytes,
                image_format=validated.image_format,
                error_code="model_unavailable",
                error_message="No trained model is loaded.",
                model_version=self.settings.model_version,
            )

        return (
            PredictionUnavailableResponse(
                message=MODEL_UNAVAILABLE_MESSAGE,
                model_version=self.settings.model_version,
                request_id=request_id,
                filename=validated.filename,
                elapsed_ms=elapsed_ms,
                predictions=[],
                logged=True,
            ),
            503,
        )

    async def predict_batch(
        self, uploads: list[UploadFile]
    ) -> tuple[BatchPredictionResponse, int]:
        if len(uploads) > self.settings.max_batch_files:
            raise BatchValidationError(
                status_code=400,
                code="too_many_files",
                message=(
                    f"Batch contains {len(uploads)} files; the configured limit "
                    f"is {self.settings.max_batch_files}."
                ),
                context={"fileCount": len(uploads), "maxFiles": self.settings.max_batch_files},
            )

        request_id = uuid4().hex
        accepted_count = 0
        rejected_count = 0
        items: list[BatchItemResult] = []
        log_entries: list[dict[str, Any]] = []

        for upload in uploads:
            try:
                validated = await validate_image_upload(upload, self.settings)
            except ImageValidationError as exc:
                context = exc.context or {}
                rejected_count += 1
                filename = str(context.get("filename") or upload.filename or "upload")
                raw_size = context.get("sizeBytes")
                rejected_size = raw_size if isinstance(raw_size, int) else None
                raw_format = context.get("imageFormat")
                rejected_format = raw_format if isinstance(raw_format, str) else None
                items.append(
                    BatchItemResult(
                        filename=filename,
                        status="rejected",
                        size_bytes=rejected_size,
                        image_format=rejected_format,
                        error_code=exc.code,
                        message=exc.message,
                    )
                )
                log_entries.append(
                    {
                        "status": "rejected",
                        "filename": filename,
                        "mime_type": upload.content_type,
                        "size_bytes": rejected_size,
                        "image_format": rejected_format,
                        "error_code": exc.code,
                        "error_message": exc.message,
                    }
                )
                continue

            accepted_count += 1
            items.append(
                BatchItemResult(
                    filename=validated.filename,
                    status="accepted",
                    size_bytes=validated.size_bytes,
                    image_format=validated.image_format,
                    error_code="model_unavailable",
                    message="Validated successfully; no trained model is loaded.",
                )
            )
            log_entries.append(
                {
                    "status": "model_unavailable",
                    "filename": validated.filename,
                    "mime_type": validated.declared_mime_type,
                    "size_bytes": validated.size_bytes,
                    "image_format": validated.image_format,
                    "error_code": "model_unavailable",
                    "error_message": "No trained model is loaded.",
                }
            )

        final_status: Literal["model_unavailable", "rejected"] = (
            "model_unavailable" if accepted_count > 0 else "rejected"
        )
        with self.database.transaction() as connection:
            batch_id = self.batch_repository.create(
                connection,
                request_id=request_id,
                status="processing",
                file_count=len(uploads),
                accepted_count=0,
                rejected_count=0,
                model_version=self.settings.model_version,
                notes="Phase 4 telemetry: no model loaded.",
            )
            for entry in log_entries:
                self.prediction_repository.create(
                    connection,
                    request_id=request_id,
                    batch_job_id=batch_id,
                    source="batch",
                    status=str(entry["status"]),
                    filename=entry.get("filename"),
                    mime_type=entry.get("mime_type"),
                    size_bytes=entry.get("size_bytes"),
                    image_format=entry.get("image_format"),
                    error_code=entry.get("error_code"),
                    error_message=entry.get("error_message"),
                    model_version=self.settings.model_version,
                )
            self.batch_repository.update_outcome(
                connection,
                batch_id=batch_id,
                status=final_status,
                accepted_count=accepted_count,
                rejected_count=rejected_count,
                error_message=None if accepted_count else ALL_REJECTED_MESSAGE,
            )

        http_status = 503 if accepted_count > 0 else 400
        response = BatchPredictionResponse(
            status=final_status,
            message=MODEL_UNAVAILABLE_MESSAGE if accepted_count else ALL_REJECTED_MESSAGE,
            model_version=self.settings.model_version,
            request_id=request_id,
            batch_id=batch_id,
            item_count=len(uploads),
            accepted_count=accepted_count,
            rejected_count=rejected_count,
            items=items,
            predictions=[],
            logged=True,
        )
        return response, http_status
