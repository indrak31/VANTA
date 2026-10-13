# 🚀 VANTA Signal OS — Production Deployment Guide

**VANTA Signal OS is 100% ready for production deployment.**  
This document provides complete, step-by-step instructions for deploying both the **FastAPI Backend** and the **React + Vite Frontend** across major cloud platforms.

---

## 📋 Architectural Overview

- **Frontend**: Single Page Application (React 18 + Vite + TypeScript) serving static HTML/JS/CSS with client-side hash routing (`#overview`, `#feedback`, `#radar`, `#simulator`, `#adaptation`).
- **Backend**: High-performance ASGI Python service (FastAPI 0.115+ + Uvicorn) with SQLite WAL-mode persistence and optional official Adaption AI cloud integration.
- **Decoupled Architecture**: Frontend and backend can be hosted together (via Docker Compose or Render Blueprint) or on separate specialized platforms (e.g., Vercel + Render).

---

## ⚡ Recommended Deployment: Vercel + Render (Free Tier Friendly)

This is the fastest, cleanest setup and takes under **5 minutes**.

### Step 1: Deploy Backend to Render (or Railway)

1. Sign in to [Render.com](https://render.com) and click **New + → Web Service**.
2. Connect your GitHub repository: `https://github.com/indrak31/VANTA`.
3. Configure the service settings:
   - **Name**: `vanta-api`
   - **Region**: Any (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && pip install -r requirements-adaption.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. Add Environment Variables under **Advanced → Add Environment Variable**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.12.0` | Target Python version |
   | `CORS_ORIGINS` | `*` | Permits frontend requests from any origin |
   | `DATABASE_PATH` | `data/vanta.sqlite3` | Local SQLite database file |
   | `AUTO_SEED` | `true` | Auto-seeds initial feedback on first boot |
   | `ADAPTION_API_KEY` | *(Your Key)* | Optional: Required for live Adaption AI runs |
5. Click **Create Web Service**.  
   *Your backend URL will be: `https://vanta-api-xxxx.onrender.com`.*
6. **Verify**: Visit `https://vanta-api-xxxx.onrender.com/health` in your browser. You should receive:
   ```json
   {
     "status": "ok",
     "service": "vanta-signal-os",
     "adaption": {
       "configured": true,
       "sdk_installed": true,
       "api_key_configured": true,
       "provider": "adaption"
     }
   }
   ```

---

### Step 2: Deploy Frontend to Vercel (or Netlify)

1. Sign in to [Vercel.com](https://vercel.com) and click **Add New… → Project**.
2. Import the `VANTA` repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **`VITE_API_URL`**: `https://vanta-api-xxxx.onrender.com` *(paste your backend URL from Step 1, without trailing slash)*
5. Click **Deploy**.
6. **Done!** Vercel will build and assign a production URL (e.g., `https://vanta-signal-os.vercel.app`).
   - The included [`frontend/vercel.json`](frontend/vercel.json) automatically configures SPA routing and rewrite rules so page refreshes never return 404s.

---

## 🛠️ Alternative 1: 1-Click Render Blueprint (`render.yaml`)

VANTA includes a native [`render.yaml`](render.yaml) specification in the repository root:

1. In Render, go to **Blueprints → New Blueprint Instance**.
2. Select the `VANTA` repository.
3. Render automatically provisions:
   - **`vanta-api`**: FastAPI Web Service with Python 3.12.
   - **`vanta-ui`**: React Static Site with automatic `VITE_API_URL` binding to the backend service.
4. Click **Apply**.

---

## 🐳 Alternative 2: Docker / Container Deployment

VANTA includes multi-stage production Dockerfiles for both services and a root [`docker-compose.yml`](docker-compose.yml).

### Local or Cloud VM Execution

```bash
# Clone the repository
git clone https://github.com/indrak31/VANTA.git
cd VANTA

# Run both frontend and backend
docker compose up -d --build
```

- **Frontend**: Accessible at `http://localhost:5173`
- **Backend API**: Accessible at `http://localhost:8000`
- **OpenAPI Docs**: Accessible at `http://localhost:8000/docs`

---

## 🔒 Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for Uvicorn server (automatically injected by Render/Railway) |
| `DATABASE_PATH` | `data/vanta.sqlite3` | Filepath for SQLite database |
| `CORS_ORIGINS` | `*` | Comma-separated list of permitted web origins |
| `AUTO_SEED` | `true` | Automatically seeds demo records if database is empty on startup |
| `ADAPTION_API_KEY` | *(None)* | Official Adaption AI cloud API key (never sent to client) |
| `ADAPTION_TIMEOUT_SECONDS` | `30` | Timeout threshold for remote provider calls |
| `VANTA_API_KEY` | *(None)* | Optional: Protects all `/api/*` endpoints with `X-API-Key` |
| `MAX_CSV_BYTES` | `2097152` (2 MB) | Maximum upload size for customer feedback CSVs |
| `MAX_CSV_ROWS` | `10000` | Maximum rows permitted per single CSV import job |

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://127.0.0.1:8000` | Target URL for the FastAPI backend service |

> [!NOTE]
> **Zero-Config Fallback**: If `VITE_API_URL` is omitted, the frontend automatically falls back to its bundled, high-fidelity offline demonstration dataset (`src/data.ts`). All analytics, charts, priority calculations, and counterfactual simulations remain 100% interactive.

---

## 🧪 Post-Deployment Verification Checklist

Once deployed, run through this quick 6-point verification:

1. **Backend Health Check**:
   - `GET /health` returns `200 OK` with `"status": "ok"`.
2. **Interactive OpenAPI Specs**:
   - Visit `https://your-backend-url/docs` to test endpoints directly.
3. **Data Ingestion**:
   - In the frontend, navigate to **Feedback Explorer** and click **Submit Feedback** or import a test CSV.
4. **Issue Radar**:
   - Check that issue clusters display calculated 0–100 priority scores and evidence drawers open.
5. **Counterfactual Simulator**:
   - Move the scenario sliders and verify dynamic rank deltas update in real time.
6. **Adaption Lab**:
   - Check cloud dataset discovery and verify pre-flight cost/time estimates.
