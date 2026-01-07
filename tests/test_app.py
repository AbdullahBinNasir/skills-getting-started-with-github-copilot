from fastapi.testclient import TestClient
from urllib.parse import quote
import pytest

from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup should succeed
    res = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    res2 = client.post(f"/activities/{quote(activity)}/signup", params={"email": email})
    assert res2.status_code == 400

    # Cleanup
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)


def test_remove_participant():
    activity = "Programming Class"
    email = "removeme@example.com"

    # Ensure participant exists
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    res = client.delete(f"/activities/{quote(activity)}/participants/{quote(email, safe='')}")
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]

    # Removing again should 404
    res2 = client.delete(f"/activities/{quote(activity)}/participants/{quote(email, safe='')}")
    assert res2.status_code == 404
