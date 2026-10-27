"""ORM models."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20))  # "employee" | "it"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    # Body is stored AFTER secret masking; the raw text is never persisted.
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")
    category: Mapped[str] = mapped_column(String(20))
    priority: Mapped[str] = mapped_column(String(20))
    # AI triage suggestion (visible to IT only)
    suggested_reply: Mapped[str] = mapped_column(Text, default="")
    suggestion_source: Mapped[str] = mapped_column(String(20), default="fallback")  # "ai" | "fallback"
    suggestion_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    suggestion_note: Mapped[str | None] = mapped_column(String(300), nullable=True)
    # Final reply written/approved by an IT user (visible to the owner)
    final_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    replied_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner: Mapped[User] = relationship(foreign_keys=[owner_id])
    replied_by: Mapped[User | None] = relationship(foreign_keys=[replied_by_id])


class TicketMessage(Base):
    """A message in a ticket's conversation thread (employee owner or IT)."""

    __tablename__ = "ticket_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # Stored AFTER secret masking, like ticket bodies.
    body: Mapped[str] = mapped_column(Text)
    reply_to_id: Mapped[int | None] = mapped_column(ForeignKey("ticket_messages.id"), nullable=True)
    # True for the message created by the legacy "final reply" endpoint.
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    author: Mapped[User] = relationship()
    reply_to: Mapped["TicketMessage | None"] = relationship(remote_side=[id])
