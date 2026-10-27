from app.config import get_settings
from tests.conftest import as_user


def test_regenerate_is_rate_limited_per_user(client, fake_ai):
    t = client.get("/api/tickets", headers=as_user("it_admin")).json()[0]
    h = as_user("it_admin")
    limit = get_settings().ai_rate_per_minute
    start = len(fake_ai.calls)  # seeding already used the fake AI
    for _ in range(limit):
        assert client.post(f"/api/tickets/{t['id']}/regenerate", json={}, headers=h).status_code == 200
    r = client.post(f"/api/tickets/{t['id']}/regenerate", json={}, headers=h)
    assert r.status_code == 429 and r.headers.get("Retry-After") == "60"
    assert len(fake_ai.calls) - start == limit  # the blocked call never reached the AI


def test_ticket_creation_falls_back_when_ai_limit_hit(client, fake_ai):
    h = as_user("maryam")
    limit = get_settings().ai_rate_per_minute
    start = len(fake_ai.calls)
    for i in range(limit):
        r = client.post("/api/tickets", json={"title": f"t{i} title", "body": "پرینتر کار نمی‌کند"}, headers=h)
        assert r.status_code == 201
    r = client.post("/api/tickets", json={"title": "one more", "body": "پرینتر کار نمی‌کند"}, headers=h)
    assert r.status_code == 201
    t = client.get(f"/api/tickets/{r.json()['id']}", headers=as_user("it_admin")).json()
    assert t["suggestion_source"] == "fallback" and "rate limit" in t["suggestion_note"]
    assert t["category"] == "hardware" and t["priority"] == "medium"
    assert len(fake_ai.calls) - start == limit


def test_limit_is_per_ip_too(client, fake_ai):
    # maryam and hossein share the test client's IP, so together they hit the per-IP limit.
    limit = get_settings().ai_rate_per_minute
    for i in range(limit):
        user = "maryam" if i % 2 else "hossein"
        client.post("/api/tickets", json={"title": f"x{i} title", "body": "مشکل شبکه دارم"}, headers=as_user(user))
    r = client.post("/api/tickets", json={"title": "next one", "body": "مشکل شبکه دارم"}, headers=as_user("maryam"))
    t = client.get(f"/api/tickets/{r.json()['id']}", headers=as_user("it_admin")).json()
    assert t["suggestion_source"] == "fallback" and "ip" in t["suggestion_note"]


def test_daily_cap(client, fake_ai, monkeypatch):
    monkeypatch.setattr(get_settings(), "ai_daily_cap", 1)
    t = client.get("/api/tickets", headers=as_user("it_admin")).json()[0]
    h = as_user("it_admin")
    assert client.post(f"/api/tickets/{t['id']}/regenerate", json={}, headers=h).status_code == 200
    assert client.post(f"/api/tickets/{t['id']}/regenerate", json={}, headers=h).status_code == 429
