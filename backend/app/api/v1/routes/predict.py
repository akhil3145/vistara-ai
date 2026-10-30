"""Prediction endpoints.

Valid images are analyzed with the loaded MobileNetV2 model. When no model is
loaded, requests receive an explicit HTTP 503 ``model_unavailable`` response
and are logged as telemetry.
"""

from __future__ import annotations

from fastapi import APIRouter, File, Request, UploadFile
from fastapi.responses import JSONResponse

from ....schemas.prediction import (
    BatchPredictionResponse,
    PredictionUnavailableResponse,
)
from ....services.prediction_service import PredictionService

router = APIRouter(tags=["prediction"])


@router.post(
    "/predict",
    response_model=PredictionUnavailableResponse,
    responses={
        400: {"description": "Empty or undecodable image"},
        413: {"description": "Image exceeds the configured size limit"},
        415: {"description": "Unsupported image type or extension"},
        503: {"description": "No trained model is loaded"},
    },
    summary="Single-image prediction with MobileNetV2 inference",
)
async def predict_single(
    request: Request,
    file: UploadFile = File(..., description="JPEG, PNG, or WEBP leaf image"),
) -> JSONResponse:
    service: PredictionService = request.app.state.prediction_service
    payload, status_code = await service.predict_single(file)
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json", by_alias=True),
    )


@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    responses={
        200: {"description": "All or some images analyzed successfully"},
        400: {"description": "Batch is invalid or every file was rejected"},
        500: {"description": "Model inference failed for every valid image"},
        503: {"description": "No trained model is loaded"},
    },
    summary="Batch-image prediction with MobileNetV2 inference",
)
async def predict_batch(
    request: Request,
    files: list[UploadFile] = File(..., description="JPEG, PNG, or WEBP leaf images"),
) -> JSONResponse:
    service: PredictionService = request.app.state.prediction_service
    payload, status_code = await service.predict_batch(files)
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json", by_alias=True),
    )
