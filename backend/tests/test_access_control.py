from tests.conftest import as_user


def _ticket_of(client, owner):
    tickets = client.get("/api/tickets", headers=as_user("it_admin")).json()
    return next(t for t in tickets if t["owner"] == owner)


def test_employee_cannot_fetch_other_employees_ticket(client):
    hossein_ticket = _ticket_of(client, "hossein")
    r = client.get(f"/api/tickets/{hossein_ticket['id']}", headers=as_user("maryam"))
    assert r.status_code == 404


def test_employee_lists_only_own_tickets_without_ai_fields(client):
    r = client.get("/api/tickets", headers=as_user("maryam"))
    assert r.status_code == 200
    data = r.json()
    assert data and all(t["owner"] == "maryam" for t in data)
    assert all("suggested_reply" not in t for t in data)


def test_employee_can_fetch_own_ticket(client):
    own = _ticket_of(client, "maryam")
    r = client.get(f"/api/tickets/{own['id']}", headers=as_user("maryam"))
    assert r.status_code == 200 and "suggested_reply" not in r.json()


def test_missing_or_unknown_user_is_rejected(client):
    assert client.get("/api/tickets").status_code == 401
    assert client.get("/api/tickets", headers=as_user("mallory")).status_code == 401


def test_it_sees_all_tickets_with_suggestions(client):
    data = client.get("/api/tickets", headers=as_user("it_admin")).json()
    assert len(data) == 6 and {t["owner"] for t in data} == {"maryam", "hossein"}
    assert all("suggested_reply" in t for t in data)


def test_it_only_endpoints_reject_employees(client):
    t = _ticket_of(client, "maryam")
    h = as_user("maryam")
    assert client.patch(f"/api/tickets/{t['id']}/status", json={"status": "closed"}, headers=h).status_code == 403
    assert client.post(f"/api/tickets/{t['id']}/reply", json={"reply": "done"}, headers=h).status_code == 403
    assert client.post(f"/api/tickets/{t['id']}/regenerate", json={}, headers=h).status_code == 403
    assert client.get("/api/ai/models", headers=h).status_code == 403


def test_it_cannot_create_tickets(client):
    r = client.post("/api/tickets", json={"title": "test", "body": "something"}, headers=as_user("it_admin"))
    assert r.status_code == 403


def test_status_change_and_invalid_status(client):
    t = _ticket_of(client, "maryam")
    h = as_user("it_admin")
    r = client.patch(f"/api/tickets/{t['id']}/status", json={"status": "in_progress"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "in_progress"
    r = client.patch(f"/api/tickets/{t['id']}/status", json={"status": "deleted"}, headers=h)
    assert r.status_code == 422


def test_single_final_reply_visible_to_owner(client):
    t = _ticket_of(client, "maryam")
    h = as_user("it_admin")
    assert client.post(f"/api/tickets/{t['id']}/reply", json={"reply": "حل شد"}, headers=h).status_code == 200
    assert client.post(f"/api/tickets/{t['id']}/reply", json={"reply": "دوباره"}, headers=h).status_code == 409
    own = client.get(f"/api/tickets/{t['id']}", headers=as_user("maryam")).json()
    assert own["final_reply"] == "حل شد"
