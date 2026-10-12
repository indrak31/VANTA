# VANTA Signal OS — System Architecture

VANTA transforms multi-channel customer feedback into deterministic clusters, evidence-backed issue priorities, counterfactual simulations, and continuous fine-tuning pipelines.

## 1. End-to-End Request Flow

```text
Multi-Channel Ingestion (CSV / Manual / API / Webhook)
                       │
                       ▼
        FastAPI Input Validation & Sanitization
                       │
                       ▼
          SQLite Persistence (WAL Mode)
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
Deterministic Analysis Engine   Adaption Cloud Adapter
  ├─ Sentiment Scoring (VADER)    ├─ Pre-flight Cost/Time Estimation
  ├─ Semantic Grouping            ├─ Task-Specific Column Mapping
  ├─ 5-Factor Priority Matrix     ├─ Blueprint & Brand Controls
  ├─ Recommendation Generator     └─ Official Python SDK Execution
  └─ Counterfactual Simulator
```

## 2. Core Data Boundaries

- **`feedback`**: Raw customer verbatim, numerical ratings, channel origin, sentiment label/score, and ISO-8601 timestamps.
- **`issues`**: Reproducible clusters, computed priority scores, and constituent factor breakdowns.
- **`issue_feedback`**: Strict relational provenance mapping clusters to exact customer quotes.
- **`adaption_runs`**: Persisted audit trail storing operation type, remote dataset ID, provider run ID, status, recipe settings, and raw provider receipts.
- **`localStorage`**: Client-side convenience persistence for bookmarked issues and counterfactual scenario presets (`ifn-saved-issues`, `ifn-saved-scenarios`).

## 3. Deterministic Priority Matrix

Every issue cluster is ranked using an explainable, auditable 0–100 formula:

```text
Score = 100 × (
    0.25 × Volume
  + 0.30 × Negative_Rate
  + 0.20 × Rating_Risk
  + 0.20 × Sentiment_Risk
  + 0.05 × Recency
)
```

Each metric is strictly normalized to `[0, 1]`. The API returns the granular `priority_breakdown` with each issue so that product leaders and engineers can audit why an issue was prioritized over another.

## 4. Security, Reliability & Provenance

- **Formula Injection Defense**: CSV imports and exports neutralize prefix triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) to eliminate spreadsheet injection risks.
- **Bounded Ingestion**: Enforces hard caps via `MAX_CSV_BYTES` (default 2 MB) and `MAX_CSV_ROWS` (default 10,000) to protect backend memory.
- **Strict Pydantic Validation**: All incoming payloads undergo schema validation; unexpected fields are rejected.
- **Server-Side Credential Isolation**: `ADAPTION_API_KEY` is strictly held on the backend server and never leaked or exposed to client-side bundles.
- **API Guarding**: When `VANTA_API_KEY` (or legacy `INSIGHTFLOW_API_KEY`) is set, all `/api/*` endpoints require authentication via the `X-API-Key` header.
- **Zero-Fabrication Principle**: Adaption runs require a real provider response and API key. If unconfigured or failed, VANTA returns an honest, persisted HTTP 503 error receipt without inventing artificial metrics.
