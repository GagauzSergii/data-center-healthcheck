# Global Telemetry & Chaos Engineering Dashboard

> NOTE: This is learning progect for AI MCP tools usage. 
> A full-stack AIOps demo that visualises a distributed network on an interactive 3D globe and provides a control panel to simulate real-time chaos incidents.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (port 5173)                   │
│  React + react-globe.gl + framer-motion + Tailwind CSS  │
└─────────────────────┬───────────────────────────────────┘
                      │ REST (axios, polls every 3 s)
┌─────────────────────▼───────────────────────────────────┐
│               FastAPI  (port 8000)                       │
│     SQLAlchemy async · Pydantic v2 · asyncpg            │
└─────────────────────┬───────────────────────────────────┘
                      │ asyncpg
┌─────────────────────▼───────────────────────────────────┐
│              PostgreSQL 16  (port 5432)                  │
│          tables: nodes · telemetry_logs                  │
└─────────────────────────────────────────────────────────┘
```

## Features

| Feature | Details |
|---|---|
| **3D Globe** | `react-globe.gl` — light-grey continents, lime-green atmosphere glow, animated arcs |
| **Node markers** | Green = healthy · Red pulsing = critical |
| **Auto-rotation** | Globe rotates slowly with mouse drag support |
| **Chaos panel** | Trigger OOM / Network Drop incidents per node |
| **One-click resolve** | Reset any node back to healthy |
| **Live polling** | Nodes refresh every 3 s |
| **Toast notifications** | `framer-motion` spring-animated alerts |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- `docker compose` (v2) — bundled with Docker Desktop

---

## Quick Start

```bash
# 1. Clone / enter the project directory
cd data-center-healthcheck

# 2. Build images and start all services
docker compose up --build

# 3. Open the dashboard
open http://localhost:5173
```

> **First run** takes ~2–3 minutes while Docker pulls base images and `npm install` runs.  
> Subsequent starts are near-instant.

---

## Service URLs

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 (user: `postgres`, pw: `postgres`, db: `telemetry`) |

---

## API Reference

### `GET /api/nodes`
Returns all 5 seeded nodes with their current status.

```json
[
  { "id": 1, "name": "EU-London", "latitude": 51.5074, "longitude": -0.1278, "status": "healthy" },
  ...
]
```

### `POST /api/chaos/incident`
Triggers a chaos incident on a node.

```json
{ "node_id": 1, "incident_type": "OOM" }
```
> Valid `incident_type` values: `"OOM"`, `"NETWORK_DROP"`

### `POST /api/chaos/resolve`
Resets a node back to `healthy`.

```json
{ "node_id": 1 }
```

### `GET /api/logs/{node_id}?limit=20`
Returns the most recent telemetry logs for a node.

---

## Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Set the database URL to your local Postgres
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/telemetry"

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Point to local backend
echo "VITE_API_BASE=http://localhost:8000" > .env.local

npm run dev
```

---

## MCP Log Analyzer

This repository includes a local FastMCP server at `tools/docker-log-analyzer/server.py`.

### What it does

- Exposes MCP tools for Docker log triage:
- `get_container_logs(container_name="backend", lines=50)`
- `summarize_incident(container_name="backend", lines=300)`
- Exposes MCP prompt:
- `triage_incident(container_name="backend")`

`triage_incident` gives a standardized incident-response workflow to the agent:
1. Fetch container logs
2. Identify stack trace or root crash signal (OOM/timeout)
3. Create a high-priority Jira bug
4. Post incident report with Jira link to Slack on-call channel

### How MCP works here

- The file starts an MCP server with `FastMCP("DockerLogAnalyzer")`
- Any function marked with `@mcp.tool()` becomes a callable MCP tool
- Any function marked with `@mcp.prompt()` becomes a reusable MCP prompt template
- `mcp.run()` starts the server loop so MCP clients can discover and call tools/prompts

### Run locally

```bash
cd tools
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python docker-log-analyzer/server.py
```

Requirements:
- Docker CLI installed and available in PATH
- Access to target container logs (`docker logs ...`)

### Where to configure

- Put usage and team-level behavior in this `README.md`
- Put technical behavior in `tools/docker-log-analyzer/server.py` docstrings (`@mcp.tool` and `@mcp.prompt`)
- If you use a desktop MCP client (for example Claude Desktop/Cursor/other), add this script as a local MCP server in that client's MCP config

---

## Project Structure

```
data-center-healthcheck/
├── backend/
│   ├── main.py          # FastAPI app + lifespan (DB init + seeding)
│   ├── router.py        # API endpoints
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic v2 schemas
│   ├── database.py      # Async engine + session factory
│   ├── config.py        # Pydantic settings (env vars)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Root component (polling, toasts)
│   │   ├── index.css             # Global styles + design tokens
│   │   ├── main.jsx              # React DOM entry
│   │   └── components/
│   │       ├── GlobeView.jsx     # 3D globe (react-globe.gl)
│   │       ├── ChaosPanel.jsx    # Sidebar control panel
│   │       └── Toast.jsx         # framer-motion toast stack
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Stopping the Stack

```bash
# Stop services (keep data)
docker compose down

# Stop and wipe the database volume
docker compose down -v
```
