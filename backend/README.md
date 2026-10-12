# VANTA Signal OS — Backend Service

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2.0+-E92063?style=flat-square&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Adaption AI](https://img.shields.io/badge/Adaption-Official%20SDK-6366F1?style=flat-square)](https://docs.adaptionlabs.ai/)

Production-grade FastAPI service powering VANTA's customer intelligence, issue radar, deterministic prioritization, counterfactual scenario simulation, and Adaption AI adaptive data integration.

---

## 1. Quickstart

### Prerequisites
- Python 3.12+
- `pip` / `virtualenv`

### Installation & Execution

```powershell
# Navigate to the backend directory
cd backend

# Create and activate a clean virtual environment
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install core runtime and test dependencies
python -m pip install -r requirements-dev.txt

# Configure environment variables
copy .env.example .env

# Seed deterministic demonstration dataset
python -m app.seed

# Launch the FastAPI development server with auto-reload
uvicorn app.main:app --reload --port 8000
```

The interactive OpenAPI / Swagger documentation is automatically available at:
`http://127.0.0.1:8000/docs` (ReDoc is at `/redoc`).

---

## 2. Adaption AI Integration (Optional Cloud Extension)

VANTA includes native, first-class integration with the **Adaption Adaptive Data API**:

```powershell
# Install the official Adaption Python SDK
python -m pip install -r requirements-adaption.txt

# Configure your Adaption Cloud API key in your shell or .env
$env:ADAPTION_API_KEY = "your-live-adaption-api-key"
```

> [!NOTE]
> **Zero-Fabrication Guarantee**: If `ADAPTION_API_KEY` is not provided, the service runs in an honest, decoupled mode. All core features (ingestion, sentiment, clustering, prioritization, simulator) operate at 100% functionality. Calls to `/api/adaption/*` return a persisted, audit-logged `503 Service Unavailable` receipt without fabricating fake evaluation metrics or synthetic runs.

---

## 3. API Surface Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Service health status, version, and Adaption SDK readiness | No |
| `GET` | `/api/feedback` | List feedback with filtering by `sentiment`, `category`, and pagination | Optional |
| `POST` | `/api/feedback` | Create a single feedback record with immediate cluster re-indexing | Optional |
| `POST` | `/api/feedback/import` | Safe CSV bulk import (bounded by `MAX_CSV_BYTES` and `MAX_CSV_ROWS`) | Optional |
| `GET` | `/api/issues` | Retrieve semantic issue clusters ranked by 5-factor priority formula | Optional |
| `PATCH` | `/api/issues/{id}/status` | Update issue workflow status (`investigating`, `triaged`, `in_progress`, `resolved`) | Optional |
| `GET` | `/api/analysis/summary` | Aggregate customer intelligence summary (sentiment mix, NPS proxy, top issues) | Optional |
| `GET` | `/api/recommendations` | Evidence-backed recommendations with confidence rating & suggested actions | Optional |
| `POST` | `/api/scenarios/compare` | Deterministic counterfactual simulation comparing baseline vs. adjusted rank | Optional |
| `GET` | `/api/reports/export` | Export verified report artifacts in sanitized CSV or JSON format | Optional |
| `GET` | `/api/adaption/status` | Current Adaption SDK availability and provider connection state | Optional |
| `POST` | `/api/adaption/estimate` | Compute pre-flight credit cost and runtime estimation on Adaption Cloud | Optional |
| `POST` | `/api/adaption/run` | Execute adaptive fine-tuning run with column mapping and brand safety rules | Optional |
| `GET` | `/api/adaption/status/{id}` | Poll live execution state of a remote Adaption dataset run | Optional |

---

## 4. Configuration Matrix

All configuration parameters can be specified via `.env` or system environment variables:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DATABASE_PATH` | `data/vanta.sqlite3` | Filepath for the SQLite WAL-mode database |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated list of permitted web origins |
| `VANTA_API_KEY` | *(None)* | If set, all `/api/*` endpoints require matching `X-API-Key` |
| `MAX_CSV_BYTES` | `2097152` (2 MB) | Hard ceiling on uploaded CSV file size |
| `MAX_CSV_ROWS` | `10000` | Maximum rows permitted in a single CSV import job |
| `ADAPTION_API_KEY` | *(None)* | Official Adaption API key for Adaptive Data cloud execution |
| `ADAPTION_TIMEOUT_SECONDS` | `30` | Timeout threshold for remote Adaption HTTP requests |

---

## 5. Security & Data Integrity Controls

- **Formula Injection Neutralization**: All exported and imported CSV records sanitize characters (`=`, `+`, `-`, `@`, `\t`, `\r`) to protect spreadsheets against remote formula execution.
- **Strict Pydantic v2 Models**: Payloads with unexpected fields are rejected at the edge.
- **Row Clamping Safeguard**: When executing Adaption runs, `max_rows` is verified against the dataset's live cloud row count to prevent `HTTP 400 Bad Request` exceptions.
- **Safe Persistence**: SQLite connections enforce foreign key constraints and operate in Write-Ahead Logging (`WAL`) mode for concurrent reads.

---

## 6. Testing & Quality Verification

```powershell
# Run the complete test suite
.\.venv\Scripts\python.exe -m pytest -q

# Verify syntax and bytecode compilation
.\.venv\Scripts\python.exe -m compileall -q app tests
```
