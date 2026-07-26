from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_dependency_state() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert isinstance(body["db_connected"], bool)
    assert isinstance(body["redis_connected"], bool)
