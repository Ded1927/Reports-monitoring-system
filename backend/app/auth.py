import secrets
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session as DbSession
from passlib.context import CryptContext
from .database import get_db
from .models import User, UserRole, UserSession

SESSION_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_session(db: DbSession, user_id):
    session_token = secrets.token_urlsafe(64)
    expires_at = datetime.utcnow() + timedelta(minutes=SESSION_EXPIRE_MINUTES)
    
    db_session = UserSession(
        session_token=session_token,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(db_session)
    db.commit()
    return session_token

async def get_current_user(request: Request, db: DbSession = Depends(get_db)):
    # According to TZ, cookies should have __Host- prefix
    session_token = request.cookies.get("__Host-session")
    if not session_token:
        # Fallback for local dev without HTTPS
        session_token = request.cookies.get("session")

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    db_session = db.query(UserSession).filter(UserSession.session_token == session_token).first()
    if not db_session or db_session.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
    
    user = db.query(User).filter(User.id == db_session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return user
