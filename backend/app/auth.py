"""Demo authentication: the acting user comes from the X-User header.

This is NOT real authentication (anyone can send any username). It only exists
so the demo can switch users; every permission check below is still enforced on
the server. See DOCS.md for what production auth should look like.
"""
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import get_db
from .models import User


def current_user(x_user: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not x_user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing X-User header")
    user = db.scalar(select(User).where(User.username == x_user.strip()))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown user")
    return user


def require_it(user: User = Depends(current_user)) -> User:
    if user.role != "it":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "IT role required")
    return user


def require_employee(user: User = Depends(current_user)) -> User:
    if user.role != "employee":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only employees can create tickets")
    return user
