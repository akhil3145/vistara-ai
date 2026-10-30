"""Version 1 API router aggregation."""

from fastapi import APIRouter

from .routes import health, model, monitoring, predict

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(model.router)
api_router.include_router(predict.router)
api_router.include_router(monitoring.router)
