import os
import json
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Report, ReportAnswer, ReportStatus, Organization, User, ReportTemplate, UserRole
from ..auth import get_current_active_user, RoleChecker
from uuid import UUID

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

UPLOAD_DIR = "/app/storage/evidence"

@router.get("/my")
async def get_my_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    user = current_user

    
    results = db.query(Report, ReportTemplate).join(ReportTemplate, Report.template_id == ReportTemplate.id).filter(Report.author_id == user.id).order_by(Report.created_at.desc()).all()
    
    reports_data = []
    for report, template in results:
        reports_data.append({
            "id": report.id,
            "template_name": template.name,
            "template_type": template.type.value,
            "status": report.status.value,
            "created_at": report.created_at.isoformat() if report.created_at else None
        })
    return reports_data

@router.get("/all")
async def get_all_reports(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([UserRole.ANALYST, UserRole.FUNC_ADMIN]))):
    # Аналітик бачить тільки ті звіти, які не є чернетками
    results = db.query(Report, ReportTemplate, User).join(
        ReportTemplate, Report.template_id == ReportTemplate.id
    ).join(
        User, Report.author_id == User.id
    ).filter(
        Report.status.in_([ReportStatus.SUBMITTED, ReportStatus.RETURNED])
    ).order_by(Report.created_at.desc()).all()
    
    reports_data = []
    for report, template, user in results:
        reports_data.append({
            "id": report.id,
            "template_name": template.name,
            "template_type": template.type.value,
            "status": report.status.value,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "author_email": user.email
        })
    return reports_data

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
        
    return {
        "id": report.id,
        "template_id": report.template_id,
        "status": report.status.value,
        "answers": answers_dict
    }

@router.post("/{report_id}/return")
async def return_report(report_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([UserRole.ANALYST, UserRole.FUNC_ADMIN]))):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != ReportStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted reports can be returned")
    report.status = ReportStatus.RETURNED
    db.commit()
    return {"message": "Report returned for revision"}

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

    user = current_user
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise HTTPException(status_code=400, detail="User has no organization")

    status_str = payload.get("status", "SUBMITTED")
    report_status = ReportStatus.SUBMITTED if status_str == "SUBMITTED" else ReportStatus.DRAFT

    new_report = None
    if report_id:
        try:
            parsed_id = UUID(report_id)
            new_report = db.query(Report).filter(Report.id == parsed_id, Report.author_id == user.id).first()
        except ValueError:
            pass

    if new_report and new_report.status == ReportStatus.DRAFT:
        new_report.status = report_status
        db.query(ReportAnswer).filter(ReportAnswer.report_id == new_report.id).delete()
        db.flush()
    else:
        new_report = Report(
            organization_id=org.id,
            template_id=template_id,
            author_id=user.id,
            status=report_status
        )
        db.add(new_report)
        db.flush()

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    for ans in answers:
        control_id = ans.get("control_id")
        selected_option_id = ans.get("selected_option_id")
        
        evidence_path = None
        file_field = f"file_{control_id}"
        if file_field in form:
            file_data = form[file_field]
            if isinstance(file_data, UploadFile) and file_data.filename:
                file_path = os.path.join(UPLOAD_DIR, f"{new_report.id}_{control_id}_{file_data.filename}")
                with open(file_path, "wb") as f:
                    f.write(await file_data.read())
                evidence_path = file_path

        db_answer = ReportAnswer(
            report_id=new_report.id,
            control_id=control_id,
            selected_option_id=selected_option_id,
            evidence_file_path=evidence_path
        )
        db.add(db_answer)

    # Архівація попередніх звітів
    if report_status == ReportStatus.SUBMITTED:
        older_reports = db.query(Report).filter(
            Report.author_id == user.id,
            Report.template_id == template_id,
            Report.status.in_([ReportStatus.SUBMITTED, ReportStatus.RETURNED]),
            Report.id != new_report.id
        ).all()
        for r in older_reports:
            r.status = ReportStatus.ARCHIVED

    db.commit()
    return {"status": "success", "report_id": str(new_report.id), "message": "Звіт успішно збережено"}
