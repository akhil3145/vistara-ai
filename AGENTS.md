# AGENTS.md — Directives for Vistara AI Development

This file provides persistent, non-negotiable operational rules for all AI agents and engineers working on the **Vistara AI** platform.

---

## 1. Core Operating Philosophy
1. **Incremental Engineering Only:** Never attempt to scaffold, build, or refactor entire applications or multiple system layers in a single pass. Work in distinct, testable increments with user approval at each phase boundary.
2. **Inspect Before Modifying:** Always inspect existing code, directory structures, and environment tools before proposing or executing edits. Never assume file contents or directory states.
3. **Preserve Existing Work:** Never overwrite, clobber, or delete working components, utility functions, or documentation comments without explicit approval and stated rationale.
4. **Validation and Verification:** Every change must be validated against relevant type-checks, linters, tests, or build commands (`tsc --noEmit`, `pytest`, etc.). Never claim a test passed without running it.

---

## 2. Academic and Data Integrity Rules
1. **Zero Synthetic / Fabricated Metrics:** Never fabricate accuracy numbers, confusion matrices, latency timings, or drift reports.
2. **Explicit Demo Demarcation:** If the backend or model is offline, mock demonstration states may be used only if they are visually and explicitly badged as `DEMO DATA`. Real mode must strictly reflect authentic database telemetry and model outputs.
3. **Probabilistic and Diagnostic Honesty:** Softmax outputs are class scores under closed-set conditions, not calibrated probabilities. Grad-CAM heatmaps represent feature activation zones, not biological proof. The platform is an educational and preliminary decision-support tool, not an agricultural diagnostic authority.

---

## 3. Resource & Environmental Constraints
1. **Local Storage Conservation:** Local machine resources are limited. 
   - Never download large datasets (e.g., full PlantVillage archive) or bulk images to the local workstation.
   - All dataset exploration, preprocessing pipelines, model training, and heavy evaluation occur in **Google Colab**.
   - Curate only 8–12 lightweight sample images locally for testing and UI demonstration.
2. **Prior Approval for Heavy Operations:** Explicit user approval is strictly required before:
   - Downloading large binary files or model weights (>50MB).
   - Performing destructive file-system operations (`rm -rf`, dropping tables, git resets).
   - Introducing new third-party dependencies or ORMs.

---

## 4. Architectural Boundaries
1. **Frontend:** React + TypeScript + Vite + Tailwind CSS. Component-driven, strong typing, no monolithic files, no fake/dead UI controls.
2. **Backend:** Python 3.12+ + FastAPI + Pydantic v2. Clean RESTful boundaries, explicit error handling, ephemeral image processing (do not persist raw uploaded images unless explicitly tasked).
3. **Model Format:** TensorFlow/Keras `.keras` bundle. Keep Grad-CAM pipeline compatible with `.keras`. No ONNX or TFLite conversions without demonstrated need.
4. **Database:** Python standard library `sqlite3` for query logging, batch results, and telemetry. No heavy ORMs until query complexity genuinely warrants it.

