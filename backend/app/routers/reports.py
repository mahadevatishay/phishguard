from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Campaign, Target, User
from ..auth import get_current_admin
from ..models import Admin
import csv, io

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/export/csv")
def export_csv(campaign_id: int = None, db: Session = Depends(get_db),
               current: Admin = Depends(get_current_admin)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Campaign ID", "Campaign Name", "User Email", "User Name",
                     "Department", "Email Sent", "Link Clicked", "Credentials Submitted",
                     "Reported", "Training Completed", "Risk Score", "Clicked At"])
    
    q = db.query(Target)
    if campaign_id:
        q = q.filter(Target.campaign_id == campaign_id)
    targets = q.all()
    
    for t in targets:
        user = db.query(User).filter(User.id == t.user_id).first()
        campaign = db.query(Campaign).filter(Campaign.id == t.campaign_id).first()
        writer.writerow([
            t.campaign_id, campaign.name if campaign else "N/A",
            user.email if user else "N/A",
            f"{user.first_name} {user.last_name}" if user else "N/A",
            user.department if user else "N/A",
            t.email_sent, t.link_clicked, t.credentials_submitted,
            t.reported, t.training_completed,
            user.risk_score if user else 0,
            t.clicked_at.isoformat() if t.clicked_at else "N/A"
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=phishguard_report.csv"}
    )

@router.get("/summary")
def reports_summary(db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    result = []
    for c in campaigns:
        targets = db.query(Target).filter(Target.campaign_id == c.id).all()
        sent = sum(1 for t in targets if t.email_sent)
        clicked = sum(1 for t in targets if t.link_clicked)
        reported = sum(1 for t in targets if t.reported)
        submitted = sum(1 for t in targets if t.credentials_submitted)
        trained = sum(1 for t in targets if t.training_completed)
        result.append({
            "id": c.id, "name": c.name, "status": c.status,
            "launch_date": c.launch_date.isoformat() if c.launch_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "total_targets": len(targets), "sent": sent, "clicked": clicked,
            "reported": reported, "submitted": submitted, "trained": trained,
            "click_rate": round(clicked/sent*100, 1) if sent > 0 else 0,
            "report_rate": round(reported/sent*100, 1) if sent > 0 else 0,
            "submission_rate": round(submitted/sent*100, 1) if sent > 0 else 0,
        })
    return result
