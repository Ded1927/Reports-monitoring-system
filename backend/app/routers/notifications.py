from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Notification, User, UserRole
from ..auth import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    USER → лише власні персональні сповіщення (user_id = current_user.id)
    ANALYST / FUNC_ADMIN → лише спільні для своєї ролі (target_role = current_user.role)
    """
    if current_user.role == UserRole.USER:
        notifs = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(Notification.created_at.desc()).all()
    else:
        notifs = db.query(Notification).filter(
            Notification.target_role == current_user.role
        ).order_by(Notification.created_at.desc()).all()

    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "is_read": n.is_read,
        }
        for n in notifs
    ]

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from uuid import UUID
    notif = db.query(Notification).filter(Notification.id == UUID(notification_id)).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}
