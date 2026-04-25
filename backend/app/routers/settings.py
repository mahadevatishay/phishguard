from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AppSettings, AuditLog
from ..auth import get_current_admin
from ..models import Admin

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/")
def get_settings(db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    settings = db.query(AppSettings).all()
    return {s.key: s.value for s in settings}

@router.post("/")
def update_setting(data: dict, db: Session = Depends(get_db),
                   current: Admin = Depends(get_current_admin)):
    for key, value in data.items():
        existing = db.query(AppSettings).filter(AppSettings.key == key).first()
        if existing:
            existing.value = str(value)
        else:
            db.add(AppSettings(key=key, value=str(value)))
    log = AuditLog(admin_id=current.id, action="UPDATE_SETTINGS",
                   details=f"Updated: {', '.join(data.keys())}")
    db.add(log)
    db.commit()
    return {"message": "Settings updated"}

@router.get("/training-modules")
def get_training_modules(db: Session = Depends(get_db)):
    from ..models import TrainingModule
    modules = db.query(TrainingModule).filter(TrainingModule.is_active == True).all()
    return [{"id": m.id, "title": m.title, "content": m.content, "category": m.category,
             "duration_minutes": m.duration_minutes} for m in modules]
