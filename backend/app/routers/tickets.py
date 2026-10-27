"""Ticket endpoints. All access control is enforced here, server-side."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ai import available_models
from ..auth import current_user, require_employee, require_it
from ..config import get_settings
from ..db import get_db
from ..models import Ticket, User
from ..schemas import (Category, ModelsOut, Priority, RegenerateRequest, ReplyCreate, Status,
                       StatusUpdate, TicketCreate, TicketEmployeeOut, TicketITOut, UserOut)
from ..services import apply_suggestion, create_ticket, to_out

router = APIRouter(prefix="/api")


def _get_visible_ticket(db: Session, ticket_id: int, user: User) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    # Employees get 404 (not 403) for others' tickets so IDs are not enumerable.
    if ticket is None or (user.role != "it" and ticket.owner_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    return ticket


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
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
def post_ticket(data: TicketCreate, user: User = Depends(require_employee), db: Session = Depends(get_db)):
    return to_out(create_ticket(db, user, data.title, data.body), user)


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
    ticket.final_reply = data.reply.strip()
    ticket.replied_by_id = user.id
    ticket.replied_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return to_out(ticket, user)


@router.post("/tickets/{ticket_id}/regenerate", response_model=TicketITOut)
def regenerate(ticket_id: int, data: RegenerateRequest, user: User = Depends(require_it),
               db: Session = Depends(get_db)):
    ticket = _get_visible_ticket(db, ticket_id, user)
    if data.model and data.model not in available_models():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown model")
    return to_out(apply_suggestion(db, ticket, data.model), user)


@router.get("/ai/models", response_model=ModelsOut)
def models(user: User = Depends(require_it)):
    s = get_settings()
    return ModelsOut(default=s.ai_default_model, models=available_models(), ai_enabled=s.ai_enabled)
