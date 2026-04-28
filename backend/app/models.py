import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from .database import Base

class ReportType(enum.Enum):
    SELF_ASSESSMENT = "SELF_ASSESSMENT"
    EXTERNAL_ASSESSMENT = "EXTERNAL_ASSESSMENT"

class ControlType(enum.Enum):
    BOOLEAN = "BOOLEAN"
    SELECT = "SELECT"
    TEXT = "TEXT"
    FILE_UPLOAD = "FILE_UPLOAD"

class ReportStatus(enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    RETURNED = "RETURNED"
    ARCHIVED = "ARCHIVED"

class UserRole(enum.Enum):
    USER = "USER"
    ANALYST = "ANALYST"
    OBSERVER = "OBSERVER"
    FUNC_ADMIN = "FUNC_ADMIN"
    TECH_ADMIN = "TECH_ADMIN"


# --- IAM STUBS ---
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    reports = relationship("Report", back_populates="author")

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

# --- REPORT TEMPLATES ---
class ReportTemplate(Base):
    __tablename__ = "report_templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(Enum(ReportType), nullable=False)
    version = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parts = relationship("TemplatePart", back_populates="template", cascade="all, delete-orphan", order_by="TemplatePart.order_num")

class TemplatePart(Base):
    __tablename__ = "template_parts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("report_templates.id"), nullable=False)
    name = Column(String, nullable=False) # e.g. "Базові заходи", "Вимоги законодавства"
    order_num = Column(Integer, nullable=False)

    template = relationship("ReportTemplate", back_populates="parts")
    categories = relationship("TemplateCategory", back_populates="part", cascade="all, delete-orphan", order_by="TemplateCategory.order_num")

class TemplateCategory(Base):
    __tablename__ = "template_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_id = Column(UUID(as_uuid=True), ForeignKey("template_parts.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_num = Column(Integer, nullable=False)

    part = relationship("TemplatePart", back_populates="categories")
    controls = relationship("TemplateControl", back_populates="category", cascade="all, delete-orphan", order_by="TemplateControl.order_num")

class TemplateControl(Base):
    __tablename__ = "template_controls"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("template_categories.id"), nullable=False)
    code = Column(String, nullable=True) # e.g. GV.OC-01
    question_text = Column(Text, nullable=False)
    control_type = Column(Enum(ControlType), nullable=False)
    is_required = Column(Boolean, default=True)
    weight = Column(Integer, default=1)
    order_num = Column(Integer, nullable=False)

    category = relationship("TemplateCategory", back_populates="controls")
    options = relationship("ControlOption", back_populates="control", cascade="all, delete-orphan")

class ControlOption(Base):
    __tablename__ = "control_options"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    control_id = Column(UUID(as_uuid=True), ForeignKey("template_controls.id"), nullable=False)
    label = Column(String, nullable=False) # e.g. "Позитивно"
    score_multiplier = Column(Float, nullable=True) # e.g. 1.0, 0.5. Null means "Не застосовується"
    order_num = Column(Integer, nullable=False)

    control = relationship("TemplateControl", back_populates="options")

# --- SUBMITTED REPORTS ---
class Report(Base):
    __tablename__ = "reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("report_templates.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.DRAFT)
    total_score_part1 = Column(Float, nullable=True)
    total_score_part2 = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    is_signed_kep = Column(Boolean, default=False)
    registration_number = Column(String, nullable=True, unique=True, index=True)

    author = relationship("User", back_populates="reports")
    answers = relationship("ReportAnswer", back_populates="report", cascade="all, delete-orphan")

class ReportAnswer(Base):
    __tablename__ = "report_answers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    control_id = Column(UUID(as_uuid=True), ForeignKey("template_controls.id"), nullable=False)
    selected_option_id = Column(UUID(as_uuid=True), ForeignKey("control_options.id"), nullable=True)
    text_answer = Column(Text, nullable=True)
    evidence_file_path = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    auditor_note = Column(Text, nullable=True)

    report = relationship("Report", back_populates="answers")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    # Для USER: конкретний акаунт. Якщо NULL — спільне для ролі.
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    # Для ANALYST/FUNC_ADMIN: спільні сповіщення для ролі
    target_role = Column(Enum(UserRole), nullable=True)
