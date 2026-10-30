"""Environment-based application settings.

All values can be overridden with environment variables using the
``VISTARA_`` prefix (for example ``VISTARA_DATABASE_PATH``). A local
``.env`` file is also read when present.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime configuration for the Vistara AI backend."""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_prefix="VISTARA_",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Vistara AI Backend"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False

    api_v1_prefix: str = "/api/v1"

    database_path: Path = Field(default=BACKEND_DIR / "data" / "vistara.db")
    database_busy_timeout_seconds: float = 5.0

    model_artifacts_dir: Path = Field(default=BACKEND_DIR / "model_artifacts")
    model_version: str | None = None

    max_upload_size_bytes: int = Field(default=10 * 1024 * 1024, gt=0)
    max_batch_files: int = Field(default=24, gt=0)

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: Any) -> Any:
        """Allow comma-separated origin lists in environment variables."""
        if isinstance(value, str) and not value.strip().startswith("["):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("database_path", "model_artifacts_dir", mode="after")
    @classmethod
    def _resolve_relative_path(cls, value: Path) -> Path:
        """Resolve relative paths against the backend directory."""
        if value.is_absolute():
            return value
        return (BACKEND_DIR / value).resolve()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()
