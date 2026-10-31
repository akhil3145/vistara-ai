
"""Grad-CAM visualization service for MobileNetV2."""

from __future__ import annotations

import base64
import logging
from io import BytesIO

import numpy as np
import tensorflow as tf
from PIL import Image

logger = logging.getLogger(__name__)


class GradCAMService:
    """Generate Grad-CAM heatmap overlays for model predictions."""

    BACKBONE_NAME = "mobilenetv2_1.00_224"
    TARGET_LAYER_NAME = "out_relu"
    IMAGE_SIZE = (224, 224)

    @staticmethod
    def _jet_colormap(values: np.ndarray) -> np.ndarray:
        """Convert normalized heatmap values into RGB colors."""

        red = np.clip(1.5 - np.abs(4.0 * values - 3.0), 0, 1)
        green = np.clip(1.5 - np.abs(4.0 * values - 2.0), 0, 1)
        blue = np.clip(1.5 - np.abs(4.0 * values - 1.0), 0, 1)

        return (np.stack([red, green, blue], axis=-1) * 255).astype(
            np.uint8
        )

    def generate(
        self,
        model: tf.keras.Model,
        image_batch: np.ndarray,
        class_index: int,
        original_image: bytes,
    ) -> str | None:
        """
        Generate a base64 PNG Grad-CAM overlay.

        Returns None if visualization fails. Prediction inference
        should never depend on successful heatmap generation.
        """

        try:
            backbone = model.get_layer(self.BACKBONE_NAME)
            target_layer = backbone.get_layer(self.TARGET_LAYER_NAME)

            feature_extractor = tf.keras.Model(
                inputs=backbone.input,
                outputs=target_layer.output,
            )

            pooling_layer = model.get_layer(
                "global_average_pooling2d"
            )
            dropout_layer = model.get_layer("dropout")
            dense_layer = model.get_layer("dense")

            with tf.GradientTape() as tape:
                feature_maps = feature_extractor(
                    tf.convert_to_tensor(image_batch),
                    training=False,
                )

                pooled = pooling_layer(feature_maps)
                pooled = dropout_layer(pooled, training=False)

                # Calculate pre-softmax class logits.
                logits = tf.linalg.matmul(
                    pooled,
                    dense_layer.kernel,
                )

                if dense_layer.use_bias:
                    logits = tf.nn.bias_add(
                        logits,
                        dense_layer.bias,
                    )

                class_score = logits[:, class_index]

            gradients = tape.gradient(class_score, feature_maps)

            if gradients is None:
                raise RuntimeError("Could not calculate Grad-CAM gradients.")

            # Importance weights for each feature-map channel.
            weights = tf.reduce_mean(
                gradients,
                axis=(1, 2),
            )

            heatmap = tf.reduce_sum(
                feature_maps[0] * weights[0],
                axis=-1,
            )

            heatmap = tf.maximum(heatmap, 0)

            maximum = tf.reduce_max(heatmap)

            if float(maximum.numpy()) <= 0:
                raise RuntimeError("Grad-CAM produced an empty heatmap.")

            heatmap = heatmap / maximum
            heatmap = tf.image.resize(
                heatmap[..., tf.newaxis],
                self.IMAGE_SIZE,
                method="bilinear",
            )

            heatmap_array = np.squeeze(heatmap.numpy())
            heatmap_array = np.clip(heatmap_array, 0, 1)

            # Convert heatmap into an RGB image.
            colored_heatmap = self._jet_colormap(heatmap_array)
            heatmap_image = Image.fromarray(colored_heatmap)

            # Resize original image to match the heatmap.
            with Image.open(BytesIO(original_image)) as source:
                original = source.convert("RGB").resize(
                    self.IMAGE_SIZE,
                    Image.Resampling.BILINEAR,
                )

            # Overlay the heatmap on the original leaf image.
            overlay = Image.blend(
                original,
                heatmap_image,
                alpha=0.40,
            )

            buffer = BytesIO()
            overlay.save(buffer, format="PNG")

            encoded = base64.b64encode(
                buffer.getvalue()
            ).decode("utf-8")

            return f"data:image/png;base64,{encoded}"

        except Exception:
            logger.exception("Grad-CAM generation failed.")
            return None
