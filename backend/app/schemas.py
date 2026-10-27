"""Pydantic schemas. Enums are the single source of truth for allowed values."""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Role(str, Enum):
    employee = "employee"
    it = "it"


class Category(str, Enum):
    hardware = "hardware"
    network = "network"
    software = "software"
    access = "access"


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Status(str, Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class AITriage(BaseModel):
    """Strict schema for the model output. Anything outside the enums is rejected."""

    model_config = ConfigDict(extra="forbid")

    category: Category
    priority: Priority
    suggested_reply: str = Field(min_length=1, max_length=2000)

    @field_validator("category", "priority", mode="before")
    @classmethod
    def _must_be_exact_string(cls, v):
        # Reject non-strings early; enum matching is exact and case-sensitive.
        if not isinstance(v, str):
            raise ValueError("must be a string")
        return v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: Role


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=5, max_length=5000)

    @field_validator("title", "body")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class StatusUpdate(BaseModel):
    status: Status


class ReplyCreate(BaseModel):
    reply: str = Field(min_length=2, max_length=5000)


class RegenerateRequest(BaseModel):
    model: str | None = Field(default=None, max_length=100, pattern=r"^[A-Za-z0-9._:/-]+$")


class TicketEmployeeOut(BaseModel):
    """What the ticket owner sees. No AI fields, no internal notes."""

    id: int
    title: str
    body: str
    status: Status
    category: Category
    priority: Priority
    final_reply: str | None
    replied_at: datetime | None
    created_at: datetime
    updated_at: datetime
    owner: str


class TicketITOut(TicketEmployeeOut):
    suggested_reply: str
    suggestion_source: str
    suggestion_model: str | None
    suggestion_note: str | None
    replied_by: str | None


class ModelsOut(BaseModel):
    default: str
    models: list[str]
    ai_enabled: bool


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=3000)
    reply_to_id: int | None = Field(default=None, ge=1)

    @field_validator("body")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class MessageQuote(BaseModel):
    id: int
    author: str
    role: Role
    snippet: str


class MessageOut(BaseModel):
    id: int
    ticket_id: int
    author: str
    role: Role
    body: str
    reply_to_id: int | None
    reply_to: MessageQuote | None
    is_final: bool
    created_at: datetime
