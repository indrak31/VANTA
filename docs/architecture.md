# InsightFlow Nexus architecture

## Request flow

```text
CSV/manual feedback
        |
        v
FastAPI validation -> SQLite feedback table -> deterministic analysis refresh
                                                  |
                                                  +--> issue clusters + memberships
                                                  +--> priority breakdown
                                                  +--> recommendations
                                                  +--> report exports

Adaption Lab -> backend adapter -> adaption.Adaption.datasets.adapt -> provider receipt
                                      |
                                      +--> datasets.get_status polling
                                      +--> persisted run history
```

## Data boundaries

- `feedback` stores raw customer language, ratings, source, sentiment label/score, and timestamps.
- `issues` stores reproducible clusters and priority components.
- `issue_feedback` stores provenance links between clusters and source records.
- `adaption_runs` stores the operation, dataset ID, provider run ID, status, request metadata, response, and error details.
- Browser `localStorage` stores only saved issue IDs and scenario presets; it is not the system of record.

## Priority formula

The backend records the exact breakdown for each cluster:

```text
100 * (
  0.25 * volume
  + 0.30 * negative_rate
  + 0.20 * rating_risk
  + 0.20 * sentiment_risk
  + 0.05 * recency
)
```

Each factor is normalized to `[0, 1]`. `priority_breakdown` is returned by the API so the ranking can be audited.

## Security and reliability notes

- CSV imports are size/row bounded and reject formula-like cells.
- Pydantic rejects unexpected fields and validates ratings, text length, statuses, and Adaption request shapes.
- Customer text is rendered as React text, not HTML.
- Provider keys are read server-side from `ADAPTION_API_KEY`.
- `INSIGHTFLOW_API_KEY` can protect the API with `X-API-Key`.
- Adaption errors are persisted without claiming synthetic outcomes.
- The current local default is SQLite; production deployment should place it on persistent storage and add auth/session identity before handling multi-tenant customer data.
