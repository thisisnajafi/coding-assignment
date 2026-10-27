"""Ticket endpoints. All access control is enforced here, server-side."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ai import ALLOWED_MODELS, available_model_groups
from ..auth import current_user, require_employee, require_it
from ..config import get_settings
from ..db import get_db
from ..models import Ticket, TicketMessage, User
from ..schemas import (Category, MessageCreate, MessageOut, ModelsOut, Priority, RegenerateRequest, ReplyCreate, Status,
                       StatusUpdate, TicketCreate, TicketEmployeeOut, TicketITOut, UserOut)
from ..ratelimit import limiter
from ..security import mask_secrets
from ..services import add_message, apply_suggestion, create_ticket, list_messages, message_out, to_out

router = APIRouter(prefix="/api")


def _get_visible_ticket(db: Session, ticket_id: int, user: User) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    # Employees get 404 (not 403) for others' tickets so IDs are not enumerable.
    if ticket is None or (user.role != "it" and ticket.owner_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    return ticket


@router.get("/users", response_model=list[UserOut])
def list_demo_users(db: Session = Depends(get_db)):
    """Demo user picker: lists the seeded demo accounts. Only available when DEMO_MODE=true.

    This endpoint (and the X-User header) exist only for the demo; see DOCS.md "Security limitations".
    """
    if not get_settings().demo_mode:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return db.scalars(select(User).order_by(User.id)).all()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.get("/tickets", response_model=list[TicketITOut] | list[TicketEmployeeOut])
def list_tickets(
    user: User = Depends(current_user), db: Session = Depends(get_db),
    status_: Status | None = Query(default=None, alias="status"),
    category: Category | None = None, priority: Priority | None = None,
):
    q = select(Ticket).order_by(Ticket.created_at.desc(), Ticket.id.desc())
    if user.role != "it":
        q = q.where(Ticket.owner_id == user.id)
    else:
        if status_:
            q = q.where(Ticket.status == status_.value)
        if category:
            q = q.where(Ticket.category == category.value)
        if priority:
            q = q.where(Ticket.priority == priority.value)
    return [to_out(t, user) for t in db.scalars(q)]


@router.post("/tickets", response_model=TicketEmployeeOut, status_code=201)
def post_ticket(data: TicketCreate, request: Request, user: User = Depends(require_employee),
                db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    return to_out(create_ticket(db, user, data.title, data.body, ip=ip), user)


@router.get("/tickets/{ticket_id}", response_model=TicketITOut | TicketEmployeeOut)
def get_ticket(ticket_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return to_out(_get_visible_ticket(db, ticket_id, user), user)


@router.patch("/tickets/{ticket_id}/status", response_model=TicketITOut)
def update_status(ticket_id: int, data: StatusUpdate, user: User = Depends(require_it),
                  db: Session = Depends(get_db)):
    ticket = _get_visible_ticket(db, ticket_id, user)
    ticket.status = data.status.value
    db.commit()
    db.refresh(ticket)
    return to_out(ticket, user)


@router.post("/tickets/{ticket_id}/reply", response_model=TicketITOut)
def post_reply(ticket_id: int, data: ReplyCreate, user: User = Depends(require_it),
               db: Session = Depends(get_db)):
    ticket = _get_visible_ticket(db, ticket_id, user)
    if ticket.final_reply:
        raise HTTPException(status.HTTP_409_CONFLICT, "This ticket already has a final reply")
    ticket.final_reply = mask_secrets(data.reply.strip())
    ticket.replied_by_id = user.id
    ticket.replied_at = datetime.now(timezone.utc)
    db.commit()
    # Mirror the final reply into the thread so the conversation stays complete.
    add_message(db, ticket, user, ticket.final_reply, is_final=True)
    db.refresh(ticket)
    return to_out(ticket, user)


@router.get("/tickets/{ticket_id}/messages", response_model=list[MessageOut])
def get_messages(ticket_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    ticket = _get_visible_ticket(db, ticket_id, user)
    return [message_out(m) for m in list_messages(db, ticket)]


@router.post("/tickets/{ticket_id}/messages", response_model=MessageOut, status_code=201)
def post_message(ticket_id: int, data: MessageCreate, user: User = Depends(current_user),
                 db: Session = Depends(get_db)):
    ticket = _get_visible_ticket(db, ticket_id, user)
    parent = None
    if data.reply_to_id is not None:
        parent = db.get(TicketMessage, data.reply_to_id)
        if parent is None or parent.ticket_id != ticket.id:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "reply_to_id must be a message of this ticket")
    return message_out(add_message(db, ticket, user, data.body, reply_to=parent))


@router.post("/tickets/{ticket_id}/regenerate", response_model=TicketITOut)
def regenerate(ticket_id: int, data: RegenerateRequest, request: Request, user: User = Depends(require_it),
               db: Session = Depends(get_db)):
    ticket = _get_visible_ticket(db, ticket_id, user)
    if data.model and data.model not in ALLOWED_MODELS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown model")
    if limiter.acquire(user.username, request.client.host if request.client else None):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            "محدودیت تعداد درخواست هوش مصنوعی؛ لطفاً یک دقیقه دیگر دوباره تلاش کنید.",
                            headers={"Retry-After": "60"})
    return to_out(apply_suggestion(db, ticket, data.model), user)


@router.get("/ai/models", response_model=ModelsOut)
def models(user: User = Depends(require_it)):
    s = get_settings()
    groups = available_model_groups()
    return ModelsOut(default=s.ai_default_model, models=[m for g in groups for m in g["models"]],
                     groups=groups, ai_enabled=s.ai_enabled)
