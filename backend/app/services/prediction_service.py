
"""Prediction request orchestration.

Validates uploaded images, runs MobileNetV2 inference,
and records prediction telemetry in SQLite.
"""

from __future__ import annotations

import logging
from io import BytesIO
from time import perf_counter
from typing import Any, Literal
from uuid import uuid4

import numpy as np
from fastapi import UploadFile
from PIL import Image
from starlette.concurrency import run_in_threadpool

from ..config import Settings
from ..database import Database
from ..exceptions import BatchValidationError, ImageValidationError
from ..repositories.batch_repository import BatchJobRepository
from ..repositories.prediction_repository import PredictionLogRepository
from ..schemas.prediction import (
    BatchItemResult,
    BatchPredictionResponse,
    PredictionCandidate,
    PredictionUnavailableResponse,
)
from .image_validation import validate_image_upload
from .model_service import UNLOADED_MESSAGE, ModelService


logger = logging.getLogger(__name__)

MODEL_UNAVAILABLE_MESSAGE = (
    "The model is unavailable, so no prediction was produced. "
    + UNLOADED_MESSAGE
)

ALL_REJECTED_MESSAGE = (
    "Every uploaded file was rejected before inference. No model was called."
)

INFERENCE_FAILED_MESSAGE = "Model inference failed for this image."

TOP_K = 5
IMAGE_SIZE = (224, 224)


