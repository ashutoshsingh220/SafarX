# SmartTrip AI: Development Journal

*This document outlines every step of the development process for SmartTrip AI, providing a comprehensive guide for team members to understand the current state of the codebase.*

## Table of Contents
1. [Project Inception & Architecture](#1-project-inception--architecture)
2. [Backend Infrastructure & Database Setup](#2-backend-infrastructure--database-setup)
3. [Multi-Modal Routing Engine](#3-multi-modal-routing-engine)
4. [Advanced Pricing Engine](#4-advanced-pricing-engine)
5. [Machine Learning for ETA & Demand](#5-machine-learning-for-eta--demand)
6. [Real-Time Tracking & WebSockets](#6-real-time-tracking--websockets)
7. [AI Agent Integration (Gemini)](#7-ai-agent-integration-gemini)
8. [Frontend Development (React Native)](#8-frontend-development-react-native)
9. [Monorepo Consolidation](#9-monorepo-consolidation)

---

### 1. Project Inception & Architecture
SmartTrip AI was conceptualized as a next-generation door-to-door travel assistant. The goal was to build a system that not only routes users from Point A to Point B across different transportation modes (cabs, buses, flights) but also utilizes dynamic pricing, AI conversational agents, and real-time tracking.

**Architecture Split:**
- **Backend**: Python FastAPI (`smarttrip/`) handles complex routing, PostGIS spatial queries, pricing business logic, and WebSocket connections.
- **Frontend**: React Native with Expo (`uber-clone/` or "Ryde") provides the consumer-facing mobile application with a map-centric UI.

### 2. Backend Infrastructure & Database Setup
- **Dockerization**: Created `docker-compose.yml` in `smarttrip/` to instantly spin up **PostgreSQL with PostGIS extension** (for handling geographic coordinates) and **Redis** (for caching and Pub/Sub).
- **Database Schema**: Configured SQLAlchemy models representing:
  - `Location`: Nodes in our transport network.
  - `Bus`: Transport vehicles with capacity tracking.
  - `FeederCorridor`: Geofenced polygons storing valid areas for first-mile/last-mile transit.
- **Bootstrapping**: Created an orchestrator script (`run_demo.sh`) to start infrastructure and seed the database with initial nodes.

### 3. Multi-Modal Routing Engine
To achieve door-to-door navigation, we implemented a custom search engine at `/api/v1/search`:
- **Flight & Train Mocking**: Since live API integrations were out-of-scope for the MVP, we built robust simulators for long-haul transport.
- **PostGIS Feeder Routing**: When a user requests a trip, the backend uses spatial queries (e.g., `ST_Distance`) to map their exact geographic coordinates to the nearest valid transit node or bus stop, creating a multi-leg journey (Feeder -> Flight -> Feeder).

### 4. Advanced Pricing Engine
We developed `app/services/pricing.py` to differentiate SmartTrip from standard routing apps through intelligent economics:
- **Cross-Subsidy Models**: The backend artificially lowers the price of the first-mile/last-mile (cabs/buses) if the user books a highly profitable long-haul leg (e.g., a flight) through the platform.
- **Bundle Pricing**: Applying a unified discount when multiple legs are booked together.
- **SmartTrip Plus**: Hardcoded logic for membership tiers, granting a flat discount rate across all multi-modal trips.

### 5. Machine Learning for ETA & Demand
- **Model Training**: Trained simulated `scikit-learn` models (KMeans for geographic demand clustering and Linear Regression for ETA calculation based on distance/traffic).
- **Pickle Integration**: Saved these models as `.pkl` files (`xgboost_eta.pkl`) and loaded them into the FastAPI application on startup.
- **Endpoints**: Added `/api/v1/ml/demand` and `/api/v1/ml/eta` allowing the frontend to predict prices and wait times dynamically.

### 6. Real-Time Tracking & WebSockets
To power the "Uber-like" tracking experience:
- **WebSockets Manager**: Implemented `ws_manager.py` to handle concurrent user connections over `/ws/track/{journey_id}`.
- **Driver Simulator**: Wrote a background Python script (`driver_simulator.py`) that steps through GPS coordinates and publishes them to Redis.
- **Pub/Sub**: FastAPI listens to Redis Pub/Sub channels and relays the coordinate updates to connected clients in real-time.

### 7. AI Agent Integration (Gemini)
We replaced standard UI forms with a natural language interface:
- **Gemini 2.0 Flash**: Integrated Google's Gemini LLM.
- **Function Calling**: Defined a strict schema of tools (e.g., `search_trip`, `book_trip`) that the LLM can invoke.
- **Backend Endpoint**: Built `/api/v1/agent/chat` which maintains conversation history, extracts entities (origin, destination, dates) from user chat, and autonomously calls internal backend functions to find trips.
- **CLI Fallback**: Also created `cli_agent.py` so backend developers can test the LLM agent straight from the terminal.

### 8. Frontend Development (React Native)
The frontend (`uber-clone/`) was built using a cloned Uber-style template to accelerate UI development:
- **Core Tech**: Expo, TailwindCSS (NativeWind), and Google Maps API.
- **Authentication**: Integrated Clerk for secure user sign-ups and JWT token generation.
- **Agent UI**: Created `app/(root)/smarttrip/agent.tsx` - a sleek chat interface. It uses a Zustand store (`smartTripStore.ts`) to manage message state, showing typing indicators while hitting the FastAPI `/api/v1/agent/chat` endpoint.
- **Map Visuals**: Implemented React Native Maps to render the multi-leg routes and display the real-time driver marker moving across the screen based on WebSocket events.

### 9. Monorepo Consolidation
Initially, the `uber-clone` directory was acting as a Git submodule, meaning the actual UI code wasn't pushed to the main SmartTripAI GitHub repository.
- **Resolution**: We stripped the isolated `.git` tracker from the `uber-clone` folder and directly added all frontend code to the root `SmartTripAI` index.
- **Result**: The entire stack (FastAPI backend + React Native frontend) is now tracked in a single, unified Git repository, making it easier for the team to clone, review, and deploy.
