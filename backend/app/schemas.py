from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth
class AdminLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    admin: dict

# Admin
class AdminCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = "admin"

class AdminOut(BaseModel):
    id: int
    email: str
    username: str
    role: str
    is_active: bool
    created_at: datetime
    class Config: from_attributes = True

# User
class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    department: Optional[str] = None
    position: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    department: Optional[str]
    position: Optional[str]
    is_active: bool
    risk_score: float
    created_at: datetime
    class Config: from_attributes = True

# Template
class TemplateCreate(BaseModel):
    name: str
    subject: str
    sender_name: str
    sender_email: str
    html_body: str
    text_body: str
    category: str = "general"
    difficulty: str = "medium"

class TemplateOut(BaseModel):
    id: int
    name: str
    subject: str
    sender_name: str
    sender_email: str
    html_body: str
    text_body: str
    category: str
    difficulty: str
    is_active: bool
    created_at: datetime
    class Config: from_attributes = True

# Campaign
class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: Optional[int] = None
    target_user_ids: Optional[List[int]] = []

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    template_id: Optional[int] = None

class CampaignOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    template_id: Optional[int]
    admin_id: int
    launch_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime
    class Config: from_attributes = True

# Settings
class SettingUpdate(BaseModel):
    key: str
    value: str

# Analytics
class DashboardStats(BaseModel):
    total_campaigns: int
    active_campaigns: int
    total_users: int
    total_sent: int
    total_clicked: int
    total_reported: int
    total_submitted: int
    click_rate: float
    report_rate: float
    submission_rate: float
