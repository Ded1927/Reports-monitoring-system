import os
import json
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Report, ReportAnswer, ReportStatus, Organization, User, ReportTemplate, UserRole
from ..auth import get_current_active_user, RoleChecker
from uuid import UUID
import uuid

router = APIRouter(prefix="/reports", tags=["Reports"])

UPLOAD_DIR = "/app/storage/evidence"

def paginate(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    return {"skip": skip, "limit": limit}

# ── My reports (user's own) ───────────────────────────────────────────────────

@router.get("/my")
async def get_my_reports(
    pg: dict = Depends(paginate),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Report, ReportTemplate).join(
        ReportTemplate, Report.template_id == ReportTemplate.id
    ).filter(Report.author_id == current_user.id).order_by(Report.created_at.desc())

    total = q.count()
    results = q.offset(pg["skip"]).limit(pg["limit"]).all()

    return {
        "total": total,
        "skip": pg["skip"],
        "limit": pg["limit"],
        "items": [
            {
                "id": report.id,
                "template_name": template.name,
                "template_type": template.type.value,
                "status": report.status.value,
                "created_at": report.created_at.isoformat() if report.created_at else None,
            }
            for report, template in results
        ],
    }

# ── All reports (analyst/admin) ───────────────────────────────────────────────

@router.get("/all")
async def get_all_reports(
    status: str = Query(None, description="Фільтр за статусом: SUBMITTED, RETURNED, ARCHIVED"),
    pg: dict = Depends(paginate),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ANALYST, UserRole.FUNC_ADMIN])),
):
    allowed_statuses = [ReportStatus.SUBMITTED, ReportStatus.RETURNED]

    q = db.query(Report, ReportTemplate, User).join(
        ReportTemplate, Report.template_id == ReportTemplate.id
    ).join(
        User, Report.author_id == User.id
    )

    if status:
        try:
            q = q.filter(Report.status == ReportStatus(status))
        except ValueError:
            raise HTTPException(400, f"Unknown status: {status}")
    else:
        q = q.filter(Report.status.in_(allowed_statuses))

    q = q.order_by(Report.created_at.desc())
    total = q.count()
    results = q.offset(pg["skip"]).limit(pg["limit"]).all()

    return {
        "total": total,
        "skip": pg["skip"],
        "limit": pg["limit"],
        "items": [
            {
                "id": report.id,
                "template_name": template.name,
                "template_type": template.type.value,
                "status": report.status.value,
                "created_at": report.created_at.isoformat() if report.created_at else None,
                "author_email": user.email,
            }
            for report, template, user in results
        ],
    }

# ── Single report ─────────────────────────────────────────────────────────────

@router.get("/{report_id}")
async def get_report(report_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role == UserRole.USER:
        if report.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this report")
    elif current_user.role == UserRole.ANALYST:
        if report.status == ReportStatus.DRAFT:
            raise HTTPException(status_code=403, detail="Analysts cannot view draft reports")
    answers_dict = {}
    for ans in report.answers:
        if ans.selected_option_id:
            answers_dict[str(ans.control_id)] = str(ans.selected_option_id)
    return {"id": report.id, "template_id": report.template_id, "status": report.status.value, "answers": answers_dict}

# ── Return report ─────────────────────────────────────────────────────────────

@router.post("/{report_id}/return")
async def return_report(report_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([UserRole.ANALYST, UserRole.FUNC_ADMIN]))):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != ReportStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted reports can be returned")
    report.status = ReportStatus.RETURNED
    db.commit()

    from ..tasks import send_notification
    send_notification.delay(
        title="Звіт повернуто на доопрацювання",
        message="Аналітик повернув ваш звіт. Будь ласка, перегляньте зауваження та подайте повторно.",
        user_id=str(report.author_id)
    )

    return {"message": "Report returned for revision"}

# ── Submit / save draft ───────────────────────────────────────────────────────

@router.post("/submit")
async def submit_report(request: Request, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([UserRole.USER]))):
    form = await request.form()
    payload_str = form.get("payload")
    if not payload_str:
        raise HTTPException(status_code=400, detail="Missing payload")
    payload = json.loads(payload_str)
    template_id = payload.get("template_id")
    answers = payload.get("answers", [])
    report_id = payload.get("report_id")

    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=400, detail="User has no organization")

    new_report_id_str = report_id or str(uuid.uuid4())

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    evidence_files = []
    
    for ans in answers:
        control_id = ans.get("control_id")
        file_field = f"file_{control_id}"
        if file_field in form:
            file_data = form[file_field]
            if isinstance(file_data, UploadFile) and file_data.filename:
                file_path = os.path.join(UPLOAD_DIR, f"{new_report_id_str}_{control_id}_{file_data.filename}")
                with open(file_path, "wb") as f:
                    f.write(await file_data.read())
                evidence_files.append({"control_id": control_id, "file_path": file_path})

    from ..tasks import process_report_submission
    # Dispatch to Celery background queue
    process_report_submission.delay(
        payload_str=payload_str,
        author_id=str(current_user.id),
        organization_id=str(org.id),
        evidence_files=evidence_files
    )

    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=202,
        content={"status": "accepted", "message": "Звіт прийнято в обробку"}
    )
