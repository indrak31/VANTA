# InsightFlow Nexus backend

Production-minded FastAPI service for feedback intelligence. It uses SQLite, Pydantic v2, deterministic local sentiment/issue analysis, and an optional official Adaption SDK adapter.

## Run

Python 3.12 is the target runtime.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
copy .env.example .env
python -m app.seed
uvicorn app.main:app --reload
```

The OpenAPI document is available at `http://127.0.0.1:8000/docs`. Use `DATABASE_PATH` to point at a different SQLite file. The service creates its parent directory and enables foreign keys/WAL mode.

Optional Adaption support is isolated from the core service:

```powershell
python -m pip install -r requirements-adaption.txt
$env:ADAPTION_API_KEY = "your-real-key"
```

`POST /api/adaption/estimate` and `POST /api/adaption/run` call the official `adaption` SDK lazily. `GET /api/adaption/status/{run_id}` refreshes an in-progress provider run when a provider run id is available. Without both the SDK and `ADAPTION_API_KEY`, the endpoints persist an `unavailable` history record and return HTTP 503 with a configuration error; no provider metrics or successful result is fabricated.

## API surface

- `POST/GET/PATCH/DELETE /api/feedback` — feedback CRUD.
- `POST /api/feedback/import` — UTF-8 CSV import (`text` required; optional `rating`, `category`, `source`, `created_at`, `metadata`). Formula-like cells are rejected, and imports are bounded by `MAX_CSV_BYTES`/`MAX_CSV_ROWS`.
- `GET /api/issues`, `PATCH /api/issues/{id}/status` — deterministic clusters, explainable 0–100 priority scores, and status workflow.
- `GET /api/analysis/summary`, `GET /api/recommendations` — aggregate insight and action suggestions.
- `POST /api/scenarios/compare` — deterministic, transparent baseline-vs-alternative scoring.
- `GET /api/reports/feedback.csv`, `GET /api/reports/summary.json`, `GET /api/reports/export?format=csv|json` — report exports. CSV output neutralizes formula prefixes.
- `GET /health` and `GET /api/adaption/status` — service/integration readiness.

If `INSIGHTFLOW_API_KEY` is set, `/api/*` routes require the same value in `X-API-Key`.

## Checks

```powershell
python -m pytest -q
python -m compileall app
```
