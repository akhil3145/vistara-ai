"""FastAPI application factory for the Vistara AI backend."""

from __future__ import annotations

import logging
import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from time import monotonic

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.v1.router import api_router
from .config import Settings, get_settings
from .database import Database, DatabaseError
from .exceptions import AppError
from .repositories.batch_repository import BatchJobRepository
from .repositories.drift_repository import DriftBaselineRepository
from .repositories.prediction_repository import PredictionLogRepository
from .schemas.common import ApiErrorDetail, ApiErrorResponse
from .services.model_service import ModelService
from .services.monitoring_service import MonitoringService
from .services.prediction_service import PredictionService

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the FastAPI application with configured services and routers."""
    resolved_settings = settings or get_settings()
    logging.basicConfig(
        level=logging.DEBUG if resolved_settings.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    database = Database(
        path=resolved_settings.database_path,
        busy_timeout_seconds=resolved_settings.database_busy_timeout_seconds,
    )
    prediction_repository = PredictionLogRepository()
    batch_repository = BatchJobRepository()
    drift_repository = DriftBaselineRepository()
    model_service = ModelService(resolved_settings)
    prediction_service = PredictionService(
        database=database,
        settings=resolved_settings,
        model_service=model_service,
        prediction_repository=prediction_repository,
        batch_repository=batch_repository,
    )
    monitoring_service = MonitoringService(
        database=database,
        prediction_repository=prediction_repository,
        drift_repository=drift_repository,
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        try:
            database.initialize()
            app.state.database_init_error = None
        except DatabaseError as exc:
            app.state.database_init_error = str(exc)
            logger.error("Database initialization failed: %s", exc)

        # Load the trained model once during normal application startup.
        # Tests remain isolated from the local model artifacts.
        if resolved_settings.environment != "test":
            model_service.load_model()
        else:
            logger.info("Skipping model loading in test environment.")

        yield

    application = FastAPI(
        title=resolved_settings.app_name,
        version=resolved_settings.app_version,
        description=(
            "Vistara AI plant health intelligence backend. Phase 4 exposes "
            "honest health, telemetry, and model-unavailable states; real "
            "inference is added in Phase 6 after Colab training."
        ),
        lifespan=lifespan,
    )

    application.state.settings = resolved_settings
    application.state.db = database
    application.state.model_service = model_service
    application.state.prediction_service = prediction_service
    application.state.monitoring_service = monitoring_service
    application.state.started_at = monotonic()

    application.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_origins,
        allow_origin_regex=(
            resolved_settings.cors_origin_regex
            if resolved_settings.environment != "production"
            else None
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(
        api_router, prefix=resolved_settings.api_v1_prefix
    )

    @application.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        payload = ApiErrorResponse(
            error=ApiErrorDetail(code=exc.code, message=exc.message),
            context=exc.context,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=payload.model_dump(mode="json", by_alias=True),
        )

    @application.exception_handler(DatabaseError)
    async def handle_database_error(
        _: Request, exc: DatabaseError
    ) -> JSONResponse:
        logger.exception("Database error while handling request", exc_info=exc)
        payload = ApiErrorResponse(
            error=ApiErrorDetail(
                code="database_error",
                message="A database error occurred while processing the request.",
            )
        )
        return JSONResponse(
            status_code=500,
            content=payload.model_dump(mode="json", by_alias=True),
        )

    @application.exception_handler(sqlite3.Error)
    async def handle_sqlite_error(
        _: Request, exc: sqlite3.Error
    ) -> JSONResponse:
        logger.exception("SQLite error while handling request", exc_info=exc)
        payload = ApiErrorResponse(
            error=ApiErrorDetail(
                code="database_error",
                message="A database error occurred while processing the request.",
            )
        )
        return JSONResponse(
            status_code=500,
            content=payload.model_dump(mode="json", by_alias=True),
        )

    return application


app = create_app()


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)