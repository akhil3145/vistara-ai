# Vistara AI Backend (Phase 4)

FastAPI backend and SQLite telemetry layer for the Vistara AI plant-health
screening platform.

**Phase 4 scope:** service foundation, typed API contracts, SQLite persistence,
honest model-unavailable responses, and tests. No model is trained or loaded.
No TensorFlow, PyTorch, Grad-CAM, dataset download, or fabricated metric is part
of this phase. Real inference is planned for Phase 6 after training in Google
Colab.

## Stack

- Python 3.12+
- FastAPI + Pydantic v2
- Python standard-library `sqlite3` (no ORM)
- Pillow for in-memory image validation
- Pytest + HTTPX for tests

## Layout

```
backend/
  app/
    api/v1/routes/       HTTP route handlers (thin)
    schemas/             Pydantic v2 request/response models (camelCase JSON)
    repositories/        Parameterized SQLite queries
    services/            Business logic, model readiness, telemetry aggregation
    config.py            Environment-based settings
    database.py          Connection management and schema initialization
    exceptions.py        Typed application errors
    main.py              Application factory and exception handlers
  tests/                 Pytest suite using temporary databases
  requirements.txt       Runtime dependencies
  requirements-dev.txt   Runtime plus test dependencies
  .env.example           Configuration template
```

## Setup

From the `backend/` directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

Run the API:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>

The SQLite database is created automatically on startup. By default it lives at
`backend/data/vistara.db`, which is ignored by Git.

## Configuration

Environment variables use the `VISTARA_` prefix. A `.env` file in `backend/` is
loaded automatically.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VISTARA_ENVIRONMENT` | `development` | Environment label returned by health |
| `VISTARA_DEBUG` | `false` | Enables debug logging |
| `VISTARA_DATABASE_PATH` | `data/vistara.db` | SQLite file path |
| `VISTARA_DATABASE_BUSY_TIMEOUT_SECONDS` | `5.0` | SQLite busy timeout |
| `VISTARA_MODEL_ARTIFACTS_DIR` | `model_artifacts` | Expected `.keras` artifact bundle directory |
| `VISTARA_MODEL_VERSION` | unset | Reported model version when a model is integrated |
| `VISTARA_MAX_UPLOAD_SIZE_BYTES` | `10485760` (10 MB) | Per-image upload limit |
| `VISTARA_MAX_BATCH_FILES` | `24` | Batch request file limit |
| `VISTARA_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |

Relative paths resolve against the `backend/` directory.

## Endpoints

All routes are versioned under `/api/v1`.

| Method | Path | Behavior in Phase 4 |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Backend, database, schema version, and model readiness |
| `GET` | `/api/v1/model/info` | Explicit `not_trained` status and planned architecture |
| `POST` | `/api/v1/predict` | Validates one image, logs telemetry, returns `503 model_unavailable` |
| `POST` | `/api/v1/predict/batch` | Validates many images, logs a batch job, returns `503 model_unavailable` |
| `GET` | `/api/v1/model/report` | Honest empty state unless `evaluation_report.json` exists |
| `GET` | `/api/v1/monitoring/metrics` | Real aggregates from SQLite; empty/null when no evidence exists |

### Status codes

- `200` – health, model info, model report, monitoring
- `400` – empty/corrupt image, invalid batch, or all batch files rejected
- `413` – image exceeds the configured size limit
- `415` – unsupported image type, extension, or decoded format
- `422` – FastAPI request-shape validation (for example, missing file field)
- `503` – the model is not loaded; no prediction was produced

### Example requests

```powershell
curl.exe http://127.0.0.1:8000/api/v1/health
curl.exe http://127.0.0.1:8000/api/v1/model/info
curl.exe -X POST http://127.0.0.1:8000/api/v1/predict -F "file=@C:\path\to\leaf.jpg;type=image/jpeg"
curl.exe -X POST http://127.0.0.1:8000/api/v1/predict/batch -F "files=@C:\path\to\leaf1.jpg;type=image/jpeg" -F "files=@C:\path\to\leaf2.png;type=image/png"
curl.exe http://127.0.0.1:8000/api/v1/model/report
curl.exe http://127.0.0.1:8000/api/v1/monitoring/metrics
```

`elapsedMs` on the prediction response is total request-handling time. It is
not model inference latency, and no inference latency is recorded in Phase 4.

Example model-unavailable response (`HTTP 503`):

```json
{
  "status": "model_unavailable",
  "message": "The model is unavailable, so no prediction was produced. ...",
  "modelVersion": null,
  "isDemo": false,
  "requestId": "d41ae15baf0c42b8b0e82ddd6881e672",
  "filename": "leaf.png",
  "elapsedMs": 0.27,
  "predictions": [],
  "logged": true
}
```

## Upload validation and privacy

- Accepted declared types: `image/jpeg`, `image/png`, `image/webp`.
- Accepted extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Files are read in bounded chunks and verified with Pillow.
- Raw uploads are processed in memory and **never persisted** to disk or SQLite.
- Only metadata (filename, declared MIME type, byte size, decoded format,
  outcome) is stored in telemetry.

## SQLite schema

Created automatically with schema version `1` (`PRAGMA user_version`).

- `prediction_logs` – single and per-file batch attempts, including rejections.
  Stores outcome, error code, model version, and optional prediction fields.
  In Phase 4, `predicted_class_id`, `top_score`, and inference `latency_ms`
  remain `NULL` because no model output exists.
- `batch_jobs` – one row per batch request with counts and final status.
- `drift_baseline` – reserved for verified baseline class shares; empty by
  default. No drift value is computed or claimed in Phase 4.

Indexes cover timestamps, statuses, predicted class, request IDs, and batch
relationships. All queries use parameters; no user value is interpolated into
SQL.

## Monitoring semantics

- `status: "empty"` – no telemetry rows.
- `status: "partial"` – requests exist but no successful predictions (the
  current Phase 4 state once requests arrive).
- `status: "available"` – successful predictions with real scores exist.
- Latency percentiles, mean scores, class distribution, and confidence trend
  are derived only from stored inference values. They stay `null`/empty when
  those values do not exist.
- Drift is reported as unavailable until a verified baseline and real
  predictions exist, and PSI/KS computation is implemented.
- Ground-truth accuracy is intentionally omitted.

## Tests

Run from `backend/`:

```powershell
python -m pytest
```

The suite uses `tmp_path` databases and never touches the development database.
Coverage includes health, schema initialization, single prediction logging,
batch job logging, model-unavailable responses, invalid/oversized uploads,
model empty states, and monitoring empty states.

## Incomplete by design

- No trained model, inference engine, Grad-CAM, accuracy, latency benchmark, or
  drift statistic exists yet.
- `GET /api/v1/model/info` returns an empty `supportedClasses` list until a real
  `classes.json` artifact is loaded; only the planned class count is reported.
- `POST /api/v1/predict` and `/predict/batch` always return model-unavailable
  responses because no model is loaded.
- The existing frontend still uses its deterministic demo data and is not wired
  to this API during Phase 4.

Real inference, artifact loading, Grad-CAM, and frontend integration are
scheduled for later phases after Colab training produces a verified `.keras`
bundle and evaluation report.
