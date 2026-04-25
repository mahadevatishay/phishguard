from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Template
from ..schemas import TemplateCreate
from ..auth import get_current_admin
from ..models import Admin

router = APIRouter(prefix="/api/templates", tags=["templates"])

@router.get("/")
def list_templates(db: Session = Depends(get_db), current: Admin = Depends(get_current_admin)):
    templates = db.query(Template).filter(Template.is_active == True).all()
    return [{"id": t.id, "name": t.name, "subject": t.subject, "sender_name": t.sender_name,
             "sender_email": t.sender_email, "category": t.category, "difficulty": t.difficulty,
             "html_body": t.html_body, "text_body": t.text_body,
             "created_at": t.created_at.isoformat()} for t in templates]

@router.post("/")
def create_template(data: TemplateCreate, db: Session = Depends(get_db),
                    current: Admin = Depends(get_current_admin)):
    template = Template(**data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return {"id": template.id, "name": template.name, "message": "Template created"}

@router.get("/{template_id}")
def get_template(template_id: int, db: Session = Depends(get_db),
                 current: Admin = Depends(get_current_admin)):
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"id": t.id, "name": t.name, "subject": t.subject, "sender_name": t.sender_name,
            "sender_email": t.sender_email, "html_body": t.html_body, "text_body": t.text_body,
            "category": t.category, "difficulty": t.difficulty,
            "created_at": t.created_at.isoformat()}

@router.put("/{template_id}")
def update_template(template_id: int, data: TemplateCreate, db: Session = Depends(get_db),
                    current: Admin = Depends(get_current_admin)):
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    for key, value in data.model_dump().items():
        setattr(t, key, value)
    db.commit()
    return {"message": "Template updated"}

@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db),
                    current: Admin = Depends(get_current_admin)):
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    t.is_active = False
    db.commit()
    return {"message": "Template deleted"}