class PredictionService:
    """Validates uploads, performs inference, and records telemetry."""

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

    @staticmethod
    def _prepare_image(data: bytes) -> np.ndarray:
        """Decode and preprocess an image for MobileNetV2."""

        import tensorflow as tf

        from tensorflow.keras.applications.mobilenet_v2 import (
            preprocess_input,
        )

        with Image.open(BytesIO(data)) as image:
            image = image.convert("RGB")
            image_array = np.asarray(image, dtype=np.float32)

        resized = tf.image.resize(
            image_array,
            IMAGE_SIZE,
            method="bilinear",
        ).numpy()

        preprocessed = preprocess_input(resized)

        return np.expand_dims(preprocessed, axis=0)

    def _run_inference(self, data: bytes) -> np.ndarray:
        """Run the loaded model and return its class scores."""

        model = self.model_service.model

        if model is None:
            raise RuntimeError("The prediction model is not loaded.")

        image_batch = self._prepare_image(data)

        output = model.predict(image_batch, verbose=0)
        scores = np.asarray(output, dtype=np.float32)

        expected_classes = len(self.model_service.class_names)

        if scores.shape != (1, expected_classes):
            raise ValueError(
                f"Unexpected model output shape: {scores.shape}"
            )

        scores = scores[0]

        if not np.all(np.isfinite(scores)):
            raise ValueError(
                "Model returned non-finite prediction scores."
            )

        if np.any(scores < 0) or np.any(scores > 1):
            raise ValueError(
                "Model returned scores outside the expected range."
            )

        return scores

    def _build_candidates(
        self,
        scores: np.ndarray,
    ) -> list[PredictionCandidate]:
        """Convert model scores into the top five predictions."""

        class_names = self.model_service.class_names

        top_indices = np.argsort(scores)[::-1][:TOP_K]

        predictions: list[PredictionCandidate] = []

        for index in top_indices:
            raw_class_name = class_names[int(index)]

            if "___" in raw_class_name:
                crop, label = raw_class_name.split("___", 1)
            else:
                crop = None
                label = raw_class_name

            predictions.append(
                PredictionCandidate(
                    class_id=str(int(index)),
                    crop=crop.replace("_", " ") if crop else None,
                    label=label.replace("_", " "),
                    score=float(scores[index]),
                )
            )

        return predictions

    async def predict_single(
        self,
        upload: UploadFile,
    ) -> tuple[PredictionUnavailableResponse, int]:

        request_id = uuid4().hex
        started = perf_counter()

        # Step 1: Validate the uploaded image.
        try:
            validated = await validate_image_upload(
                upload,
                self.settings,
            )

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

        # Step 2: Check model readiness.
        if not self.model_service.is_loaded:
            elapsed_ms = round(
                (perf_counter() - started) * 1000,
                2,
            )

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
                    status="model_unavailable",
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

        # Step 3: Run actual model inference.
        try:
            scores = await run_in_threadpool(
                self._run_inference,
                validated.data,
            )

            predictions = self._build_candidates(scores)

        except Exception:
            logger.exception(
                "Inference failed for request %s.",
                request_id,
            )
            raise

        elapsed_ms = round(
            (perf_counter() - started) * 1000,
            2,
        )

        # Step 4: Record the actual prediction in SQLite.
        best_prediction = predictions[0]

        with self.database.transaction() as connection:
            self.prediction_repository.create(
                connection,
                request_id=request_id,
                source="single",
                status="success",
                filename=validated.filename,
                mime_type=validated.declared_mime_type,
                size_bytes=validated.size_bytes,
                image_format=validated.image_format,
                predicted_class_id=best_prediction.class_id,
                predicted_class_label=best_prediction.label,
                top_score=best_prediction.score,
                latency_ms=elapsed_ms,
                model_version=self.settings.model_version,
                is_demo=False,
            )

        # Step 5: Return genuine predictions.
        return (
            PredictionUnavailableResponse(
                status="success",
                message="Image analyzed successfully.",
                model_version=self.settings.model_version,
                request_id=request_id,
                filename=validated.filename,
                elapsed_ms=elapsed_ms,
                predictions=predictions,
                logged=True,
            ),
            200,
        )

    async def predict_batch(
        self,
        uploads: list[UploadFile],
    ) -> tuple[BatchPredictionResponse, int]:
        """Validate batch uploads, run inference, and record telemetry."""

        if len(uploads) > self.settings.max_batch_files:
            raise BatchValidationError(
                status_code=400,
                code="too_many_files",
                message=(
                    f"Batch contains {len(uploads)} files; the configured limit "
                    f"is {self.settings.max_batch_files}."
                ),
                context={
                    "fileCount": len(uploads),
                    "maxFiles": self.settings.max_batch_files,
                },
            )

        request_id = uuid4().hex
        accepted_count = 0
        rejected_count = 0
        successful_count = 0
        failed_count = 0

        items: list[BatchItemResult] = []
        log_entries: list[dict[str, Any]] = []

        model_available = self.model_service.is_loaded

        for upload in uploads:
            try:
                validated = await validate_image_upload(
                    upload,
                    self.settings,
                )

            except ImageValidationError as exc:
                context = exc.context or {}

                rejected_count += 1

                filename = str(
                    context.get("filename") or upload.filename or "upload"
                )

                raw_size = context.get("sizeBytes")
                rejected_size = (
                    raw_size if isinstance(raw_size, int) else None
                )

                raw_format = context.get("imageFormat")
                rejected_format = (
                    raw_format if isinstance(raw_format, str) else None
                )

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

            # Step 1: Check model readiness before running inference.
            if not model_available:
                items.append(
                    BatchItemResult(
                        filename=validated.filename,
                        status="model_unavailable",
                        size_bytes=validated.size_bytes,
                        image_format=validated.image_format,
                        error_code="model_unavailable",
                        message=MODEL_UNAVAILABLE_MESSAGE,
                    )
                )

                # SQLite prediction logs only allow success,
                # model_unavailable, rejected, and error.
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
                continue

            # Step 2: Run actual model inference for this image.
            started = perf_counter()

            try:
                scores = await run_in_threadpool(
                    self._run_inference,
                    validated.data,
                )

                predictions = self._build_candidates(scores)

            except Exception:
                logger.exception(
                    "Batch inference failed for %s (request %s).",
                    validated.filename,
                    request_id,
                )

                elapsed_ms = round(
                    (perf_counter() - started) * 1000,
                    2,
                )

                failed_count += 1

                items.append(
                    BatchItemResult(
                        filename=validated.filename,
                        status="error",
                        size_bytes=validated.size_bytes,
                        image_format=validated.image_format,
                        elapsed_ms=elapsed_ms,
                        error_code="inference_error",
                        message=INFERENCE_FAILED_MESSAGE,
                    )
                )

                log_entries.append(
                    {
                        "status": "error",
                        "filename": validated.filename,
                        "mime_type": validated.declared_mime_type,
                        "size_bytes": validated.size_bytes,
                        "image_format": validated.image_format,
                        "error_code": "inference_error",
                        "error_message": INFERENCE_FAILED_MESSAGE,
                    }
                )
                continue

            elapsed_ms = round(
                (perf_counter() - started) * 1000,
                2,
            )

            best_prediction = predictions[0]
            successful_count += 1

            items.append(
                BatchItemResult(
                    filename=validated.filename,
                    status="success",
                    size_bytes=validated.size_bytes,
                    image_format=validated.image_format,
                    elapsed_ms=elapsed_ms,
                    predictions=predictions,
                    message="Image analyzed successfully.",
                )
            )

            log_entries.append(
                {
                    "status": "success",
                    "filename": validated.filename,
                    "mime_type": validated.declared_mime_type,
                    "size_bytes": validated.size_bytes,
                    "image_format": validated.image_format,
                    "predicted_class_id": best_prediction.class_id,
                    "predicted_class_label": best_prediction.label,
                    "top_score": best_prediction.score,
                    "latency_ms": elapsed_ms,
                }
            )

        # Step 3: Determine the batch outcome.
        final_status: Literal[
            "success",
            "partial_success",
            "model_unavailable",
            "rejected",
            "error",
        ]

        if accepted_count == 0:
            final_status = "rejected"
            http_status = 400
            message = ALL_REJECTED_MESSAGE
            error_message: str | None = ALL_REJECTED_MESSAGE

        elif not model_available:
            final_status = "model_unavailable"
            http_status = 503
            message = MODEL_UNAVAILABLE_MESSAGE
            error_message = None

        elif successful_count == len(uploads):
            final_status = "success"
            http_status = 200
            message = f"All {successful_count} images analyzed successfully."
            error_message = None

        elif successful_count > 0:
            final_status = "partial_success"
            http_status = 200

            details: list[str] = []
            if rejected_count:
                details.append(f"{rejected_count} rejected")
            if failed_count:
                details.append(f"{failed_count} inference failures")

            message = (
                f"{successful_count} of {len(uploads)} images analyzed "
                f"successfully"
            )
            message += f"; {'; '.join(details)}." if details else "."
            error_message = None

        else:
            final_status = "error"
            http_status = 500
            message = f"Inference failed for all {accepted_count} valid images"
            if rejected_count:
                message += f"; {rejected_count} rejected"
            message += "."
            error_message = "Inference failed for all valid images."

        # Step 4: Persist the batch job and per-image telemetry.
        with self.database.transaction() as connection:
            batch_id = self.batch_repository.create(
                connection,
                request_id=request_id,
                status="processing",
                file_count=len(uploads),
                accepted_count=0,
                rejected_count=0,
                model_version=self.settings.model_version,
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
                    predicted_class_id=entry.get("predicted_class_id"),
                    predicted_class_label=entry.get("predicted_class_label"),
                    top_score=entry.get("top_score"),
                    latency_ms=entry.get("latency_ms"),
                    is_demo=False,
                )

            self.batch_repository.update_outcome(
                connection,
                batch_id=batch_id,
                status=final_status,
                accepted_count=accepted_count,
                rejected_count=rejected_count,
                error_message=error_message,
            )

        response = BatchPredictionResponse(
            status=final_status,
            message=message,
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
