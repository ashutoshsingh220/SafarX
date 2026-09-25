#!/bin/bash

# Exit on error
set -e

echo "=================================================="
echo "          SmartTrip AI - Demo Startup Script       "
echo "=================================================="

echo "[1/4] Starting Database and Redis via Docker Compose..."
docker-compose up -d

echo "[2/4] Setting up Python Virtual Environment..."
cd backend
if [ ! -d "venv" ]; then
    python3.12 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

echo "[3/4] Running Database Seeder..."
export PYTHONPATH=.
python seed.py

echo "[4/4] Starting FastAPI Server (with Hot Reload)..."
echo "The API will be available at http://localhost:8000"
echo "The WebSocket Tracker is running internally on /ws/track/{journey_id}"
echo ""
echo "To test the AI Agent CLI, open a new terminal and run:"
echo "  cd backend && source venv/bin/activate && export PYTHONPATH=. && python cli_agent.py"
echo ""
echo "To simulate a driver for WebSockets, run:"
echo "  cd backend && source venv/bin/activate && export PYTHONPATH=. && python app/scripts/driver_simulator.py"
echo "--------------------------------------------------"

# Start the uvicorn server in the foreground
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
