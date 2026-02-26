"""Simple authentication router for demo purposes.
A real system should use hashed passwords and a database.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict
import uuid

router = APIRouter(prefix="/auth")

# quick in-memory storage
_users: Dict[str, dict] = {}


class UserIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    token: str


@router.post("/register")
def register(user: UserIn):
    if user.email in _users:
        raise HTTPException(status_code=400, detail="User already exists")
    # store plaintext for demo only
    _users[user.email] = {"password": user.password}
    return {"status": "ok"}


@router.post("/login", response_model=TokenOut)
def login(user: UserIn):
    stored = _users.get(user.email)
    if not stored or stored.get("password") != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # generate a fake token
    token = str(uuid.uuid4())
    # in production, associate token with user
    return {"token": token}
