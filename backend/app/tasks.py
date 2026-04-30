import json
import os
from uuid import UUID
from .celery_app import celery_app
from .database import SessionLocal
from .models import Report, ReportAnswer, ReportStatus, Notification, UserRole
from .logger import logger

@celery_app.task(name="process_report_submission")
def process_report_submission(payload_str: str, author_id: str, organization_id: str, evidence_files: list):
    """
    Background worker task to process report data, update the database,
    assign scores (if implemented), and create notification.
    """
    payload = json.loads(payload_str)
    template_id = payload.get("template_id")
    answers = payload.get("answers", [])
    report_id = payload.get("report_id")
    status_str = payload.get("status", "SUBMITTED")
    report_status = ReportStatus.SUBMITTED if status_str == "SUBMITTED" else ReportStatus.DRAFT
    
    db = SessionLocal()
    try:
        new_report = None
        if report_id:
            try:
                parsed_id = UUID(report_id)
                new_report = db.query(Report).filter(Report.id == parsed_id, Report.author_id == UUID(author_id)).first()
            except ValueError:
                pass

        if new_report and new_report.status == ReportStatus.DRAFT:
            new_report.status = report_status
            db.query(ReportAnswer).filter(ReportAnswer.report_id == new_report.id).delete()
            db.flush()
        else:
            new_report = Report(
                organization_id=UUID(organization_id), 
                template_id=UUID(template_id), 
                author_id=UUID(author_id), 
                status=report_status
            )
            db.add(new_report)
            db.flush()

        # Map saved evidence file paths
        evidence_dict = {f["control_id"]: f["file_path"] for f in evidence_files}

        for ans in answers:
            control_id = ans.get("control_id")
            evidence_path = evidence_dict.get(control_id)
            selected_option_id = ans.get("selected_option_id")
            
            db.add(ReportAnswer(
                report_id=new_report.id, 
                control_id=UUID(control_id), 
                selected_option_id=UUID(selected_option_id) if selected_option_id else None, 
                evidence_file_path=evidence_path
            ))

        # Archive older reports
        if report_status == ReportStatus.SUBMITTED:
            for r in db.query(Report).filter(
                Report.author_id == UUID(author_id),
                Report.template_id == UUID(template_id),
                Report.status.in_([ReportStatus.SUBMITTED, ReportStatus.RETURNED]),
                Report.id != new_report.id
            ).all():
                r.status = ReportStatus.ARCHIVED
            
            # Send notification asynchronously
            send_notification.delay(
                title="Новий звіт подано",
                message="Користувач подав новий звіт на перевірку. Перевірте реєстр.",
                target_role=UserRole.ANALYST.value
            )

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Worker Error processing report: {e}", exc_info=True)
    finally:
        db.close()

@celery_app.task(name="send_notification")
def send_notification(title: str, message: str, user_id: str = None, target_role: str = None):
    """
    Background worker task to dispatch notifications without blocking the API.
    """
    db = SessionLocal()
    try:
        notif = Notification(
            title=title,
            message=message,
            user_id=UUID(user_id) if user_id else None,
            target_role=UserRole(target_role) if target_role else None
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Worker Error sending notification: {e}", exc_info=True)
    finally:
        db.close()
