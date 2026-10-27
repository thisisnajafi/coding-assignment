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
