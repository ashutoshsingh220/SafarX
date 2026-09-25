from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import List, Dict

router = APIRouter(prefix="/ws", tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        # Maps journey_id to a list of active websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, journey_id: str):
        await websocket.accept()
        if journey_id not in self.active_connections:
            self.active_connections[journey_id] = []
        self.active_connections[journey_id].append(websocket)

    def disconnect(self, websocket: WebSocket, journey_id: str):
        if journey_id in self.active_connections:
            if websocket in self.active_connections[journey_id]:
                self.active_connections[journey_id].remove(websocket)
            if not self.active_connections[journey_id]:
                del self.active_connections[journey_id]

    async def broadcast_location(self, journey_id: str, message: dict):
        if journey_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[journey_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            for connection in disconnected:
                self.disconnect(connection, journey_id)

manager = ConnectionManager()

@router.websocket("/track/{journey_id}")
async def track_journey(websocket: WebSocket, journey_id: str):
    await manager.connect(websocket, journey_id)
    try:
        while True:
            # Keep connection alive, listen for client messages if any
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, journey_id)

class LocationUpdate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    sequence: int = Field(ge=0)

@router.post("/internal/update_location")
async def update_location(journey_id: str, update: LocationUpdate):
    """Internal endpoint for the driver simulator to post updates"""
    payload = update.model_dump()
    payload["journey_id"] = journey_id
    payload["recorded_at"] = datetime.now(timezone.utc).isoformat()
    await manager.broadcast_location(journey_id, payload)
    return {"status": "broadcasted", "subscribers": len(manager.active_connections.get(journey_id, []))}
