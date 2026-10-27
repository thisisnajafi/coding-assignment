"""The seed must contain exactly the sample data from the assignment spec (README.md), nothing more."""
import json
import re
from pathlib import Path

from sqlalchemy import func, select

from app.models import Ticket, User
from app.seed import TICKETS, USERS, seed

README = Path(__file__).resolve().parents[2] / "README.md"


def _spec():
    text = README.read_text(encoding="utf-8")
    return json.loads(re.search(r"```json\n(.*?)```", text, re.S).group(1))


def test_seed_data_is_exactly_the_spec_sample_data():
    if not README.exists():  # e.g. backend-only Docker build context
        return
    spec = _spec()
    assert USERS == [(u["username"], u["role"]) for u in spec["users"]]
    assert TICKETS == [(t["user"], t["title"], t["body"]) for t in spec["tickets"]]


def test_seed_creates_only_spec_rows_and_is_idempotent(db_session, fake_ai):
    seed(db_session)
    seed(db_session)
    assert db_session.scalar(select(func.count(User.id))) == 3
    assert db_session.scalar(select(func.count(Ticket.id))) == 6
