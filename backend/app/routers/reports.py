import os
import json
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Report, ReportAnswer, ReportStatus, Organization, User, ReportTemplate
from uuid import UUID

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

UPLOAD_DIR = "/app/storage/evidence"

@router.get("/my")
async def get_my_reports(db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email="test@cyber.gov.ua").first()
    if not user:
        return []
    
    results = db.query(Report, ReportTemplate).join(ReportTemplate, Report.template_id == ReportTemplate.id).filter(Report.author_id == user.id).order_by(Report.created_at.desc()).all()
    
    reports_data = []
    for report, template in results:
        reports_data.append({
            "id": report.id,
            "template_name": template.name,
            "status": report.status.value,
            "created_at": report.created_at.isoformat() if report.created_at else None
        })
    return reports_data

@router.get("/{report_id}")
async def get_report(report_id: UUID, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
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

@router.post("/submit")
async def submit_report(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    payload_str = form.get("payload")
    if not payload_str:
        raise HTTPException(status_code=400, detail="Missing payload")
    
    payload = json.loads(payload_str)
    template_id = payload.get("template_id")
    answers = payload.get("answers", [])
    report_id = payload.get("report_id")

    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Тестова Організація")
        db.add(org)
        db.commit()
        db.refresh(org)
    
    user = db.query(User).filter_by(email="test@cyber.gov.ua").first()
    if not user:
        user = User(email="test@cyber.gov.ua", organization_id=org.id)
        db.add(user)
        db.commit()
        db.refresh(user)

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

    db.commit()
    return {"status": "success", "report_id": str(new_report.id), "message": "Звіт успішно збережено"}
