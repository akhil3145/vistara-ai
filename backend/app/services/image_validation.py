
"""In-memory image upload validation.

Images are read, validated, and retained in memory for model inference.
Raw uploads are never written to disk or stored in SQLite.
"""

from __future__ import annotations

import io
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from ..config import Settings
from ..exceptions import ImageValidationError


ACCEPTED_MIME_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
ACCEPTED_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".webp"})
ACCEPTED_PIL_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})
READ_CHUNK_SIZE = 1024 * 1024


@dataclass(frozen=True)
class ValidatedImage:
    """Metadata and bytes for a validated in-memory upload."""

    data: bytes
    filename: str
    declared_mime_type: str
    image_format: str
    size_bytes: int
    width: int
    height: int


def _normalized_filename(upload: UploadFile) -> str:
    raw_name = Path(upload.filename or "upload").name.strip() or "upload"
    return raw_name[:255]


async def _read_limited(
    upload: UploadFile,
    max_bytes: int,
    filename: str,
) -> bytes:
    buffer = bytearray()

    while True:
        chunk = await upload.read(READ_CHUNK_SIZE)

        if not chunk:
            break

        buffer.extend(chunk)

        if len(buffer) > max_bytes:
            raise ImageValidationError(
                status_code=413,
                code="image_too_large",
                message=f"Image exceeds the {max_bytes} byte upload limit.",
                context={
                    "filename": filename,
                    "sizeBytes": len(buffer),
                },
            )

    return bytes(buffer)


async def validate_image_upload(
    upload: UploadFile,
    settings: Settings,
) -> ValidatedImage:
    """Validate an upload and retain its bytes for in-memory inference."""

    filename = _normalized_filename(upload)
    declared_mime = (upload.content_type or "").split(";")[0].strip().lower()
    extension = Path(filename).suffix.lower()

    # Validate file extension.
    if extension and extension not in ACCEPTED_EXTENSIONS:
        raise ImageValidationError(
            status_code=415,
            code="unsupported_image_extension",
            message="Unsupported file extension. Use JPEG, PNG, or WEBP.",
            context={"filename": filename},
        )

    # Validate declared MIME type.
    if declared_mime not in ACCEPTED_MIME_TYPES and not (
        declared_mime == "" and extension in ACCEPTED_EXTENSIONS
    ):
        raise ImageValidationError(
            status_code=415,
            code="unsupported_image_type",
            message="Unsupported media type. Use image/jpeg, image/png, or image/webp.",
            context={
                "filename": filename,
                "mimeType": declared_mime or None,
            },
        )

    # Read image bytes with an upload size limit.
    data = await _read_limited(
        upload,
        settings.max_upload_size_bytes,
        filename,
    )

    if not data:
        raise ImageValidationError(
            status_code=400,
            code="empty_file",
            message="The uploaded file is empty.",
            context={
                "filename": filename,
                "sizeBytes": 0,
            },
        )

    # Verify image integrity and extract metadata.
    try:
        with Image.open(io.BytesIO(data)) as probe:
            probe.verify()

        with Image.open(io.BytesIO(data)) as image:
            image_format = (image.format or "").upper()
            width, height = image.size

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
    ) as exc:
        raise ImageValidationError(
            status_code=400,
            code="invalid_image_content",
            message="The uploaded file could not be decoded as a valid image.",
            context={
                "filename": filename,
                "sizeBytes": len(data),
            },
        ) from exc

    # Validate the actual decoded image format.
    if image_format not in ACCEPTED_PIL_FORMATS:
        raise ImageValidationError(
            status_code=415,
            code="unsupported_image_format",
            message="Decoded image format is not supported.",
            context={
                "filename": filename,
                "imageFormat": image_format or None,
            },
        )

    # Return validated metadata together with the original image bytes.
    return ValidatedImage(
        data=data,
        filename=filename,
        declared_mime_type=declared_mime or f"image/{image_format.lower()}",
        image_format=image_format,
        size_bytes=len(data),
        width=width,
        height=height,
    )
