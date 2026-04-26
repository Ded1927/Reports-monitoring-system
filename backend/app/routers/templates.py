from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import ReportTemplate, ReportType, TemplatePart, TemplateCategory, TemplateControl
from ..schemas import ReportTemplateSchema

router = APIRouter(
    prefix="/templates",
    tags=["Templates"]
)

@router.get("/active", response_model=ReportTemplateSchema)
def get_active_template(db: Session = Depends(get_db)):
    # Fetch the active self-assessment template with all nested relationships loaded eagerly
    template = db.query(ReportTemplate).options(
        joinedload(ReportTemplate.parts)
        .joinedload(TemplatePart.categories)
        .joinedload(TemplateCategory.controls)
        .joinedload(TemplateControl.options)
    ).filter(
        ReportTemplate.is_active == True,
        ReportTemplate.type == ReportType.SELF_ASSESSMENT
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Active template not found")
        
    return template
