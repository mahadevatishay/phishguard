from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Campaign, Target, User, AuditLog
from ..schemas import CampaignCreate, CampaignUpdate, CampaignOut
from ..auth import get_current_admin
from ..models import Admin
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

@router.get("/")
def list_campaigns(skip: int = 0, limit: int = 100, status: Optional[str] = None,
                   db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    q = db.query(Campaign)
    if status:
        q = q.filter(Campaign.status == status)
    campaigns = q.order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for c in campaigns:
        targets = db.query(Target).filter(Target.campaign_id == c.id).all()
        sent = sum(1 for t in targets if t.email_sent)
        clicked = sum(1 for t in targets if t.link_clicked)
        reported = sum(1 for t in targets if t.reported)
        submitted = sum(1 for t in targets if t.credentials_submitted)
        result.append({
            "id": c.id, "name": c.name, "description": c.description,
            "status": c.status, "template_id": c.template_id, "admin_id": c.admin_id,
            "launch_date": c.launch_date.isoformat() if c.launch_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "stats": {"total": len(targets), "sent": sent, "clicked": clicked,
                      "reported": reported, "submitted": submitted,
                      "click_rate": round(clicked/sent*100, 1) if sent > 0 else 0}
        })
    return result

@router.post("/")
def create_campaign(data: CampaignCreate, db: Session = Depends(get_db),
                    current: Admin = Depends(get_current_admin)):
    campaign = Campaign(name=data.name, description=data.description,
                        template_id=data.template_id, admin_id=current.id, status="draft")
    db.add(campaign)
    db.flush()
    
    users_to_target = data.target_user_ids or []
    if not users_to_target:
        users_to_target = [u.id for u in db.query(User).filter(User.is_active == True).all()]
    
    for uid in users_to_target:
        token = str(uuid.uuid4()).replace("-", "")
        target = Target(campaign_id=campaign.id, user_id=uid, tracking_token=token)
        db.add(target)
    
    log = AuditLog(admin_id=current.id, action="CREATE_CAMPAIGN", resource_type="campaign",
                   resource_id=campaign.id, details=f"Campaign: {data.name}")
    db.add(log)
    db.commit()
    db.refresh(campaign)
    return {"id": campaign.id, "name": campaign.name, "status": campaign.status,
            "targets_count": len(users_to_target)}

@router.get("/{campaign_id}")
def get_campaign(campaign_id: int, db: Session = Depends(get_db),
                 current: Admin = Depends(get_current_admin)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    targets = db.query(Target).filter(Target.campaign_id == campaign_id).all()
    target_details = []
    for t in targets:
        user = db.query(User).filter(User.id == t.user_id).first()
        target_details.append({
            "id": t.id, "user_id": t.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "department": user.department if user else None,
            "tracking_token": t.tracking_token,
            "email_sent": t.email_sent, "email_opened": t.email_opened,
            "link_clicked": t.link_clicked, "credentials_submitted": t.credentials_submitted,
            "reported": t.reported, "training_completed": t.training_completed,
            "sent_at": t.sent_at.isoformat() if t.sent_at else None,
            "clicked_at": t.clicked_at.isoformat() if t.clicked_at else None,
        })
    
    sent = sum(1 for t in targets if t.email_sent)
    clicked = sum(1 for t in targets if t.link_clicked)
    reported = sum(1 for t in targets if t.reported)
    submitted = sum(1 for t in targets if t.credentials_submitted)
    
    return {
        "id": c.id, "name": c.name, "description": c.description, "status": c.status,
        "template_id": c.template_id, "admin_id": c.admin_id,
        "launch_date": c.launch_date.isoformat() if c.launch_date else None,
        "end_date": c.end_date.isoformat() if c.end_date else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "stats": {"total": len(targets), "sent": sent, "clicked": clicked,
                  "reported": reported, "submitted": submitted,
                  "click_rate": round(clicked/sent*100, 1) if sent > 0 else 0,
                  "report_rate": round(reported/sent*100, 1) if sent > 0 else 0,
                  "submission_rate": round(submitted/sent*100, 1) if sent > 0 else 0},
        "targets": target_details
    }

@router.patch("/{campaign_id}")
def update_campaign(campaign_id: int, data: CampaignUpdate, db: Session = Depends(get_db),
                    current: Admin = Depends(get_current_admin)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if data.name: c.name = data.name
    if data.description is not None: c.description = data.description
    if data.status: c.status = data.status
    if data.template_id: c.template_id = data.template_id
    if data.status == "running" and not c.launch_date:
        c.launch_date = datetime.utcnow()
    if data.status == "completed" and not c.end_date:
        c.end_date = datetime.utcnow()
    db.commit()
    return {"message": "Campaign updated", "status": c.status}

@router.post("/{campaign_id}/launch")
def launch_campaign(campaign_id: int, db: Session = Depends(get_db),
                    current: Admin = Depends(get_current_admin)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    c.status = "running"
    c.launch_date = datetime.utcnow()
    # Simulate email sending
    targets = db.query(Target).filter(Target.campaign_id == campaign_id).all()
    for t in targets:
        t.email_sent = True
        t.sent_at = datetime.utcnow()
    log = AuditLog(admin_id=current.id, action="LAUNCH_CAMPAIGN", resource_type="campaign",
                   resource_id=campaign_id, details=f"Launched to {len(targets)} targets (mock)")
    db.add(log)
    db.commit()
    return {"message": f"Campaign launched (mock). {len(targets)} emails simulated."}

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db),
                    current: Admin = Depends(get_current_admin)):
    c = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(c)
    db.commit()
    return {"message": "Campaign deleted"}
