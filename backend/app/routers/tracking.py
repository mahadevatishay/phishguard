from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Target, ClickEvent, ReportEvent, SubmissionEvent, User
from datetime import datetime
import os

router = APIRouter(prefix="/track", tags=["tracking"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

def parse_device(user_agent: str):
    ua = user_agent.lower()
    browser = "Unknown"
    os_name = "Unknown"
    device = "Desktop"
    if "chrome" in ua and "edg" not in ua: browser = "Chrome"
    elif "firefox" in ua: browser = "Firefox"
    elif "safari" in ua and "chrome" not in ua: browser = "Safari"
    elif "edg" in ua: browser = "Edge"
    if "windows" in ua: os_name = "Windows"
    elif "mac" in ua: os_name = "macOS"
    elif "linux" in ua: os_name = "Linux"
    elif "android" in ua: os_name = "Android"
    elif "iphone" in ua or "ipad" in ua: os_name = "iOS"
    if "mobile" in ua or "android" in ua or "iphone" in ua: device = "Mobile"
    elif "tablet" in ua or "ipad" in ua: device = "Tablet"
    return browser, os_name, device

@router.get("/click/{token}")
def track_click(token: str, request: Request, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.tracking_token == token).first()
    if not target:
        return RedirectResponse(url=f"{FRONTEND_URL}/training")
    
    if not target.link_clicked:
        target.link_clicked = True
        target.clicked_at = datetime.utcnow()
        ua = request.headers.get("User-Agent", "")
        browser, os_name, device = parse_device(ua)
        event = ClickEvent(
            target_id=target.id,
            ip_address=request.client.host if request.client else "unknown",
            user_agent=ua[:500], browser=browser, os=os_name, device_type=device
        )
        db.add(event)
        # Update user risk score
        user = db.query(User).filter(User.id == target.user_id).first()
        if user:
            user.risk_score = min(100.0, user.risk_score + 15.0)
        db.commit()
    
    return RedirectResponse(url=f"{FRONTEND_URL}/phishing-landing?token={token}")

@router.post("/submit/{token}")
def track_submission(token: str, request: Request, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.tracking_token == token).first()
    if not target:
        return {"message": "Invalid token"}
    if not target.credentials_submitted:
        target.credentials_submitted = True
        target.submitted_at = datetime.utcnow()
        event = SubmissionEvent(target_id=target.id)
        db.add(event)
        user = db.query(User).filter(User.id == target.user_id).first()
        if user:
            user.risk_score = min(100.0, user.risk_score + 25.0)
        db.commit()
    return {"message": "Logged", "redirect": f"{FRONTEND_URL}/training?token={token}"}

@router.post("/report/{token}")
def track_report(token: str, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.tracking_token == token).first()
    if not target:
        return {"message": "Invalid token"}
    if not target.reported:
        target.reported = True
        target.reported_at = datetime.utcnow()
        event = ReportEvent(target_id=target.id)
        db.add(event)
        user = db.query(User).filter(User.id == target.user_id).first()
        if user:
            user.risk_score = max(0.0, user.risk_score - 10.0)
        db.commit()
    return {"message": "Thank you for reporting this suspicious email!"}

@router.post("/training-complete/{token}")
def training_complete(token: str, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.tracking_token == token).first()
    if target:
        target.training_completed = True
        db.commit()
    return {"message": "Training marked complete"}
