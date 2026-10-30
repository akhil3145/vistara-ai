"""Application-level exceptions with safe HTTP mappings."""

from __future__ import annotations

from typing import Any


class AppError(Exception):
    """Base class for expected, client-facing application errors."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        context: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.context = context


class ImageValidationError(AppError):
    """Raised when an uploaded image fails format or size validation."""


class BatchValidationError(AppError):
    """Raised when a batch request itself is invalid (for example, too large)."""
