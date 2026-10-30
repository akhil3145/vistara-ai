"""Model readiness and evaluation artifact reporting.

No model is loaded in Phase 4. This service reports that honestly and only
surfaces artifacts that actually exist on disk.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from ..config import Settings
from ..schemas.health import ModelReadiness
from ..schemas.model import ArtifactStatus, ModelInfoResponse, ModelReportResponse

logger = logging.getLogger(__name__)

PLANNED_CLASS_COUNT = 38
EXPECTED_ARTIFACTS = (
    "model_checkpoint.keras",
    "classes.json",
    "preprocess_config.json",
    "model_metadata.json",
    "evaluation_report.json",
)
EVALUATION_REPORT_FILENAME = "evaluation_report.json"
UNLOADED_MESSAGE = (
    "No trained model is loaded. Real inference will be added in Phase 6 after "
    "training in Google Colab. No predictions are produced or simulated here."
)


class ModelService:
    """Reports model and artifact status without loading TensorFlow."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.artifacts_dir = Path(settings.model_artifacts_dir)

    def _artifact_status(self) -> ArtifactStatus:
        directory = self.artifacts_dir
        if directory.exists():
            found = [name for name in EXPECTED_ARTIFACTS if (directory / name).is_file()]
        else:
            found = []
        missing = [name for name in EXPECTED_ARTIFACTS if name not in found]
        return ArtifactStatus(
            directory=str(directory),
            expected_files=list(EXPECTED_ARTIFACTS),
            found_files=found,
            missing_files=missing,
            evaluation_report_present=EVALUATION_REPORT_FILENAME in found,
        )

    def get_readiness(self) -> ModelReadiness:
        return ModelReadiness(
            status="not_trained",
            loaded=False,
            version=self.settings.model_version,
            message=UNLOADED_MESSAGE,
        )

    def get_info(self) -> ModelInfoResponse:
        return ModelInfoResponse(
            status="not_trained",
            loaded=False,
            version=self.settings.model_version,
            architecture="MobileNetV2 (planned; not loaded)",
            input_shape=[224, 224, 3],
            planned_class_count=PLANNED_CLASS_COUNT,
            supported_classes=[],
            class_list_status="unavailable",
            artifacts=self._artifact_status(),
            message=UNLOADED_MESSAGE,
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
                message=(
                    "No verified evaluation_report.json is present. Held-out test "
                    "metrics, per-class values, confusion matrices, and learning "
                    "curves are intentionally empty."
                ),
                artifacts=artifacts,
                report=None,
            )

        try:
            with report_path.open("r", encoding="utf-8") as handle:
                payload: Any = json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Unable to read evaluation report %s: %s", report_path, exc)
            return ModelReportResponse(
                available=False,
                status="unavailable",
                generated_at=None,
                source=str(report_path),
                message=(
                    "An evaluation report file exists but could not be parsed. "
                    "No metric values are returned until the artifact is valid."
                ),
                artifacts=artifacts,
                report=None,
            )

        if not isinstance(payload, dict):
            return ModelReportResponse(
                available=False,
                status="unavailable",
                generated_at=None,
                source=str(report_path),
                message=(
                    "The evaluation report is not a JSON object and cannot be "
                    "served as structured metrics."
                ),
                artifacts=artifacts,
                report=None,
            )

        return ModelReportResponse(
            available=True,
            status="available",
            generated_at=None,
            source=str(report_path),
            message=(
                "Verified evaluation_report.json loaded from the artifact "
                "directory. Values are returned exactly as exported."
            ),
            artifacts=artifacts,
            report=payload,
        )
