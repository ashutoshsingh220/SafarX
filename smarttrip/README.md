# SmartTrip AI

A next-generation door-to-door travel assistant combining multi-modal routing, dynamic pricing strategies, and an AI conversational agent.

## Project Structure
- `backend/`: FastAPI Python server containing search, pricing, agents, and websocket logic.
- `frontend/`: Flutter cross-platform mobile application.
- `docker-compose.yml`: Spins up PostGIS (for spatial queries) and Redis.

## Features Built
- **Phase 1:** Docker infrastructure & PostGIS schemas (`Location`, `Bus`, `FeederCorridor`).
- **Phase 2:** Multi-Modal Search (`/api/v1/search`) integrating simulated flights and nearest-point PostGIS feeder routing.
- **Phase 3:** Pricing Engine (`app/services/pricing.py`) implementing Cross-Subsidy, Bundle Pricing, and SmartTrip Plus memberships.
- **Phase 4:** AI Agent (`cli_agent.py`) utilizing `gemini-2.0-flash` with Function Calling to search and book trips via natural language.
- **Phase 5:** ML Endpoints (`/api/v1/ml/demand` and `/api/v1/ml/eta`) using simulated scikit-learn models (KMeans and Linear Regression).
- **Phase 6:** Auth & Bookings (`/api/v1/bookings`) with simulated payments and Firebase-style Bearer token authentication.
- **Phase 7:** Real-Time Tracking (`/ws/track/{journey_id}`) via WebSockets with a Python `driver_simulator.py`.
- **Phase 8:** Flutter UI initialized with Riverpod state management and a mock Map interface.
- **Phase 9:** `run_demo.sh` orchestrator.

## Quickstart

To run the entire platform locally:

```bash
cd smarttrip
./run_demo.sh
```

## Testing the AI Agent
Open a new terminal while the backend is running:
```bash
cd smarttrip/backend
source venv/bin/activate
export PYTHONPATH=.
python cli_agent.py
```

## Testing Real-Time Tracking
Open a new terminal while the backend is running:
```bash
cd smarttrip/backend
source venv/bin/activate
export PYTHONPATH=.
python app/scripts/driver_simulator.py
```
