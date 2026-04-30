from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Notification, User, UserRole
from ..auth import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def paginate(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    return {"skip": skip, "limit": limit}

@router.get("")
def get_notifications(
    pg: dict = Depends(paginate),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    USER → власні персональні сповіщення (user_id = current_user.id)
    ANALYST / FUNC_ADMIN → спільні для ролі (target_role = current_user.role)
    """
    if current_user.role == UserRole.USER:
        q = db.query(Notification).filter(Notification.user_id == current_user.id)
    else:
        q = db.query(Notification).filter(Notification.target_role == current_user.role)

    total = q.count()
    notifs = q.order_by(Notification.created_at.desc()).offset(pg["skip"]).limit(pg["limit"]).all()

    return {
        "total": total,
        "skip": pg["skip"],
        "limit": pg["limit"],
        "items": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "is_read": n.is_read,
            }
            for n in notifs
        ],
    }

@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == UserRole.USER:
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        ).update({"is_read": True})
    else:
        db.query(Notification).filter(
            Notification.target_role == current_user.role,
            Notification.is_read == False,
        ).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from uuid import UUID
    notif = db.query(Notification).filter(Notification.id == UUID(notification_id)).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}
