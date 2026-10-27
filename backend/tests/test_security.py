from app.security import MASK, mask_secrets
from tests.conftest import as_user


def test_masks_sample_password():
    out = mask_secrets("رمز قبلی‌ام Maryam@1402 بود، اگر لازم است برای ریست.")
    assert "Maryam@1402" not in out and MASK in out


def test_masks_keyed_secrets_and_api_keys():
    out = mask_secrets("password: hunter2 and token=abc key sk-abcdefghijklmnopqrstuvwx")
    assert "hunter2" not in out and "abc " not in out and "sk-abc" not in out


def test_keeps_normal_text_emails_and_error_codes():
    text = "ایمیلم ali@example.com است و خطای 0x800CCC0E می‌بینم"
    assert mask_secrets(text) == text


def test_password_never_stored_or_sent_to_ai(client, fake_ai):
    r = client.post("/api/tickets", json={"title": "رمز ایمیل", "body": "رمز قبلی‌ام Maryam@1402 بود"},
                    headers=as_user("maryam"))
    assert "Maryam@1402" not in r.json()["body"]
    assert all("Maryam@1402" not in c["user"] for c in fake_ai.calls)


def test_seeded_ticket_is_masked(client):
    bodies = [t["body"] for t in client.get("/api/tickets", headers=as_user("it_admin")).json()]
    assert not any("Maryam@1402" in b for b in bodies)


def test_html_is_stored_as_plain_text(client):
    # The API stores text verbatim (no HTML processing); the UI renders it as text only.
    payload = '<img src=x onerror="alert(1)"> help'
    r = client.post("/api/tickets", json={"title": "xss", "body": payload}, headers=as_user("maryam"))
    assert r.json()["body"] == payload


def test_masks_jwt_aws_and_slack_tokens():
    jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
    text = f"token {jwt} key AKIAIOSFODNN7EXAMPLE slack xoxb-1234567890-abcdefghij"
    out = mask_secrets(text)
    assert jwt not in out and "AKIAIOSFODNN7EXAMPLE" not in out and "xoxb-" not in out


def test_security_headers_and_demo_picker(client):
    r = client.get("/api/health")
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["X-Frame-Options"] == "DENY"
    assert "frame-ancestors 'none'" in r.headers["Content-Security-Policy"]
    assert client.get("/api/users").status_code == 200


def test_demo_mode_off_disables_header_auth_and_picker(client, monkeypatch):
    from app.config import get_settings
    monkeypatch.setattr(get_settings(), "demo_mode", False)
    assert client.get("/api/users").status_code == 404
    assert client.get("/api/tickets", headers=as_user("it_admin")).status_code == 401
