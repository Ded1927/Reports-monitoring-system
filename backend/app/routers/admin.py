from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from ..database import get_db
from ..models import User, UserRole, Organization, ReportTemplate, Report, ReportStatus
from ..auth import get_password_hash, RoleChecker

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_ROLES = [UserRole.FUNC_ADMIN]

# ─── Shared pagination dep ────────────────────────────────────────────────────

def paginate(
    skip: int = Query(0, ge=0, description="Кількість записів для пропуску"),
    limit: int = Query(50, ge=1, le=200, description="Кількість записів на сторінці (макс. 200)"),
):
    return {"skip": skip, "limit": limit}

# ─── STATS ────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    return {
        "total_users": db.query(User).count(),
        "total_orgs": db.query(Organization).count(),
        "new_users": db.query(User).filter(User.is_active == True).count(),
        "total_reports": db.query(Report).filter(Report.status == ReportStatus.SUBMITTED).count(),
    }

# ─── USERS ────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    role: Optional[str] = Query(None, description="Фільтр за роллю"),
    is_active: Optional[bool] = Query(None, description="Фільтр за активністю"),
    pg: dict = Depends(paginate),
    db: Session = Depends(get_db),
    _=Depends(RoleChecker(ADMIN_ROLES)),
):
    q = db.query(User)
    if role:
        try:
            q = q.filter(User.role == UserRole(role))
        except ValueError:
            raise HTTPException(400, f"Unknown role: {role}")
    if is_active is not None:
        q = q.filter(User.is_active == is_active)

    total = q.count()
    users = q.order_by(User.email).offset(pg["skip"]).limit(pg["limit"]).all()

    return {
        "total": total,
        "skip": pg["skip"],
        "limit": pg["limit"],
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role": u.role.value,
                "is_active": u.is_active,
                "organization_id": str(u.organization_id) if u.organization_id else None,
            }
            for u in users
        ],
    }

@router.post("/users")
def create_user(body: dict, db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    if db.query(User).filter(User.email == body["email"]).first():
        raise HTTPException(400, "Email already exists")
    user = User(
        email=body["email"],
        hashed_password=get_password_hash(body.get("password", "changeme123")),
        first_name=body.get("first_name"),
        last_name=body.get("last_name"),
        role=UserRole(body.get("role", "USER")),
        is_active=body.get("is_active", True),
        organization_id=UUID(body["organization_id"]) if body.get("organization_id") else None,
    )
    db.add(user)
    db.commit()
    return {"id": str(user.id), "message": "User created"}

@router.put("/users/{user_id}")
def update_user(user_id: UUID, body: dict, db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if "first_name" in body: user.first_name = body["first_name"]
    if "last_name" in body: user.last_name = body["last_name"]
    if "role" in body: user.role = UserRole(body["role"])
    if "is_active" in body: user.is_active = body["is_active"]
    if "organization_id" in body:
        user.organization_id = UUID(body["organization_id"]) if body["organization_id"] else None
    if "password" in body and body["password"]:
        user.hashed_password = get_password_hash(body["password"])
    db.commit()
    return {"message": "User updated"}

@router.delete("/users/{user_id}")
def delete_user(user_id: UUID, db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

# ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

@router.get("/organizations")
def list_orgs(
    pg: dict = Depends(paginate),
    db: Session = Depends(get_db),
    _=Depends(RoleChecker(ADMIN_ROLES)),
):
    q = db.query(Organization).order_by(Organization.name)
    total = q.count()
    orgs = q.offset(pg["skip"]).limit(pg["limit"]).all()
    return {
        "total": total,
        "skip": pg["skip"],
        "limit": pg["limit"],
        "items": [{"id": str(o.id), "name": o.name} for o in orgs],
    }

@router.post("/organizations")
def create_org(body: dict, db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    org = Organization(name=body["name"])
    db.add(org)
    db.commit()
    return {"id": str(org.id), "message": "Organization created"}

@router.put("/organizations/{org_id}")
def update_org(org_id: UUID, body: dict, db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    if "name" in body: org.name = body["name"]
    db.commit()
    return {"message": "Organization updated"}

@router.delete("/organizations/{org_id}")
def delete_org(org_id: UUID, db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    db.delete(org)
    db.commit()
    return {"message": "Organization deleted"}

# ─── TEMPLATES ────────────────────────────────────────────────────────────────

@router.get("/templates")
def list_templates(
    pg: dict = Depends(paginate),
    db: Session = Depends(get_db),
    _=Depends(RoleChecker(ADMIN_ROLES)),
):
    q = db.query(ReportTemplate).order_by(ReportTemplate.name)
    total = q.count()
    templates = q.offset(pg["skip"]).limit(pg["limit"]).all()
    result = []
    for t in templates:
        parts_data = []
        for p in t.parts:
            cats_data = [
                {
                    "id": str(c.id),
                    "name": c.name,
                    "order_num": c.order_num,
                    "controls_count": len(c.controls),
                }
                for c in p.categories
            ]
            parts_data.append({
                "id": str(p.id),
                "name": p.name,
                "order_num": p.order_num,
                "categories": cats_data,
            })
        result.append({
            "id": str(t.id),
            "name": t.name,
            "type": t.type.value,
            "version": t.version,
            "is_active": t.is_active,
            "parts": parts_data,
        })
    return {"total": total, "skip": pg["skip"], "limit": pg["limit"], "items": result}
