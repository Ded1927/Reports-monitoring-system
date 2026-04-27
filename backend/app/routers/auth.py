from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserSession
from ..schemas import UserRead, UserCreate
from ..auth import verify_password, get_password_hash, create_session, get_current_active_user

router = APIRouter(prefix="/auth", tags=["auth"])

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    session_token = create_session(db, user.id)
    
    # Set Secure, HttpOnly, SameSite cookies. Prefix __Host- requires secure=True and path=/
    response.set_cookie(
        key="__Host-session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )
    # Fallback for local development (without HTTPS)
    response.set_cookie(
        key="session",
        value=session_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/"
    )
    return {"message": "Successfully logged in"}

@router.post("/logout")
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    session_token = request.cookies.get("__Host-session") or request.cookies.get("session")
    if session_token:
        db.query(UserSession).filter(UserSession.session_token == session_token).delete()
        db.commit()
    
    response.delete_cookie("__Host-session", path="/", secure=True, httponly=True, samesite="strict")
    response.delete_cookie("session", path="/")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/profile")
def update_profile(
    profile_data: dict, # using dict to avoid importing new schema if import fails, but schema is better
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    if "first_name" in profile_data:
        current_user.first_name = profile_data["first_name"]
    if "last_name" in profile_data:
        current_user.last_name = profile_data["last_name"]
    if "password" in profile_data and profile_data["password"]:
        current_user.hashed_password = get_password_hash(profile_data["password"])
    
    db.commit()
    return {"message": "Profile updated successfully"}
