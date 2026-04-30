import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, DateTime, Text, Enum, Index
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


# --- IAM ---
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)

    __table_args__ = (
        # Full-text search by org name (admin list, analyst org view)
        Index("ix_organizations_name", "name"),
    )

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)          # already unique → auto-index
    hashed_password = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)

    reports = relationship("Report", back_populates="author")

    __table_args__ = (
        # Admin: filter users by role (list_users?role=ANALYST)
        Index("ix_users_role", "role"),
        # Admin: filter active/inactive users
        Index("ix_users_is_active", "is_active"),
        # Lookup users by org (show all users of an org)
        Index("ix_users_organization_id", "organization_id"),
    )

class UserSession(Base):
    """Kept in schema for Alembic compatibility — no longer written by app logic."""
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

    __table_args__ = (
        # Filter active templates (most queries exclude archived ones)
        Index("ix_report_templates_is_active", "is_active"),
    )

class TemplatePart(Base):
    __tablename__ = "template_parts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("report_templates.id"), nullable=False)
    name = Column(String, nullable=False)
    order_num = Column(Integer, nullable=False)

    template = relationship("ReportTemplate", back_populates="parts")
    categories = relationship("TemplateCategory", back_populates="part", cascade="all, delete-orphan", order_by="TemplateCategory.order_num")

    __table_args__ = (
        Index("ix_template_parts_template_id", "template_id"),
    )

class TemplateCategory(Base):
    __tablename__ = "template_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_id = Column(UUID(as_uuid=True), ForeignKey("template_parts.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_num = Column(Integer, nullable=False)

    part = relationship("TemplatePart", back_populates="categories")
    controls = relationship("TemplateControl", back_populates="category", cascade="all, delete-orphan", order_by="TemplateControl.order_num")

    __table_args__ = (
        Index("ix_template_categories_part_id", "part_id"),
    )

class TemplateControl(Base):
    __tablename__ = "template_controls"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("template_categories.id"), nullable=False)
    code = Column(String, nullable=True)
    question_text = Column(Text, nullable=False)
    control_type = Column(Enum(ControlType), nullable=False)
    is_required = Column(Boolean, default=True)
    weight = Column(Integer, default=1)
    order_num = Column(Integer, nullable=False)

    category = relationship("TemplateCategory", back_populates="controls")
    options = relationship("ControlOption", back_populates="control", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_template_controls_category_id", "category_id"),
    )

class ControlOption(Base):
    __tablename__ = "control_options"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    control_id = Column(UUID(as_uuid=True), ForeignKey("template_controls.id"), nullable=False)
    label = Column(String, nullable=False)
    score_multiplier = Column(Float, nullable=True)
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

    __table_args__ = (
        # Most frequent query: all reports by a user (my reports page)
        Index("ix_reports_author_id", "author_id"),
        # Analyst: filter by status (SUBMITTED/RETURNED/ARCHIVED)
        Index("ix_reports_status", "status"),
        # Archiving: find reports by author+template+status
        Index("ix_reports_author_template_status", "author_id", "template_id", "status"),
        # Analyst registry: latest first (used in ORDER BY)
        Index("ix_reports_created_at", "created_at"),
        # Org-level report lookup
        Index("ix_reports_organization_id", "organization_id"),
    )

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

    __table_args__ = (
        # Load all answers for a report in one query
        Index("ix_report_answers_report_id", "report_id"),
    )


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    target_role = Column(Enum(UserRole), nullable=True)

    __table_args__ = (
        # Personal notifications lookup
        Index("ix_notifications_user_id", "user_id"),
        # Role-based notifications lookup
        Index("ix_notifications_target_role", "target_role"),
        # Unread filter (common in badge counters)
        Index("ix_notifications_is_read", "is_read"),
    )
