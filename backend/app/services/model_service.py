
"""Model loading, readiness, artifact validation, and evaluation reporting."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from ..config import Settings
from ..schemas.health import ModelReadiness
from ..schemas.model import ArtifactStatus, ModelInfoResponse, ModelReportResponse

logger = logging.getLogger(__name__)

EXPECTED_CLASS_COUNT = 38
MODEL_FILENAME = "best_vistara_model.keras"
CLASSES_FILENAME = "classes.json"
EVALUATION_REPORT_FILENAME = "evaluation_report.json"

EXPECTED_ARTIFACTS = (
    MODEL_FILENAME,
    CLASSES_FILENAME,
    EVALUATION_REPORT_FILENAME,
)

UNLOADED_MESSAGE = "The trained model is not loaded. Check model artifacts and startup logs."


class ModelService:
    """Loads the trained Keras model once and exposes its metadata."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.artifacts_dir = Path(settings.model_artifacts_dir)
        self.model: Any | None = None
        self.class_names: list[str] = []
        self.load_error: str | None = None

    @property
    def is_loaded(self) -> bool:
        return (
            self.model is not None
            and len(self.class_names) == EXPECTED_CLASS_COUNT
        )

    def load_model(self) -> bool:
        """Load and validate the trained model and class mapping."""
        if self.is_loaded:
            return True

        self.model = None
        self.class_names = []
        self.load_error = None

        model_path = self.artifacts_dir / MODEL_FILENAME
        classes_path = self.artifacts_dir / CLASSES_FILENAME

        try:
            if not model_path.is_file():
                raise FileNotFoundError(f"Model not found: {model_path}")

            if not classes_path.is_file():
                raise FileNotFoundError(f"Classes file not found: {classes_path}")

            with classes_path.open("r", encoding="utf-8") as handle:
                mapping = json.load(handle)

            expected_keys = {str(i) for i in range(EXPECTED_CLASS_COUNT)}

            if not isinstance(mapping, dict) or set(mapping) != expected_keys:
                raise ValueError("classes.json must contain exactly keys 0 through 37.")

            class_names = [mapping[str(i)] for i in range(EXPECTED_CLASS_COUNT)]

            if not all(isinstance(name, str) and name.strip() for name in class_names):
                raise ValueError("Every class name must be a non-empty string.")

            import tensorflow as tf

            loaded_model = tf.keras.models.load_model(
                model_path,
                compile=False,
            )

            input_shape = loaded_model.input_shape
            output_shape = loaded_model.output_shape

            if isinstance(input_shape, list) or isinstance(output_shape, list):
                raise ValueError("Multiple model inputs or outputs are unsupported.")

            if tuple(input_shape[1:]) != (224, 224, 3):
                raise ValueError(f"Unexpected model input shape: {input_shape}")

            if output_shape[-1] != EXPECTED_CLASS_COUNT:
                raise ValueError(f"Unexpected model output shape: {output_shape}")

            self.model = loaded_model
            self.class_names = class_names

            logger.info("Loaded MobileNetV2 with %d classes.", len(class_names))
            return True

        except Exception as exc:
            self.model = None
            self.class_names = []
            self.load_error = str(exc)
            logger.exception("Failed to load Vistara AI model.")
            return False

    def _artifact_status(self) -> ArtifactStatus:
        directory = self.artifacts_dir

        found = (
            [name for name in EXPECTED_ARTIFACTS if (directory / name).is_file()]
            if directory.exists()
            else []
        )
        missing = [name for name in EXPECTED_ARTIFACTS if name not in found]

        return ArtifactStatus(
            directory=str(directory),
            expected_files=list(EXPECTED_ARTIFACTS),
            found_files=found,
            missing_files=missing,
            evaluation_report_present=EVALUATION_REPORT_FILENAME in found,
        )

    def get_readiness(self) -> ModelReadiness:
        if self.is_loaded:
            return ModelReadiness(
                status="loaded",
                loaded=True,
                version=self.settings.model_version,
                message="MobileNetV2 model loaded successfully.",
            )

        return ModelReadiness(
            status="unavailable" if self.load_error else "not_trained",
            loaded=False,
            version=self.settings.model_version,
            message=self.load_error or UNLOADED_MESSAGE,
        )

    def get_info(self) -> ModelInfoResponse:
        loaded = self.is_loaded

        return ModelInfoResponse(
            status="loaded" if loaded else (
                "unavailable" if self.load_error else "not_trained"
            ),
            loaded=loaded,
            version=self.settings.model_version,
            architecture="MobileNetV2",
            input_shape=[224, 224, 3],
            planned_class_count=EXPECTED_CLASS_COUNT,
            supported_classes=self.class_names if loaded else [],
            class_list_status="loaded" if loaded else "unavailable",
            artifacts=self._artifact_status(),
            message=(
                "MobileNetV2 model is ready for inference."
                if loaded
                else self.load_error or UNLOADED_MESSAGE
            ),
        )

    def get_report(self) -> ModelReportResponse:
        artifacts = self._artifact_status()
        report_path = self.artifacts_dir / EVALUATION_REPORT_FILENAME

        if not artifacts.evaluation_report_present:
            return ModelReportResponse(
                available=False,
                status="unavailable",
                generated_at=None,
                source=str(report_path),
                message="No evaluation report is present.",
                artifacts=artifacts,
                report=None,
            )

        try:
            with report_path.open("r", encoding="utf-8") as handle:
                payload: Any = json.load(handle)

            if not isinstance(payload, dict):
                raise ValueError("Evaluation report must be a JSON object.")

        except (OSError, json.JSONDecodeError, ValueError) as exc:
            logger.warning("Unable to read evaluation report: %s", exc)
            return ModelReportResponse(
                available=False,
                status="unavailable",
                generated_at=None,
                source=str(report_path),
                message=f"Evaluation report could not be read: {exc}",
                artifacts=artifacts,
                report=None,
            )

        return ModelReportResponse(
            available=True,
            status="available",
            generated_at=None,
            source=str(report_path),
            message="Evaluation report loaded from training artifacts.",
            artifacts=artifacts,
            report=payload,
        )
