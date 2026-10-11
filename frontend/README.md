# Vanta Signal OS

Vanta Signal OS is a responsive React + TypeScript workspace for turning customer feedback into prioritized issues, recommendations, experiments, and recurring reports.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The production build and type check are available with:

```bash
npm run typecheck
npm run build
```

## Product surfaces

- **Overview** — signal volume, sentiment mix, priority issues, and next best moves.
- **Feedback Explorer** — searchable and filterable source records with a detail drawer.
- **Issue Radar** — deterministic client-side priority scoring, sorting, saved issues, and evidence drawers.
- **Recommendations** — evidence-linked suggested actions with confidence and workflow status.
- **Counterfactual Simulator** — scenario sliders, side-by-side ranking deltas, and factor contribution explanation.
- **Adaption Lab** — experiment portfolio with status filtering and review actions.
- **Reports** — recurring report library with CSV/JSON download and distribution preview.

## Data and API hooks

The typed seed data lives in `src/data.ts`. The app uses it immediately as an explicitly labeled demo dataset. If `VITE_API_URL` is set, `src/api.ts` loads `/api/feedback`, `/api/issues`, and `/api/recommendations`, mapping the API's provenance fields into the workspace model. A failed request gracefully retains the seed data.

Feedback submission and CSV import use `/api/feedback` and `/api/feedback/import`. Adaption Lab uses `/api/adaption/status`, `/api/adaption/estimate`, `/api/adaption/run`, and `/api/adaption/status/{run_id}`. The provider console shows configuration errors and raw receipts rather than pretending that a run succeeded.

Saved issues and scenarios are persisted to `localStorage` under `ifn-saved-issues` and `ifn-saved-scenarios`.
