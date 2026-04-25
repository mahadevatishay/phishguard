from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class CampaignStatus(str, enum.Enum):
    draft = "draft"
    running = "running"
    paused = "paused"
    completed = "completed"

class AdminRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True)
    hashed_password = Column(String)
    role = Column(String, default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)
    campaigns = relationship("Campaign", back_populates="created_by_admin")
    audit_logs = relationship("AuditLog", back_populates="admin")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    targets = relationship("Target", back_populates="user")

class Template(Base):
    __tablename__ = "templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    subject = Column(String)
    sender_name = Column(String)
    sender_email = Column(String)
    html_body = Column(Text)
    text_body = Column(Text)
    category = Column(String, default="general")
    difficulty = Column(String, default="medium")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    campaigns = relationship("Campaign", back_populates="template")

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    status = Column(String, default="draft")
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    admin_id = Column(Integer, ForeignKey("admins.id"))
    launch_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    template = relationship("Template", back_populates="campaigns")
    created_by_admin = relationship("Admin", back_populates="campaigns")
    targets = relationship("Target", back_populates="campaign")

class Target(Base):
    __tablename__ = "targets"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    tracking_token = Column(String, unique=True, index=True)
    email_sent = Column(Boolean, default=False)
    email_opened = Column(Boolean, default=False)
    link_clicked = Column(Boolean, default=False)
    credentials_submitted = Column(Boolean, default=False)
    reported = Column(Boolean, default=False)
    training_completed = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    reported_at = Column(DateTime, nullable=True)
    campaign = relationship("Campaign", back_populates="targets")
    user = relationship("User", back_populates="targets")
    click_events = relationship("ClickEvent", back_populates="target")
    report_events = relationship("ReportEvent", back_populates="target")
    submission_events = relationship("SubmissionEvent", back_populates="target")

class SendLog(Base):
    __tablename__ = "send_logs"
    id = Column(Integer, primary_key=True)
    target_id = Column(Integer, ForeignKey("targets.id"))
    status = Column(String)
    message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=func.now())

class ClickEvent(Base):
    __tablename__ = "click_events"
    id = Column(Integer, primary_key=True)
    target_id = Column(Integer, ForeignKey("targets.id"))
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    device_type = Column(String, nullable=True)
    clicked_at = Column(DateTime, default=func.now())
    target = relationship("Target", back_populates="click_events")

class ReportEvent(Base):
    __tablename__ = "report_events"
    id = Column(Integer, primary_key=True)
    target_id = Column(Integer, ForeignKey("targets.id"))
    reported_at = Column(DateTime, default=func.now())
    target = relationship("Target", back_populates="report_events")

class SubmissionEvent(Base):
    __tablename__ = "submission_events"
    id = Column(Integer, primary_key=True)
    target_id = Column(Integer, ForeignKey("targets.id"))
    submitted_at = Column(DateTime, default=func.now())
    target = relationship("Target", back_populates="submission_events")

class TrainingModule(Base):
    __tablename__ = "training_modules"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    content = Column(Text)
    category = Column(String)
    duration_minutes = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    action = Column(String)
    resource_type = Column(String, nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=func.now())
    admin = relationship("Admin", back_populates="audit_logs")

class AppSettings(Base):
    __tablename__ = "app_settings"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
