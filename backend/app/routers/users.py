from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv, io
from ..database import get_db
from ..models import User, Target, AuditLog
from ..schemas import UserCreate, UserOut
from ..auth import get_current_admin
from ..models import Admin

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/")
def list_users(skip: int = 0, limit: int = 200, search: str = "",
               db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    q = db.query(User)
    if search:
        q = q.filter(
            User.email.contains(search) | User.first_name.contains(search) |
            User.last_name.contains(search) | User.department.contains(search)
        )
    users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for u in users:
        targets = db.query(Target).filter(Target.user_id == u.id).all()
        campaigns_count = len(set(t.campaign_id for t in targets))
        clicked = sum(1 for t in targets if t.link_clicked)
        result.append({
            "id": u.id, "email": u.email, "first_name": u.first_name,
            "last_name": u.last_name, "department": u.department,
            "position": u.position, "is_active": u.is_active,
            "risk_score": u.risk_score, "created_at": u.created_at.isoformat(),
            "campaigns_count": campaigns_count, "click_count": clicked
        })
    return result

@router.post("/")
def create_user(data: UserCreate, db: Session = Depends(get_db),
                current: Admin = Depends(get_current_admin)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "message": "User created"}

@router.post("/bulk-upload")
async def bulk_upload(file: UploadFile = File(...), db: Session = Depends(get_db),
                      current: Admin = Depends(get_current_admin)):
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    created, skipped = 0, 0
    for row in reader:
        email = row.get("email", "").strip()
        if not email:
            continue
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            skipped += 1
            continue
        user = User(
            email=email,
            first_name=row.get("first_name", "").strip(),
            last_name=row.get("last_name", "").strip(),
            department=row.get("department", "").strip() or None,
            position=row.get("position", "").strip() or None
        )
        db.add(user)
        created += 1
    
    log = AuditLog(admin_id=current.id, action="BULK_UPLOAD_USERS",
                   details=f"Created: {created}, Skipped: {skipped}")
    db.add(log)
    db.commit()
    return {"created": created, "skipped": skipped}

@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db),
             current: Admin = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    targets = db.query(Target).filter(Target.user_id == user_id).all()
    history = []
    for t in targets:
        history.append({
            "campaign_id": t.campaign_id, "tracking_token": t.tracking_token,
            "email_sent": t.email_sent, "link_clicked": t.link_clicked,
            "reported": t.reported, "credentials_submitted": t.credentials_submitted,
            "training_completed": t.training_completed,
            "clicked_at": t.clicked_at.isoformat() if t.clicked_at else None
        })
    return {
        "id": user.id, "email": user.email, "first_name": user.first_name,
        "last_name": user.last_name, "department": user.department,
        "position": user.position, "risk_score": user.risk_score,
        "is_active": user.is_active, "created_at": user.created_at.isoformat(),
        "phishing_history": history
    }

@router.patch("/{user_id}")
def update_user(user_id: int, data: dict, db: Session = Depends(get_db),
                current: Admin = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    return {"message": "User updated"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db),
                current: Admin = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
