"""Test fixtures. Tests run fully offline: no API key, a fake AI client, temp SQLite DB."""
import json
import os

os.environ["GAPGPT_API_KEY"] = ""
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SEED_ON_STARTUP"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import ai
from app.db import Base, get_db
from app.main import app
from app.seed import seed


class FakeAI:
    """Configurable fake for the GapGPT client. Records every prompt it receives."""

    def __init__(self):
        self.response: str | Exception = json.dumps(
            {"category": "software", "priority": "low", "suggested_reply": "پاسخ آزمایشی"})
        self.calls: list[dict] = []
        self.models = ["gpt-4o", "gpt-4.1", "gpt-4o-2024-08-06", "text-embedding-3-small", "claude-sonnet-4-5", "gemini-2.5-flash", "deepseek-chat"]

    def complete(self, model, system, user):
        self.calls.append({"model": model, "system": system, "user": user})
        if isinstance(self.response, Exception):
            raise self.response
        return self.response

    def list_models(self):
        return self.models


@pytest.fixture(autouse=True)
def reset_rate_limit():
    from app.ratelimit import limiter
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture()
def fake_ai():
    fake = FakeAI()
    ai.set_ai_client(fake)
    yield fake
    ai.set_ai_client(None)


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    with Session() as s:
        yield s


@pytest.fixture()
def client(db_session, fake_ai):
    seed(db_session)
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def as_user(name: str) -> dict:
    return {"X-User": name}
