from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import User, UserRole, Organization, ReportTemplate, TemplatePart, TemplateCategory, TemplateControl, ControlOption, Report, ReportStatus
from ..auth import get_password_hash, RoleChecker
from ..schemas import UserRead

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_ROLES = [UserRole.FUNC_ADMIN]

# ─── STATS ──────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    total_users = db.query(User).count()
    total_orgs = db.query(Organization).count()
    new_users = db.query(User).filter(User.is_active == True).count()
    total_reports = db.query(Report).filter(Report.status == ReportStatus.SUBMITTED).count()
    return {
        "total_users": total_users,
        "total_orgs": total_orgs,
        "new_users": new_users,
        "total_reports": total_reports,
    }

# ─── USERS ───────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    users = db.query(User).order_by(User.email).all()
    return [
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
    ]

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
def list_orgs(db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    orgs = db.query(Organization).order_by(Organization.name).all()
    return [{"id": str(o.id), "name": o.name} for o in orgs]

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
def list_templates(db: Session = Depends(get_db), _=Depends(RoleChecker(ADMIN_ROLES))):
    templates = db.query(ReportTemplate).order_by(ReportTemplate.name).all()
    result = []
    for t in templates:
        parts_data = []
        for p in t.parts:
            cats_data = []
            for c in p.categories:
                cats_data.append({
                    "id": str(c.id),
                    "name": c.name,
                    "order_num": c.order_num,
                    "controls_count": len(c.controls),
                })
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
    return result
