import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

def test_signup_and_unregister():
    # Use a unique email to avoid conflicts
    activity = "Chess Club"
    email = "pytestuser@mergington.edu"

    # Ensure not already signed up
    client.delete(f"/activities/{activity}/signup?email={email}")

    # Sign up
    resp_signup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_signup.status_code == 200
    assert f"Signed up {email}" in resp_signup.json()["message"]

    # Check participant is present
    resp_activities = client.get("/activities")
    assert email in resp_activities.json()[activity]["participants"]

    # Unregister
    resp_delete = client.delete(f"/activities/{activity}/signup?email={email}")
    assert resp_delete.status_code == 200
    assert f"Removed {email}" in resp_delete.json()["message"]

    # Check participant is gone
    resp_activities2 = client.get("/activities")
    assert email not in resp_activities2.json()[activity]["participants"]

def test_signup_duplicate():
    activity = "Chess Club"
    email = "michael@mergington.edu"  # Already present
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400
    assert "already signed up" in resp.json()["detail"]

def test_unregister_not_signed_up():
    activity = "Chess Club"
    email = "notregistered@mergington.edu"
    resp = client.delete(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400
    assert "not signed up" in resp.json()["detail"]

def test_signup_activity_not_found():
    resp = client.post("/activities/Nonexistent/signup?email=someone@mergington.edu")
    assert resp.status_code == 404
    assert "Activity not found" in resp.json()["detail"]

def test_unregister_activity_not_found():
    resp = client.delete("/activities/Nonexistent/signup?email=someone@mergington.edu")
    assert resp.status_code == 404
    assert "Activity not found" in resp.json()["detail"]
