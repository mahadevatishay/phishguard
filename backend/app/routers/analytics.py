from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Campaign, Target, User, ClickEvent, Template, AuditLog
from ..auth import get_current_admin
from ..models import Admin
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    total_campaigns = db.query(Campaign).count()
    active_campaigns = db.query(Campaign).filter(Campaign.status == "running").count()
    total_users = db.query(User).filter(User.is_active == True).count()
    
    all_targets = db.query(Target).all()
    total_sent = sum(1 for t in all_targets if t.email_sent)
    total_clicked = sum(1 for t in all_targets if t.link_clicked)
    total_reported = sum(1 for t in all_targets if t.reported)
    total_submitted = sum(1 for t in all_targets if t.credentials_submitted)
    total_trained = sum(1 for t in all_targets if t.training_completed)
    
    # Recent campaigns trend (last 6 months)
    trend = []
    for i in range(6, 0, -1):
        month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        count = db.query(Campaign).filter(
            Campaign.created_at >= month_start, Campaign.created_at < month_end
        ).count()
        trend.append({"month": month_start.strftime("%b %Y"), "campaigns": count})
    
    # Browser breakdown from click events
    browser_data = db.query(ClickEvent.browser, func.count(ClickEvent.id))\
        .group_by(ClickEvent.browser).all()
    
    # Device breakdown
    device_data = db.query(ClickEvent.device_type, func.count(ClickEvent.id))\
        .group_by(ClickEvent.device_type).all()
    
    # Top risky users
    risky_users = db.query(User).filter(User.risk_score > 0)\
        .order_by(User.risk_score.desc()).limit(5).all()
    
    # Top clicked templates
    template_stats = []
    templates = db.query(Template).filter(Template.is_active == True).all()
    for tmpl in templates:
        campaigns = db.query(Campaign).filter(Campaign.template_id == tmpl.id).all()
        campaign_ids = [c.id for c in campaigns]
        if campaign_ids:
            targets = db.query(Target).filter(Target.campaign_id.in_(campaign_ids)).all()
            clicks = sum(1 for t in targets if t.link_clicked)
            sent = sum(1 for t in targets if t.email_sent)
            if sent > 0:
                template_stats.append({"name": tmpl.name, "click_rate": round(clicks/sent*100, 1), "clicks": clicks})
    template_stats.sort(key=lambda x: x["click_rate"], reverse=True)
    
    return {
        "kpis": {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_users": total_users,
            "total_sent": total_sent,
            "total_clicked": total_clicked,
            "total_reported": total_reported,
            "total_submitted": total_submitted,
            "total_trained": total_trained,
            "click_rate": round(total_clicked/total_sent*100, 1) if total_sent > 0 else 0,
            "report_rate": round(total_reported/total_sent*100, 1) if total_sent > 0 else 0,
            "submission_rate": round(total_submitted/total_sent*100, 1) if total_sent > 0 else 0,
            "completion_rate": round(total_trained/total_clicked*100, 1) if total_clicked > 0 else 0,
        },
        "campaign_trend": trend,
        "browser_breakdown": [{"browser": b or "Unknown", "count": c} for b, c in browser_data],
        "device_breakdown": [{"device": d or "Desktop", "count": c} for d, c in device_data],
        "top_risky_users": [{"id": u.id, "name": f"{u.first_name} {u.last_name}",
                             "email": u.email, "risk_score": u.risk_score,
                             "department": u.department} for u in risky_users],
        "top_templates": template_stats[:5]
    }

@router.get("/campaigns/{campaign_id}/timeline")
def campaign_timeline(campaign_id: int, db: Session = Depends(get_db),
                      current: Admin = Depends(get_current_admin)):
    events = []
    clicks = db.query(ClickEvent).join(Target).filter(Target.campaign_id == campaign_id)\
        .order_by(ClickEvent.clicked_at).all()
    for c in clicks:
        events.append({"type": "click", "time": c.clicked_at.isoformat(), 
                       "browser": c.browser, "device": c.device_type})
    return {"events": events}
