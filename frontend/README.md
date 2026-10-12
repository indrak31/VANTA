# VANTA Signal OS — Frontend Workspace

[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Design](https://img.shields.io/badge/Design-Obsidian%20Glass-0E1117?style=flat-square)](https://github.com/indrak31/VANTA)

The high-performance, responsive React workspace for **VANTA Signal OS**. Engineered with an obsidian dark aesthetic, glassmorphic card overlays, interactive micro-animations, and live data synchronization.

---

## 1. Quickstart

### Prerequisites
- Node.js 18+
- `npm` (or `pnpm` / `yarn`)

### Development & Build Commands

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables (points to backend at http://127.0.0.1:8000)
copy .env.example .env

# Start local Vite development server with Hot Module Replacement (HMR)
npm run dev

# Run strict TypeScript type check
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 2. Core Workflow Surfaces

| Surface | Purpose & Interactions |
| :--- | :--- |
| **Executive Overview** | Real-time signal convergence, sentiment trajectory distribution, highest-velocity issue clusters, and recommended next moves. |
| **Feedback Explorer** | Multi-channel feedback repository. Filter by sentiment, category, source channel; inspect verbatim quotes; manual feedback submission and guarded CSV imports. |
| **Issue Radar** | Semantic issue groupings ranked by deterministic 5-factor priority formula. Direct workflow status controls (`investigating`, `triaged`, `in_progress`, `resolved`), evidence drawer, and bookmarked issues. |
| **Recommendations** | Prescriptive, evidence-grounded action items with confidence ratings, rationale cards, and status workflow. |
| **Counterfactual Simulator** | Interactive scenario sliders (Response Clarity, Onboarding Clarity, Search Relevance) providing real-time directional deltas on issue priority rankings and churn risk. |
| **Adaption Lab** | Direct bridge to Adaption Adaptive Data cloud. Dataset inspection, real-time credit & runtime estimates, column mappings, recipe presets, brand control blueprints, and live execution status receipts. |
| **Reports** | Automated summary library and one-click sanitized CSV / JSON report downloads for stakeholders. |

---

## 3. Obsidian Design System & Tokens

The frontend uses a custom, bespoke design system engineered for high-density customer intelligence:

- **Core Palette**:
  - Background Canvas: `hsl(228, 20%, 4%)` (`#08090C`)
  - Elevated Card: `hsl(225, 17%, 7%)` (`#0E1117`)
  - Active Surface: `hsl(224, 15%, 11%)` (`#161B22`)
  - Subtle Borders: `hsl(224, 14%, 17%)` (`#222734`)
- **Accent Signals**:
  - Primary Indigo: `#6366F1`
  - Positive / Growth: `#10B981`
  - Warning / Risk: `#F59E0B`
  - Critical / Churn: `#EF4444`
- **Glassmorphism**: `backdrop-filter: blur(16px)` with layered rgba gradients and high-contrast typography (`Poppins` + `DM Mono`).

---

## 4. Offline Demo vs. Live API Mode

- **Standalone Offline Mode**: If `VITE_API_URL` is omitted or the backend is offline, the workspace boots instantly using the typed demonstration dataset in `src/data.ts`.
- **Live Connected Mode**: When `VITE_API_URL=http://127.0.0.1:8000` is active, the workspace seamlessly pulls live feedback records, issues, and recommendations from the FastAPI backend. Local mutations (e.g. status updates, manual submissions) automatically re-index on the server.
- **Persistence**: Saved issue bookmarks and custom scenario presets persist across sessions in browser `localStorage` under `ifn-saved-issues` and `ifn-saved-scenarios`.
