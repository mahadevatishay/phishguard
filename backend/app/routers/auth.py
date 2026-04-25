from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Admin, AuditLog
from ..schemas import AdminLogin, TokenResponse, AdminCreate
from ..auth import verify_password, get_password_hash, create_access_token, get_current_admin
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
def login(credentials: AdminLogin, request: Request, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == credentials.email).first()
    if not admin or not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    admin.last_login = datetime.utcnow()
    log = AuditLog(admin_id=admin.id, action="LOGIN", resource_type="admin",
                   resource_id=admin.id, ip_address=request.client.host if request.client else "unknown")
    db.add(log)
    db.commit()
    
    token = create_access_token({"sub": str(admin.id), "role": admin.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {"id": admin.id, "email": admin.email, "username": admin.username, "role": admin.role}
    }

@router.get("/me")
def get_me(current_admin: Admin = Depends(get_current_admin)):
    return {"id": current_admin.id, "email": current_admin.email, 
            "username": current_admin.username, "role": current_admin.role}

@router.post("/create-admin")
def create_admin(data: AdminCreate, db: Session = Depends(get_db), 
                 current: Admin = Depends(get_current_admin)):
    if current.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can create new admins")
    existing = db.query(Admin).filter(Admin.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    admin = Admin(email=data.email, username=data.username,
                  hashed_password=get_password_hash(data.password), role=data.role)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"message": "Admin created", "id": admin.id}

@router.get("/audit-logs")
def get_audit_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db),
                   current: Admin = Depends(get_current_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return [{"id": l.id, "admin_id": l.admin_id, "action": l.action, 
             "resource_type": l.resource_type, "resource_id": l.resource_id,
             "details": l.details, "ip_address": l.ip_address,
             "timestamp": l.timestamp.isoformat() if l.timestamp else None} for l in logs]
