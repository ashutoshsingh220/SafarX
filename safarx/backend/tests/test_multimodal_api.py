import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_list_hubs():
    response = client.get("/api/v1/multimodal/hubs")
    assert response.status_code == 200
    data = response.json()
    assert "hubs" in data
    assert len(data["hubs"]) > 0
    names = [h["name"] for h in data["hubs"]]
    assert "Pune Junction" in names
    assert "Haridwar Junction" in names
    assert "Dehradun Jolly Grant Airport" in names

def test_api_plan_and_book_sit_pune_to_har_ki_pauri():
    payload = {
        "origin_name": "Symbiosis Institute of Technology, Lavale, Pune",
        "origin_lat": 18.5362,
        "origin_lon": 73.7297,
        "destination_name": "Har Ki Pauri, Haridwar",
        "destination_lat": 29.9567,
        "destination_lon": 78.1700,
        "feeder_mode": "AUTO"
    }
    # 1. Test Planning endpoint
    plan_res = client.post("/api/v1/multimodal/plan", json=payload)
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    assert plan_data["origin"] == payload["origin_name"]
    assert plan_data["destination"] == payload["destination_name"]
    assert len(plan_data["plans"]) == 4

    cheapest_plan = next(p for p in plan_data["plans"] if p["badge"] == "CHEAPEST")
    assert cheapest_plan["total_fare"] > 0
    assert len(cheapest_plan["legs"]) == 3

    # 2. Test 1-click booking endpoint
    book_payload = {
        "user_id": "sit_student_ashutosh",
        "plan": cheapest_plan
    }
    book_res = client.post("/api/v1/multimodal/book", json=book_payload)
    assert book_res.status_code == 200
    book_data = book_res.json()
    assert book_data["status"] == "CONFIRMED"
    assert book_data["pnr"].startswith("ST-2026-")
    assert book_data["total_fare"] == cheapest_plan["total_fare"]
    assert len(book_data["legs"]) == 3
