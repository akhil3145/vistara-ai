# Vistara AI: Project Context & Master Specification

**Product Description:** Plant Health Intelligence Platform  
**Academic Project Title:** Plant Disease Detection from Leaf Images Using Deep Learning  
**Degree & Specialization:** B.Tech Computer Science and Engineering (Data Science and Artificial Intelligence)  
**Subject:** Deep Learning  
**Working Title:** Vistara AI (do not alter without explicit approval)

---

## 1. Executive Summary & Problem Statement

Plant diseases significantly impact agricultural yield, food security, and crop quality. Visual identification of foliar symptoms typically demands specialized agronomic expertise, and early-stage or comorbid symptoms can be visually ambiguous. 

**Vistara AI** is an image-based preliminary screening and decision-support platform designed to classify visible plant leaf patterns using deep learning computer vision techniques.

### Operational Boundaries & Disclaimers
* **Educational and Preliminary Screening Only:** Vistara AI provides automated preliminary visual screening and decision support. It is strictly **not** a replacement for qualified agronomists, phytopathologists, or formal agricultural diagnostic laboratories.
* **Non-Calibrated Output Clarification:** Model softmax output scores represent class distribution scores under the closed-set assumption of training, **not** guaranteed calibrated probabilities of ground-truth correctness.
* **Controlled vs. In-Field Generalization Limitation:** The primary training benchmark (PlantVillage) features laboratory-style controlled backgrounds. Predictions on real-world in-field leaf images with complex backgrounds, direct sunlight, occlusion, or novel foliage may suffer from domain shift. This limitation must be explicitly documented and conveyed in user interfaces.

---

## 2. Machine Learning Specifications

### 2.1 Dataset Strategy
* **Primary Proposed Source:** PlantVillage dataset (literature baseline: ~54,300 images across 38 crop-disease/healthy classes).
* **Data Verification Protocol:** All class counts, label conventions, image resolutions, and distribution figures must be verified empirically against the exact dataset release downloaded. Figures must never be assumed.
* **License & Ethical Inspection:** Verify license terms and usage constraints prior to training.
* **Data Leakage & Duplicate Defense:** Detect and isolate exact duplicates and near-duplicates before partitioning into training, validation, and test sets.
* **Split Proportions:** Stratified split: **70% Training, 15% Validation, 15% Held-Out Test**.

### 2.2 Model Architecture & Training Workflow
1. **Target Architecture:** MobileNetV2 utilizing transfer learning with ImageNet pre-trained weights, optimized for low-latency edge/server inference. Optional small CNN baseline for ablation if compute permits.
2. **Input Dimensions:** 224 x 224 RGB.
3. **Preprocessing Pipeline:** Architecture-specific preprocessing (`tf.keras.applications.mobilenet_v2.preprocess_input`).
4. **Data Augmentation:** Apply strictly to the training partition (rotations, flips, zoom, subtle illumination shifts); never augment validation or test sets.
5. **Execution Environment:** Training and heavy evaluation must be executed in **Google Colab** to preserve local disk space and compute resources. No large datasets (>100MB) or heavy model checkpoints are to be downloaded locally without user consent.
6. **Artifact Packaging:** Model checkpoints (`.keras`), class-to-index mapping (`classes.json`), preprocessing config (`preprocess_config.json`), metadata (`model_metadata.json`), and evaluation metrics (`evaluation_report.json`) must be saved together as a reproducible bundle.

### 2.3 Evaluation Standards
Evaluation must be performed **once** on the held-out test split and must report:
* Overall Accuracy.
* Per-Class Precision, Recall, and F1-Score.
* Macro-Averaged and Weighted-Averaged F1-Scores.
* Multi-Class Confusion Matrix (normalized and raw).
* Training vs. Validation Loss and Accuracy Curves.
* Inference Latency (benchmarked under documented CPU/GPU conditions across batch sizes 1 and 8).

### 2.4 Explainability (XAI)
* **Grad-CAM (Gradient-weighted Class Activation Mapping):** Target the final convolutional feature extraction layer (e.g., `Conv_1` or top bottleneck layer of MobileNetV2) to generate visual heatmaps.
* **Interpretability Disclaimer:** Heatmaps highlight spatial regions that most strongly influenced model activation; they do **not** constitute biological proof of causal pathology.

---

## 3. Dashboard UI/UX Specification (GeoVision Adaptation)

Adapted from the computer-vision satellite dashboard paradigm (`geovision-landuse-dl`) to precision plant pathology with custom visual identity and responsive layouts.

### 3.1 Design Tokens & Aesthetic System
* **Theme:** Professional, compact, dark-first AI analytics console.
* **Color Palette:**
  * Background: Deep Navy (`#0A0F1D` / `#0D1527`)
  * Sidebar & Panels: Elevated Navy (`#131D35` / `#182442`)
  * Borders: Subtle Blue-Gray (`#233354`)
  * Headings: Crisp White (`#F8FAFC`)
  * Secondary / Muted Text: Slate Blue-Gray (`#94A3B8`)
  * Accents: Restrained Turquoise/Teal (`#0EA5E9` / `#14B8A6` / `#10B981`) for active navigation, confidence indicators, progress bars, and status pills.
* **Typography:** Clean, high-legibility sans-serif (`Inter` or system sans-serif font stack).
* **Theme Toggle:** Functional Dark/Light theme mode with consistent contrast and token mapping.
* **Aesthetic Boundaries:** No excessive gradients, no heavy glassmorphism, no marketing hero banners, no non-functional placeholder controls.

