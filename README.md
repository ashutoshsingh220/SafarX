# 🚀 SmartTrip AI

> **Next-Generation Multimodal Door-to-Door Travel Assistant**  
> *Combining spatial routing, AI agentic search, transparent cross-subsidized pricing, and real-time telemetry.*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![PostGIS](https://img.shields.io/badge/PostGIS-15--3.3-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-11B4DA?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Status-Active%20Development%20%F0%9F%9A%A7-orange?style=for-the-badge)](#-project-status--roadmap)

---

## 📌 Executive Summary

**SmartTrip AI** solves the first-mile and last-mile disconnect in intercity transit. Traditional travel platforms force users to independently book local cabs, intercity buses, trains, or flights. SmartTrip AI synthesizes these modes into a single **door-to-door itinerary**, protected by a **transparent cross-subsidized pricing engine (S1–S5)**, driven by an **AI Conversational Agent**, and backed by **real-time WebSocket telemetry**.

> 🚧 **Project Status Notice**: SmartTrip AI is actively under development. Core multi-modal routing, spatial database schemas, Gemini function-calling agent, machine learning models, real-time WebSockets, and Flutter frontend UI are **fully functional** in the local demo environment. Advanced live provider integrations (Razorpay webhooks, live GTFS-RT streams, production maps) are being actively completed.

---

## 🛠️ Architecture & System Design

```
                     ┌──────────────────────────────────────────────┐
                     │          Flutter Mobile App (Client)         │
                     │       (Riverpod State, Material 3 UI)        │
                     └──────────────────────┬───────────────────────┘
                                            │ REST / WebSockets
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │              FastAPI Backend Gateway          │
                     └──────┬───────────────┼───────────────┬───────┘
                            │               │               │
      ┌─────────────────────▼──┐     ┌──────▼──────┐   ┌────▼────────────────┐
      │  Gemini 2.0 Flash AI   │     │  Spatial &  │   │     Real-Time       │
      │  Function-Calling Agent│     │  Multimodal │   │  WebSocket Tracker  │
      │   (Google GenAI SDK)   │     │Search Engine│   │ (Driver Simulator)  │
      └────────────────────────┘     └──────┬──────┘   └─────────────────────┘
                                            │
               ┌────────────────────────────┼───────────────────────────┐
               ▼                            ▼                           ▼
     ┌───────────────────┐        ┌───────────────────┐       ┌───────────────────┐
     │  S1-S5 Financial  │        │   PostGIS 15 /    │       │     Tri-Model     │
     │  Pricing Engine   │        │ PostgreSQL Store  │       │     ML Suite      │
     │ (Cross-Subsidies) │        │ (Spatial Buffers) │       │ (KMeans/XGB/RF)   │
     └───────────────────┘        └───────────────────┘       └───────────────────┘
```

---

## ✨ Features Implemented To Date

### 1. 🤖 Gemini 2.0 Flash Conversational AI Agent
- **Natural Language Journey Planning**: Accepts prompts such as *"I need to travel from Susgaon Pune to Bangalore tomorrow evening"*.
- **Structured Function Calling**: Integrates native tool calling declarations:
  - `search_routes`: Queries multi-modal journeys across feeder, bus, train, and flight.
  - `price_bundle`: Evaluates S1–S5 financial rules dynamically.
  - `book_route`: Initiates instant booking intents.
- **Offline Mock Fallback**: Includes a deterministic fallback agent when running without an external API key (`USE_MOCK_AI=true`).
- **Interactive CLI Runner**: Command-line interactive shell for direct agent testing (`cli_agent.py`).

### 2. 💸 S1–S5 Transparent Bundle-Pricing Engine
SmartTrip AI implements five financial rules to eliminate hidden fees and lower last-mile transit costs:
- **S1 (High-Demand Shuttle Cap)**: Limits high-demand feeder corridor fares to ₹50.
- **S2 (Cross-Subsidization)**: Calculates last-mile subsidy directly from intercity bus commission (`min(50% bus commission, 40% feeder fare)`).
- **S3 (Bundle Pricing)**: Presents bus fare and discounted last-mile ride as a single unified bundle.
- **S4 (SmartTrip Plus)**: Subscription cap reducing pre-subsidy feeder rides to ₹20.
- **S5 (Early Booking Discount)**: 10% discount applied on last-mile rides booked $\ge$ 6 hours in advance.

### 3. 🗺️ Spatial & Multimodal Routing Engine
- **PostGIS Distance Querying**: Uses meter-based spatial calculations (`ST_DistanceSphere`) to locate optimal seed boarding points.
- **Feeder + Intercity Synthesis**: Synthesizes local feeder shuttles, intercity buses, overnight trains, and flight options.
- **OSRM Integration**: High-performance route, distance, and duration calculations powered by Open Source Routing Machine (OSRM) with Google Distance Matrix fallback.

### 4. 🧠 Tri-Model Machine Learning Suite
- **Demand Clustering (`KMeans`)**: Identifies high-demand spatial hubs (e.g., Susgaon, Wakad, Pune Centre) for dynamic fleet allocation.
- **ETA Predictor (`XGBoost`)**: Supervised regressor predicting precise last-mile ETAs considering route distance, hour of day, and traffic density.
- **Journey Option Ranker (`RandomForest`)**: Ranks multi-modal options based on fare, travel duration, transfer friction, and vehicle comfort score.

### 5. 📡 Real-Time Telemetry & WebSockets
- **Live Vehicle Tracking**: Bidirectional WebSocket endpoint (`/ws/track/{journey_id}`) broadcasting vehicle coordinates and live status.
- **Driver Simulator**: Built-in Python simulator (`driver_simulator.py`) for streaming realistic telemetry data during testing.

### 6. 📱 Flutter Cross-Platform Client
- **Modern UI**: Material 3 interface built with Flutter & Riverpod state management.
- **Journey Search Screen**: Date pickers, spatial coordinate inputs, journey comparison cards, and pricing breakdown drawer.
- **Firebase Auth Sheet**: User authentication flow supporting email/password sign-in and token persistence.

---

## 🧰 Tech Stack

| Layer | Technologies & Tools |
|---|---|
| **Backend Framework** | Python 3.11/3.12, FastAPI, Asyncio, Pydantic v2 |
| **AI / Agentic Framework** | Google Gemini 2.0 Flash (`google-genai` SDK), Function Calling |
| **Database & ORM** | PostgreSQL 15, PostGIS 3.3, GeoAlchemy2, Async SQLAlchemy 2.0, Alembic |
| **Caching & Real-Time** | Redis 7, WebSockets |
| **Machine Learning** | Scikit-learn (KMeans, RandomForest), XGBoost, NumPy |
| **GIS & Routing** | Open Source Routing Machine (OSRM), Google Distance Matrix API, Amadeus Flight API |
| **Frontend** | Flutter 3.x, Dart, Riverpod State Management, Firebase Auth |
| **DevOps & Containers** | Docker, Docker Compose, Uvicorn, PowerShell / Bash Scripts |

---

## 📂 Project Structure

```
SmartTripAI/
├── reference/                  # Research benchmarks (Namma Yatri, OTP, TravelPlanner)
└── smarttrip/                  # Main Application Workspace
    ├── backend/
    │   ├── alembic/            # Database schema migrations
    │   ├── app/
    │   │   ├── agent/          # Gemini AI agent & tool declarations
    │   │   ├── ml/             # KMeans, XGBoost, and RF models & artifacts
    │   │   ├── routers/        # FastAPI API routes (search, agent, ml, bookings)
    │   │   ├── services/       # Pricing rules, OSRM client, search algorithms
    │   │   ├── websockets/     # Live telemetry tracking manager
    │   │   ├── config.py       # Pydantic environment configuration
    │   │   ├── database.py     # Async SQLAlchemy session factory
    │   │   ├── main.py         # FastAPI application entrypoint
    │   │   ├── models.py       # SQLAlchemy spatial database models
    │   │   └── schemas.py      # Pydantic data schemas
    │   ├── cli_agent.py        # Interactive CLI runner for AI Agent
    │   ├── seed.py             # Database seed script for locations & buses
    │   └── Dockerfile          # Python backend container build
    ├── docs/                   # Documentation & OSRM setup guides
    ├── frontend/               # Flutter mobile application
    │   ├── lib/main.dart       # Riverpod state & UI components
    │   └── pubspec.yaml        # Flutter dependencies
    ├── scripts/                # OSRM download and setup scripts (.ps1 / .sh)
    ├── docker-compose.yml      # Multi-container orchestration (PostGIS, Redis, OSRM, API)
    └── run_demo.sh             # One-click demo orchestrator
```

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Engine running)
- [Python 3.11+](https://www.python.org/downloads/)
- [Flutter SDK](https://docs.flutter.dev/get-started/install) *(optional, for running mobile app)*

---

### Step 1: Clone the Repository & Navigate to Workspace

```bash
git clone https://github.com/ashutoshsingh220/SmartTripAI.git
cd SmartTripAI/smarttrip
```

---

### Step 2: Configure Environment Variables

Copy the example environment file inside `backend/`:

```bash
# On Linux/macOS
cp backend/.env.example backend/.env

# On Windows (PowerShell)
Copy-Item backend/.env.example backend/.env
```

> 💡 **Default Settings**: By default, mock flags (`USE_MOCK_AI=true`, `USE_MOCK_MAPS=true`, `USE_MOCK_FLIGHTS=true`) are enabled so you can run the complete project locally **without requiring API keys**.

---

### Step 3: Launch Containers via Docker Compose

```bash
docker compose up -d --build
```

This starts:
- **PostGIS Database**: Port `5432`
- **Redis Cache**: Port `6379`
- **FastAPI Server**: Port `8000`

Run database migrations and seed default spatial locations & bus routes:

```bash
docker compose exec api alembic upgrade head
docker compose exec api python seed.py
```

Open **`http://localhost:8000/docs`** in your browser to explore the interactive OpenAPI documentation.

---

### Step 4: Windows Local Python Virtual Environment (Alternative Manual Setup)

If running backend without Docker:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🧪 Testing Project Features

### 🤖 1. Testing the AI Agent CLI
Open a new terminal while the backend is running:

```bash
cd smarttrip/backend
# Linux/macOS: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
python cli_agent.py
```

*Sample CLI Prompt:*
> `Plan a trip from Susgaon Pune to Bangalore tomorrow evening`

---

### 📡 2. Testing Real-Time Vehicle Telemetry
Open a new terminal to trigger live WebSocket location broadcasts:

```bash
cd smarttrip/backend
python app/scripts/driver_simulator.py
```

Connect any WebSocket client to `ws://localhost:8000/ws/track/bus-1-2026-08-27` to observe live GPS updates.

---

### 📱 3. Running the Flutter App
To launch the Flutter client app:

```bash
cd smarttrip/frontend
flutter pub get
flutter run
```

---

## 📊 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/search/` | Multimodal journey search combining spatial feeder, bus, train, & flight |
| `POST` | `/api/v1/agent/plan` | Gemini 2.0 Flash natural language agent search & planning |
| `POST` | `/api/v1/ml/demand` | KMeans spatial demand cluster prediction |
| `POST` | `/api/v1/ml/eta` | XGBoost regressor ETA prediction |
| `POST` | `/api/v1/ml/rank` | RandomForest multimodal journey ranking |
| `POST` | `/api/v1/bookings/` | Create journey booking intent with payment order ID |
| `GET` | `/ws/track/{journey_id}` | WebSocket stream for live vehicle tracking |
| `GET` | `/health` | Dependency health check (PostGIS & Redis connectivity) |

---

## 🗺️ Project Status & Roadmap

```
[Phase 1-9] ✅ Core Infrastructure, PostGIS, S1-S5 Pricing, Gemini Agent, ML Suite, WebSockets, Flutter UI
[Phase 10]  🚧 Payment Gateway (Razorpay/Stripe) Webhooks & Token Signatures (In Progress)
[Phase 11]  ⏳ Live GTFS / GTFS-RT Public Transit Data Integration
[Phase 12]  ⏳ Interactive Vector Map Tiles (Mapbox / Google Maps SDK in Flutter)
```

---

## 👨‍💻 Author & Acknowledgements

Developed by **Ashutosh Singh** and contributors.  
Contributions, feedback, and feature suggestions are welcome!

- **GitHub**: [@ashutoshsingh220](https://github.com/ashutoshsingh220)
- **Repository**: [SmartTripAI](https://github.com/ashutoshsingh220/SmartTripAI)