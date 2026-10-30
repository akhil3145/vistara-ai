"""Shared Pydantic v2 base models.

Field names are declared in snake_case internally but serialized as
camelCase to match the TypeScript interfaces already used by the frontend.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model with camelCase JSON aliases and dot-access support."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class ApiErrorDetail(CamelModel):
    code: str
    message: str


class ApiErrorResponse(CamelModel):
    status: str = "error"
    error: ApiErrorDetail
    context: dict[str, Any] | None = None
