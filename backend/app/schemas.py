from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from .models import ReportType, ControlType, UserRole

class ControlOptionSchema(BaseModel):
    id: UUID
    label: str
    score_multiplier: Optional[float]
    order_num: int
    model_config = ConfigDict(from_attributes=True)

class TemplateControlSchema(BaseModel):
    id: UUID
    code: Optional[str]
    question_text: str
    control_type: ControlType
    is_required: bool
    weight: int
    order_num: int
    options: List[ControlOptionSchema] = []
    model_config = ConfigDict(from_attributes=True)

class TemplateCategorySchema(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    order_num: int
    controls: List[TemplateControlSchema] = []
    model_config = ConfigDict(from_attributes=True)

class TemplatePartSchema(BaseModel):
    id: UUID
    name: str
    order_num: int
    categories: List[TemplateCategorySchema] = []
    model_config = ConfigDict(from_attributes=True)

class ReportTemplateSchema(BaseModel):
    id: UUID
    name: str
    type: ReportType
    version: str
    is_active: bool
    parts: List[TemplatePartSchema] = []
    model_config = ConfigDict(from_attributes=True)

class ReportAnswerSubmitSchema(BaseModel):
    control_id: UUID
    selected_option_id: Optional[UUID] = None
    text_answer: Optional[str] = None

class ReportSubmitSchema(BaseModel):
    template_id: UUID
    answers: List[ReportAnswerSubmitSchema]

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.USER
    is_active: bool = True
    organization_id: Optional[UUID] = None

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class UserUpdateProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
