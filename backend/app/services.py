"""Ticket business logic shared by the API and the seeder."""
from sqlalchemy.orm import Session

from .ai import triage
from .models import Ticket, User
from .schemas import TicketEmployeeOut, TicketITOut
from .security import mask_secrets


def create_ticket(db: Session, owner: User, title: str, body: str) -> Ticket:
    safe_title = mask_secrets(title)
    safe_body = mask_secrets(body)
    result = triage(safe_title, safe_body)
    ticket = Ticket(
        owner_id=owner.id, title=safe_title, body=safe_body, status="open",
        category=result.category.value, priority=result.priority.value,
        suggested_reply=result.suggested_reply, suggestion_source=result.source,
        suggestion_model=result.model, suggestion_note=result.note,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def apply_suggestion(db: Session, ticket: Ticket, model: str | None) -> Ticket:
    """Regenerate the AI suggestion. Only suggestion fields + category/priority change."""
    result = triage(ticket.title, ticket.body, model=model)
    ticket.category = result.category.value
    ticket.priority = result.priority.value
    ticket.suggested_reply = result.suggested_reply
    ticket.suggestion_source = result.source
    ticket.suggestion_model = result.model
    ticket.suggestion_note = result.note
    db.commit()
    db.refresh(ticket)
    return ticket


def _base(t: Ticket) -> dict:
    return dict(id=t.id, title=t.title, body=t.body, status=t.status, category=t.category,
                priority=t.priority, final_reply=t.final_reply, replied_at=t.replied_at,
                created_at=t.created_at, updated_at=t.updated_at, owner=t.owner.username)


def to_out(t: Ticket, viewer: User) -> TicketEmployeeOut | TicketITOut:
    if viewer.role == "it":
        return TicketITOut(**_base(t), suggested_reply=t.suggested_reply,
                           suggestion_source=t.suggestion_source, suggestion_model=t.suggestion_model,
                           suggestion_note=t.suggestion_note,
                           replied_by=t.replied_by.username if t.replied_by else None)
    return TicketEmployeeOut(**_base(t))
