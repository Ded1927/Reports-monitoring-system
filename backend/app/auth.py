"""
Authentication helpers.

Session storage: Redis
  key   → session:<token>
  value → JSON {user_id, role, email, is_active}
  TTL   → SESSION_EXPIRE_SECONDS (default 24 h)

Horizontal scaling: stateless — any backend instance reads the same Redis.
PostgreSQL is NOT queried on every request; only on cache miss (user deleted/deactivated).
"""
import json
import secrets
from typing import List
from fastapi import Depends, HTTPException, status, Request
from passlib.context import CryptContext

from .redis_client import get_redis, SESSION_EXPIRE_SECONDS
from .database import get_db
from .models import User, UserRole

# ── Password hashing ───────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ── Session helpers ────────────────────────────────────────────────────────
SESSION_PREFIX = "session:"

def _session_key(token: str) -> str:
    return f"{SESSION_PREFIX}{token}"

def create_session(user: User) -> str:
    """
    Store a new session in Redis and return the opaque token.
    No DB write — fully stateless for the request handler.
    """
    token = secrets.token_urlsafe(64)
    payload = json.dumps({
        "user_id": str(user.id),
        "role": user.role.value,
        "email": user.email,
        "is_active": user.is_active,
    })
    r = get_redis()
    r.setex(_session_key(token), SESSION_EXPIRE_SECONDS, payload)
    return token

def delete_session(token: str) -> None:
    """Invalidate a session immediately (logout)."""
    get_redis().delete(_session_key(token))

def extend_session(token: str) -> None:
    """Sliding expiry — reset TTL on every authenticated request."""
    get_redis().expire(_session_key(token), SESSION_EXPIRE_SECONDS)

# ── FastAPI dependencies ───────────────────────────────────────────────────
async def get_current_user(request: Request, db=Depends(get_db)) -> User:
    token = request.cookies.get("__Host-session") or request.cookies.get("session")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    r = get_redis()
    raw = r.get(_session_key(token))
    if not raw:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")

    data = json.loads(raw)

    # Resolve full user from DB (needed for relationships and fresh is_active check).
    # This single query replaces the old UserSession JOIN.
    from uuid import UUID
    user = db.query(User).filter(User.id == UUID(data["user_id"])).first()
    if not user:
        r.delete(_session_key(token))
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Sliding window: push TTL forward on activity
    extend_session(token)
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

# ── Role-based access control ─────────────────────────────────────────────
class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Operation not permitted")
        return user
