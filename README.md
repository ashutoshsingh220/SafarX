# 🚀 SmartTrip AI

> **Next-Generation Multimodal Door-to-Door Travel Assistant**  
> *Combining spatial routing, AI agentic search, transparent cross-subsidized pricing, and real-time telemetry.*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![PostGIS](https://img.shields.io/badge/PostGIS-15--3.3-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-11B4DA?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Status](https://img.shields.io/badge/Status-Active%20Development%20%F0%9F%9A%A7-orange?style=for-the-badge)](#-project-status--roadmap)

---

## 📌 Executive Summary

**SmartTrip AI** solves the first-mile and last-mile disconnect in intercity transit. Traditional travel platforms force users to independently book local cabs, intercity buses, trains, or flights. SmartTrip AI synthesizes these modes into a single **door-to-door itinerary**, protected by a **transparent cross-subsidized pricing engine (S1–S5)**, driven by an **AI Conversational Agent**, and backed by **real-time WebSocket telemetry**.

> 📖 **Team Documentation**: See [DEVELOPMENT_JOURNAL.md](DEVELOPMENT_JOURNAL.md) for the step-by-step dev log and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 🛠️ Architecture & System Design

```
                     ┌──────────────────────────────────────────────┐
                     │   React Native / Expo Mobile App (uber-clone)│
                     │  (Map-Centric UI, Clerk Auth, Stripe Flow)   │
                     └──────────────────────┬───────────────────────┘
                                            │ REST / WebSockets
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │          FastAPI Backend Gateway             │
                     │           (smarttrip/backend)                │
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
- **Interactive CLI Runner**: Command-line interactive shell for direct agent testing (`python cli_agent.py`).

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

### 6. 📱 React Native / Expo Frontend Application (`uber-clone/`)
- **Map-Centric Mobile UI**: Powered by Expo Router, TailwindCSS/NativeWind, and Google Maps integration.
- **Authentication**: Integrated Clerk authentication for user sign-ups and secure sessions.
- **SmartTrip Agent View**: Custom views (`app/(root)/smarttrip/agent.tsx`) and Zustand state store (`smartTripStore.ts`) interacting with the AI agent.

---

## 🧰 Tech Stack

| Layer | Technologies & Tools |
|---|---|
| **Frontend App** | React Native (Expo, TailwindCSS/NativeWind, Zustand, Clerk, Stripe) |
| **Backend Framework** | Python 3.11/3.12, FastAPI, Asyncio, Pydantic v2 |
| **AI / Agentic Framework** | Google Gemini 2.0 Flash (`google-genai` SDK), Function Calling |
| **Database & ORM** | PostgreSQL 15, PostGIS 3.3, GeoAlchemy2, Async SQLAlchemy 2.0, Alembic |
| **Caching & Real-Time** | Redis 7, WebSockets |
| **Machine Learning** | Scikit-learn (KMeans, RandomForest), XGBoost, NumPy |
| **GIS & Routing** | Open Source Routing Machine (OSRM), Google Distance Matrix API, Amadeus Flight API |
| **DevOps & Containers** | Docker, Docker Compose, Uvicorn, PowerShell / Bash Scripts |

---

## 📂 Project Structure

```
SmartTripAI/
├── CONTRIBUTING.md             # Developer contribution guidelines & setup guide
├── DEVELOPMENT_JOURNAL.md      # Comprehensive step-by-step development log
├── README.md                   # Main GitHub repository documentation
├── smarttrip/                  # Primary Backend & Infrastructure Workspace
│   ├── backend/
│   │   ├── alembic/            # Database schema migrations
│   │   ├── app/                # Core FastAPI routes, agent, pricing engine & ML
│   │   ├── cli_agent.py        # Interactive CLI runner for AI Agent
│   │   ├── seed.py             # Database seed script for locations & buses
│   │   └── Dockerfile          # Python backend container build
│   ├── docs/                   # Documentation & OSRM setup guides
│   ├── scripts/                # OSRM download and setup scripts (.ps1 / .sh)
│   ├── docker-compose.yml      # Multi-container orchestration (PostGIS, Redis, OSRM, API)
│   └── run_demo.sh             # One-click demo orchestrator
└── uber-clone/                 # React Native / Expo Mobile Application ("Ryde")
    ├── app/                    # Expo Router screens (including smarttrip/ agent UI)
    ├── components/             # Reusable UI components (Map, Payment, RideCard)
    └── backend/smarttrip/      # TypeScript SmartTrip logic & tests (Vitest)
```

---

## 🚀 Quickstart & How to Run

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Engine running)
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/en)

---

### Step 1: Launch Backend API & Infrastructure (FastAPI + PostGIS + Redis)

```bash
cd SmartTripAI/smarttrip
docker compose up -d --build
docker compose exec api alembic upgrade head
docker compose exec api python seed.py
```

- **API Documentation**: `http://localhost:8000/docs`
- **Health Endpoint**: `http://localhost:8000/health`

---

### Step 2: Run React Native / Expo Frontend App (`uber-clone/`)

In a new terminal window:

```bash
cd SmartTripAI/uber-clone
npm install
npx expo start
```

---

### Step 3: Run AI Agent CLI (Terminal Chat)

In a new terminal window:

```bash
cd SmartTripAI/smarttrip/backend
python cli_agent.py
```

---

## 👨‍💻 Authors & Acknowledgements

Developed by **Ashutosh Singh**, **Alankaar**, and team contributors.  
Contributions, feedback, and feature suggestions are welcome!

- **GitHub**: [@ashutoshsingh220](https://github.com/ashutoshsingh220) | [@Alankaar63](https://github.com/Alankaar63)
- **Repository**: [SmartTripAI](https://github.com/ashutoshsingh220/SmartTripAI)