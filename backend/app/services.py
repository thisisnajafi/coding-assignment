"""Ticket business logic shared by the API and the seeder."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .ai import triage
from .models import Ticket, TicketMessage, User
from .schemas import MessageOut, MessageQuote, TicketEmployeeOut, TicketITOut
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
    # Only this ticket's own (already masked) messages are sent, labelled by role.
    thread = [(m.author.role, m.body) for m in list_messages(db, ticket)]
    result = triage(ticket.title, ticket.body, model=model, thread=thread)
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


def list_messages(db: Session, ticket: Ticket) -> list[TicketMessage]:
    q = select(TicketMessage).where(TicketMessage.ticket_id == ticket.id).order_by(
        TicketMessage.created_at, TicketMessage.id)
    return list(db.scalars(q))


def add_message(db: Session, ticket: Ticket, author: User, body: str,
                reply_to: TicketMessage | None = None, is_final: bool = False) -> TicketMessage:
    msg = TicketMessage(ticket_id=ticket.id, author_id=author.id, body=mask_secrets(body),
                        reply_to_id=reply_to.id if reply_to else None, is_final=is_final)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def message_out(m: TicketMessage) -> MessageOut:
    quote = None
    if m.reply_to is not None:
        snippet = m.reply_to.body.strip().replace("\n", " ")
        quote = MessageQuote(id=m.reply_to.id, author=m.reply_to.author.username, role=m.reply_to.author.role,
                             snippet=snippet[:140] + ("…" if len(snippet) > 140 else ""))
    return MessageOut(id=m.id, ticket_id=m.ticket_id, author=m.author.username, role=m.author.role,
                      body=m.body, reply_to_id=m.reply_to_id, reply_to=quote, is_final=m.is_final,
                      created_at=m.created_at)
