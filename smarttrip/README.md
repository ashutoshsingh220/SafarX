# 🚀 SmartTrip AI Application Workspace

This directory contains the core implementation of **SmartTrip AI** (backend API, frontend client, Docker orchestration, and ML services).

> 📖 **Full Documentation**: For complete architecture breakdown, tech stack summary, dynamic pricing details, and project status, view the main repository [README](../README.md).

---

## 🛠️ Folder Contents

- **`backend/`**: FastAPI application (Python 3.11/3.12) with spatial search, Gemini 2.0 Flash AI agent, S1–S5 pricing engine, ML models, and WebSocket real-time telemetry.
- **`frontend/`**: Cross-platform mobile app built with Flutter and Riverpod state management.
- **`docs/`**: Operational documentation including OSRM configuration guide (`OSRM_SETUP.md`).
- **`scripts/`**: Automation scripts for downloading and building OSRM map data (`setup_osrm.ps1` / `setup_osrm.sh`).
- **`docker-compose.yml`**: Spins up PostGIS 15, Redis 7, OSRM, and the uvicorn API container.
- **`run_demo.sh`**: One-click startup script for setting up and running the local backend demo.

---

## ⚡ Quickstart Commands

### 1. Launch with Docker Compose

```bash
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python seed.py
```

API Docs: `http://localhost:8000/docs`  
Health Check: `http://localhost:8000/health`

---

### 2. Windows PowerShell Setup (Without Docker)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 3. Testing the Gemini AI Agent CLI

```bash
cd backend
# Linux/macOS: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
python cli_agent.py
```

---

### 4. Testing Real-Time Tracking Telemetry

```bash
cd backend
python app/scripts/driver_simulator.py
```

WebSocket Endpoint: `ws://localhost:8000/ws/track/{journey_id}`
