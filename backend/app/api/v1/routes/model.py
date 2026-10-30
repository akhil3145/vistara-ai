"""Model information and evaluation report endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ....schemas.model import ModelInfoResponse, ModelReportResponse
from ....services.model_service import ModelService

router = APIRouter(tags=["model"])


@router.get("/model/info", response_model=ModelInfoResponse, summary="Model readiness and planned configuration")
def model_info(request: Request) -> ModelInfoResponse:
    model_service: ModelService = request.app.state.model_service
    return model_service.get_info()


@router.get("/model/report", response_model=ModelReportResponse, summary="Verified evaluation artifact report")
def model_report(request: Request) -> ModelReportResponse:
    model_service: ModelService = request.app.state.model_service
    return model_service.get_report()
