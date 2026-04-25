from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth
import csv, io
from datetime import datetime

reports_router = APIRouter(prefix="/api/reports", tags=["reports"])
settings_router = APIRouter(prefix="/api/settings", tags=["settings"])
training_router = APIRouter(prefix="/api/training", tags=["training"])

# ── Reports ──────────────────────────────────────────────
@reports_router.get("/campaigns")
def report_campaigns(db: Session = Depends(get_db), _=Depends(auth.get_current_admin)):
    campaigns = db.query(models.Campaign).all()
    result = []
    for c in campaigns:
        targets = db.query(models.Target).filter(models.Target.campaign_id == c.id).all()
        ids = [t.id for t in targets]
        clicks = db.query(models.ClickEvent).filter(models.ClickEvent.target_id.in_(ids)).count() if ids else 0
        reports = db.query(models.ReportEvent).filter(models.ReportEvent.target_id.in_(ids)).count() if ids else 0
        subs = db.query(models.SubmissionEvent).filter(models.SubmissionEvent.target_id.in_(ids)).count() if ids else 0
        sent = db.query(models.SendLog).filter(models.SendLog.campaign_id == c.id).count()
        result.append({
            "id": c.id, "name": c.name, "status": c.status,
            "created_at": c.created_at, "targets": len(targets),
            "sent": sent, "clicks": clicks, "reports": reports, "submissions": subs,
            "click_rate": round(clicks/len(targets)*100 if targets else 0, 1),
            "report_rate": round(reports/len(targets)*100 if targets else 0, 1),
        })
    return result

@reports_router.get("/export-csv")
def export_csv(db: Session = Depends(get_db), _=Depends(auth.get_current_admin)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Campaign", "Status", "Targets", "Sent", "Clicks", "Reports", "Submissions", "Click Rate%", "Report Rate%", "Created"])
    
    campaigns = db.query(models.Campaign).all()
    for c in campaigns:
        targets = db.query(models.Target).filter(models.Target.campaign_id == c.id).all()
        ids = [t.id for t in targets]
        clicks = db.query(models.ClickEvent).filter(models.ClickEvent.target_id.in_(ids)).count() if ids else 0
        reports = db.query(models.ReportEvent).filter(models.ReportEvent.target_id.in_(ids)).count() if ids else 0
        subs = db.query(models.SubmissionEvent).filter(models.SubmissionEvent.target_id.in_(ids)).count() if ids else 0
        sent = db.query(models.SendLog).filter(models.SendLog.campaign_id == c.id).count()
        writer.writerow([c.name, c.status, len(targets), sent, clicks, reports, subs,
                        round(clicks/len(targets)*100 if targets else 0, 1),
                        round(reports/len(targets)*100 if targets else 0, 1),
                        c.created_at.strftime("%Y-%m-%d") if c.created_at else ""])
    
    return Response(content=output.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=phishguard_report.csv"})

@reports_router.get("/users-risk")
def users_risk_report(db: Session = Depends(get_db), _=Depends(auth.get_current_admin)):
    users = db.query(models.User).filter(models.User.is_active == True).order_by(models.User.risk_score.desc()).all()
    return [{"name": u.name, "email": u.email, "department": u.department, "risk_score": u.risk_score} for u in users]

# ── Settings ─────────────────────────────────────────────
@settings_router.get("", response_model=schemas.SettingsOut)
def get_settings(db: Session = Depends(get_db), _=Depends(auth.get_current_admin)):
    s = db.query(models.OrganizationSettings).first()
    if not s:
        s = models.OrganizationSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return s

@settings_router.put("", response_model=schemas.SettingsOut)
def update_settings(data: schemas.SettingsUpdate, db: Session = Depends(get_db), admin=Depends(auth.get_current_admin)):
    s = db.query(models.OrganizationSettings).first()
    if not s:
        s = models.OrganizationSettings()
        db.add(s)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    auth.log_audit(db, admin.id, "UPDATE_SETTINGS")
    return s

# ── Training ─────────────────────────────────────────────
@training_router.get("", response_model=list[schemas.TrainingModuleOut])
def list_modules(db: Session = Depends(get_db)):
    return db.query(models.TrainingModule).filter(models.TrainingModule.is_active == True).all()

@training_router.get("/{module_id}", response_model=schemas.TrainingModuleOut)
def get_module(module_id: int, db: Session = Depends(get_db)):
    m = db.query(models.TrainingModule).filter(models.TrainingModule.id == module_id).first()
    if not m:
        from fastapi import HTTPException
        raise HTTPException(404, "Module not found")
    return m
