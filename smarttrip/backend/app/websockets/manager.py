from fastapi import APIRouter, WebSocket, WebSocketDisconnect
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
            self.active_connections[journey_id].remove(websocket)
            if not self.active_connections[journey_id]:
                del self.active_connections[journey_id]

    async def broadcast_location(self, journey_id: str, message: dict):
        if journey_id in self.active_connections:
            for connection in self.active_connections[journey_id]:
                await connection.send_json(message)

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

@router.post("/internal/update_location")
async def update_location(journey_id: str, lat: float, lon: float):
    """Internal endpoint for the driver simulator to post updates"""
    await manager.broadcast_location(journey_id, {"lat": lat, "lon": lon})
    return {"status": "broadcasted"}
