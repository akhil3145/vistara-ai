"""Shared pytest fixtures. Every test uses a temporary SQLite database."""

from __future__ import annotations

import io
import sqlite3
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import Settings
from app.main import create_app


def make_image_bytes(
    color: tuple[int, int, int] = (34, 139, 34), image_format: str = "PNG"
) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (16, 16), color).save(buffer, format=image_format)
    return buffer.getvalue()


@pytest.fixture()
def settings(tmp_path: Path) -> Settings:
    return Settings(
        environment="test",
        database_path=tmp_path / "vistara_test.db",
        model_artifacts_dir=tmp_path / "model_artifacts",
        max_upload_size_bytes=10 * 1024 * 1024,
        max_batch_files=3,
        cors_origins=["http://localhost:5173"],
    )


@pytest.fixture()
def client(settings: Settings) -> Iterator[TestClient]:
    application = create_app(settings)
    with TestClient(application) as test_client:
        yield test_client


@pytest.fixture()
def db_connection(settings: Settings) -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(settings.database_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()