### 3.2 Navigation Hierarchy
Persistent desktop sidebar with mobile drawer:
1. **Overview:** Operational command center with model readiness status, supported classes tally, test metrics preview, quick links, and request history overview.
2. **Disease Scanner:** Single-image drag-and-drop diagnostic interface with sample gallery, inference metrics, top-k probabilities, and Grad-CAM overlay viewer.
3. **Batch Analysis:** Multi-image queue processing with tabular summaries, uncertainty threshold filtering, class distribution charts, and CSV report export.
4. **Monitoring:** Real-time request volume, latency telemetry (p50, p95), predicted class distribution, confidence tracking over time, and statistical data-drift alerts.
5. **Model Report:** Offline held-out test performance, macro-F1, confusion matrix, per-class metrics table, loss/accuracy curves, and dataset split details.
6. **Disease Library:** Curated, evidence-based reference catalog for supported crop-disease classes with verified symptoms and biological context.
7. **Help / About:** Platform methodology, system limitations, disclaimers, dataset provenance, and inference interpretation guide.

### 3.3 Screen Specifications
* **Screen A: Single-Image Disease Scanner**
  * Drag-and-drop leaf upload with client-side file-type (`image/jpeg`, `image/png`, `image/webp`) and size (<= 10MB) enforcement.
  * Curated sample leaf gallery from actual supported classes.
  * Side-by-side comparison of original leaf vs. Grad-CAM activation heatmap with opacity slider.
  * Circular confidence gauge and horizontal top-5 probability breakdown bars.
  * Inference latency indicator (ms) and model version badge.
  * Structured JSON result copy and heatmap image download actions.
  * Robust state handling: idle/empty, uploading, analyzing, success, unsupported image, and server error states.

* **Screen B: Batch Classification**
  * Multi-image dropzone with queue thumbnail strip and individual discard actions.
  * Batch inference engine with progress bar.
  * KPI summary cards: Total Processed, Mean Confidence, Needing Review (low confidence), Most Frequent Prediction.
  * Sortable, filterable tabular view with thumbnail, filename, prediction, confidence score, review badge, and raw latency.
  * Configurable uncertainty threshold (e.g. `< 70%` triggers "Needs Review" flag).
  * Predicted class frequency bar chart and one-click CSV export.

* **Screen C: Operational Monitoring**
  * Live metrics: Total Inferences, Mean Confidence, p95 Latency, Ground-Truth Accuracy (only when ground truth is uploaded/verified; strictly no fabricated accuracy).
  * Population drift monitoring comparing prediction distribution against baseline training class distribution.
  * Statistical divergence summary (e.g., PSI or KS-test summary).
  * Recent prediction telemetry log.

* **Screen D: Model Evaluation Report**
  * Model architecture metadata (parameters, input shape, base weights).
  * Comprehensive test set performance metrics (Accuracy, Macro-F1, Weighted-F1, Macro-Precision, Macro-Recall).
  * Interactive confusion matrix viewer.
  * Per-class performance breakdown table (Precision, Recall, F1, Support) with search and sorting.
  * Training vs. validation learning curves.
  * Clearly marked demo/placeholder indicators if evaluation artifacts are pending.

---

## 4. Technical Architecture & Technology Stack

### 4.1 Frontend
* **Core:** React 19 / TypeScript 5+ / Vite
* **Styling & Components:** Tailwind CSS, shadcn/ui component patterns, Lucide React icons
* **Data Visualization:** Recharts for telemetry, distribution charts, and metric visualizations
* **Architecture:** Modular, component-driven, strong typing via TypeScript interfaces, isolated API service layer.

### 4.2 Backend & Machine Learning Serving
* **Framework:** Python 3.12+ / FastAPI
* **Validation & Schemas:** Pydantic v2 for typed request/response validation
* **Inference Engine:** TensorFlow / Keras (`.keras` format). Do not introduce ONNX or TFLite conversion until a working `.keras` model exists and a demonstrated need arises.
* **Explainability:** Grad-CAM implemented via TensorFlow gradient computation, directly compatible with the `.keras` model.
* **Image Processing:** Pillow (PIL), NumPy, OpenCV-Python (for Grad-CAM rendering).
* **Persistence:** Local SQLite database utilizing Python's standard library `sqlite3` (no heavy ORM unless future complexity explicitly justifies it) for request telemetry, inference logs, and batch records.
* **Curated Sample Assets:** A lightweight collection of approximately 8–12 verified leaf images across key supported healthy and diseased classes for local UI preview/gallery, with verified licensing and strict isolation from bulk dataset downloads.

### 4.3 Candidate API Contracts
* `GET /api/v1/health` - Service health, model readiness, and memory footprint.
* `GET /api/v1/model/info` - Model architecture, version, input dimensions, and supported class list.
* `POST /api/v1/predict` - Single image classification (multipart form-data) returning top-k predictions, latency, and base64-encoded Grad-CAM heatmap.
* `POST /api/v1/predict/batch` - Multi-image batch inference returning structured array of predictions and aggregate statistics.
* `GET /api/v1/model/report` - Evaluation metrics, confusion matrix data, and validation curves loaded from verified test artifacts.
* `GET /api/v1/monitoring/metrics` - Aggregated inference telemetry, drift statistics, and confidence distributions.

---

## 5. Development Principles & Academic Rigor

1. **Anti-Hallucination & Metric Integrity:** Never fabricate or mock metrics without clear visual labels indicating "DEMO / SIMULATED DATA".
2. **Incremental Engineering:** Develop step-by-step; verify builds, types, and functionality at each step before moving forward.
3. **Resource Sensitivity:** Maintain low local disk footprint; offload heavy dataset processing and training to Google Colab.
4. **Resilient Error Handling:** Graceful degradation on network timeout, invalid file formats, out-of-distribution inputs, and server failures.
5. **Clean Code & Reproducibility:** Preserve comments, structure components cleanly, avoid monolithic multi-thousand-line files, and enforce strict type boundaries.

