"""
PhishGuard Seed Script - Populates database with sample data for demo
Run: python seed.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, Admin, User, Template, Campaign, Target, ClickEvent, TrainingModule, AppSettings
from app.auth import get_password_hash
from datetime import datetime, timedelta
import uuid, random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("🌱 Seeding PhishGuard database...")

# Clear existing
for model in [ClickEvent, Target, Campaign, Template, User, Admin, TrainingModule, AppSettings]:
    db.query(model).delete()
db.commit()

# --- ADMINS ---
admins_data = [
    {"email": "superadmin@phishguard.io", "username": "superadmin", "password": "Admin@123", "role": "super_admin"},
    {"email": "admin@phishguard.io", "username": "admin", "password": "Admin@123", "role": "admin"},
]
admins = []
for a in admins_data:
    admin = Admin(email=a["email"], username=a["username"],
                  hashed_password=get_password_hash(a["password"]), role=a["role"])
    db.add(admin)
    admins.append(admin)
db.flush()
print(f"  ✅ Created {len(admins)} admins")

# --- USERS ---
departments = ["Engineering", "Finance", "HR", "Marketing", "Operations", "Legal", "Sales", "IT"]
first_names = ["Aarav","Priya","Rohit","Ananya","Vikram","Neha","Arjun","Sneha","Karan","Divya",
               "Siddharth","Pooja","Amit","Riya","Rahul","Kavya","Aditya","Shreya","Nikhil","Meera",
               "James","Emily","Michael","Sarah","David","Jessica","Chris","Ashley","Daniel","Amanda"]
last_names = ["Sharma","Patel","Singh","Kumar","Gupta","Verma","Joshi","Mehta","Shah","Rao",
              "Smith","Johnson","Williams","Jones","Brown","Davis","Miller","Wilson","Moore","Taylor"]

users = []
for i in range(35):
    fn = random.choice(first_names)
    ln = random.choice(last_names)
    dept = random.choice(departments)
    email = f"{fn.lower()}.{ln.lower()}{i}@company.com"
    user = User(email=email, first_name=fn, last_name=ln, department=dept,
                position=random.choice(["Manager","Analyst","Engineer","Associate","Director","Intern"]),
                risk_score=random.uniform(0, 85))
    db.add(user)
    users.append(user)
db.flush()
print(f"  ✅ Created {len(users)} users")

# --- TEMPLATES ---
templates_data = [
    {
        "name": "IT Password Reset",
        "subject": "⚠️ Urgent: Your password will expire in 24 hours",
        "sender_name": "IT Help Desk", "sender_email": "helpdesk@it-support.net",
        "category": "IT Security", "difficulty": "easy",
        "html_body": "<h2>Action Required</h2><p>Your corporate password will expire in 24 hours. Click the link below to reset it immediately to avoid losing access.</p><p><a href='{{TRACKING_URL}}'>Reset My Password Now</a></p><p>- IT Help Desk</p>",
        "text_body": "Your password expires in 24 hours. Visit {{TRACKING_URL}} to reset."
    },
    {
        "name": "CEO Wire Transfer",
        "subject": "Confidential: Urgent wire transfer needed today",
        "sender_name": "CEO Office", "sender_email": "ceo.office@companymail.net",
        "category": "Business Email Compromise", "difficulty": "medium",
        "html_body": "<p>Hi,</p><p>I need you to process an urgent wire transfer for a confidential acquisition. Please review the details and confirm: <a href='{{TRACKING_URL}}'>View Secure Details</a></p><p>Do not discuss with others. Time sensitive.</p><p>Best,<br>CEO</p>",
        "text_body": "Urgent wire transfer needed. View details: {{TRACKING_URL}}"
    },
    {
        "name": "HR Benefits Portal",
        "subject": "New: Update your 2025 benefits enrollment by Friday",
        "sender_name": "HR Department", "sender_email": "hr-benefits@hrportal.org",
        "category": "HR", "difficulty": "medium",
        "html_body": "<p>Dear Employee,</p><p>Open enrollment for 2025 benefits closes this Friday. Log in to review and update your selections: <a href='{{TRACKING_URL}}'>Access Benefits Portal</a></p><p>HR Team</p>",
        "text_body": "Benefits enrollment closes Friday. Update here: {{TRACKING_URL}}"
    },
    {
        "name": "DocuSign Signature Request",
        "subject": "You have a pending document to sign - DocuSign",
        "sender_name": "DocuSign", "sender_email": "dse_na4@docusign-delivery.net",
        "category": "Impersonation", "difficulty": "hard",
        "html_body": "<div style='border:1px solid #ccc;padding:20px'><h3>DocuSign: Action Required</h3><p>A document is awaiting your signature.</p><p><a href='{{TRACKING_URL}}' style='background:#1e4d78;color:white;padding:10px 20px;text-decoration:none'>REVIEW DOCUMENT</a></p></div>",
        "text_body": "Document awaiting signature: {{TRACKING_URL}}"
    },
    {
        "name": "Microsoft 365 MFA Alert",
        "subject": "Security alert: New sign-in to your Microsoft account",
        "sender_name": "Microsoft Account Team", "sender_email": "account-security@microsoftonline.net",
        "category": "Credential Harvesting", "difficulty": "hard",
        "html_body": "<p>We detected a sign-in to your Microsoft account from an unknown device.</p><p>Location: Mumbai, India | Device: Unknown Windows PC</p><p>If this wasn't you, <a href='{{TRACKING_URL}}'>secure your account immediately</a>.</p>",
        "text_body": "Suspicious sign-in detected. Secure your account: {{TRACKING_URL}}"
    },
    {
        "name": "Package Delivery Failed",
        "subject": "Your package delivery failed – reschedule now",
        "sender_name": "FedEx Delivery", "sender_email": "noreply@fedex-notifications.com",
        "category": "Delivery Scam", "difficulty": "easy",
        "html_body": "<p>We attempted to deliver your package but were unable to complete delivery.</p><p>Tracking: #FX847291K</p><p><a href='{{TRACKING_URL}}'>Reschedule Delivery</a></p>",
        "text_body": "Package delivery failed. Reschedule: {{TRACKING_URL}}"
    },
]
templates = []
for t in templates_data:
    tmpl = Template(**t)
    db.add(tmpl)
    templates.append(tmpl)
db.flush()
print(f"  ✅ Created {len(templates)} phishing templates")

# --- CAMPAIGNS ---
statuses = ["completed", "completed", "completed", "running", "paused", "draft"]
campaigns_data = []
for i, status in enumerate(statuses):
    camp = Campaign(
        name=f"Q{(i%4)+1} 2024 Awareness Campaign" if i < 4 else ("Active Security Test" if i == 4 else "New Employee Phishing Test"),
        description=f"Simulated phishing campaign #{i+1} for security awareness training.",
        status=status,
        template_id=templates[i % len(templates)].id,
        admin_id=admins[0].id,
        launch_date=datetime.utcnow() - timedelta(days=random.randint(10, 120)) if status != "draft" else None,
        end_date=datetime.utcnow() - timedelta(days=random.randint(1, 9)) if status == "completed" else None,
    )
    db.add(camp)
    campaigns_data.append(camp)
db.flush()
print(f"  ✅ Created {len(campaigns_data)} campaigns")

# --- TARGETS + EVENTS ---
browsers = ["Chrome", "Firefox", "Safari", "Edge"]
devices = ["Desktop", "Mobile", "Tablet"]
oses = ["Windows", "macOS", "Linux", "Android", "iOS"]

total_targets = 0
for camp in campaigns_data:
    assigned_users = random.sample(users, min(len(users), random.randint(12, 25)))
    for user in assigned_users:
        token = str(uuid.uuid4()).replace("-", "")
        target = Target(campaign_id=camp.id, user_id=user.id, tracking_token=token)
        
        if camp.status != "draft":
            target.email_sent = True
            target.sent_at = camp.launch_date + timedelta(minutes=random.randint(1, 30))
            
            if random.random() < 0.62:  # 62% open rate
                target.email_opened = True
                target.opened_at = target.sent_at + timedelta(hours=random.randint(1, 48))
            
            if random.random() < 0.28:  # 28% click rate
                target.link_clicked = True
                target.clicked_at = target.sent_at + timedelta(hours=random.randint(2, 72))
                event = ClickEvent(
                    target_id=0,  # will update after flush
                    ip_address=f"192.168.{random.randint(1,10)}.{random.randint(1,254)}",
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    browser=random.choice(browsers),
                    os=random.choice(oses),
                    device_type=random.choice(devices),
                    clicked_at=target.clicked_at
                )
                db.add(event)
                
                if random.random() < 0.45:  # 45% of clickers submit creds
                    target.credentials_submitted = True
                    target.submitted_at = target.clicked_at + timedelta(minutes=random.randint(1, 10))
            
            if random.random() < 0.12:  # 12% report rate
                target.reported = True
                target.reported_at = target.sent_at + timedelta(hours=random.randint(1, 24))
            
            if target.link_clicked and random.random() < 0.65:
                target.training_completed = True
        
        db.add(target)
        total_targets += 1

db.flush()

# Fix click event target_ids after flush
for camp in campaigns_data:
    targets = db.query(Target).filter(Target.campaign_id == camp.id).all()
    for t in targets:
        if t.link_clicked:
            events = db.query(ClickEvent).filter(ClickEvent.target_id == 0).limit(1).all()
            if events:
                events[0].target_id = t.id

db.commit()
print(f"  ✅ Created {total_targets} campaign targets with simulated events")

# --- TRAINING MODULES ---
modules_data = [
    {"title": "How to Spot a Phishing Email", "category": "email",
     "content": "Phishing emails often impersonate trusted brands and create urgency. Look for: mismatched sender domains, suspicious links, generic greetings, unexpected attachments, and requests for sensitive info. Always verify by contacting the sender directly.", "duration_minutes": 5},
    {"title": "Password Security Best Practices", "category": "passwords",
     "content": "Use a unique, strong password for every account. Enable multi-factor authentication (MFA). Never share passwords. Use a password manager. A good password is at least 12 characters with a mix of letters, numbers, and symbols.", "duration_minutes": 4},
    {"title": "Social Engineering Tactics", "category": "social",
     "content": "Social engineering exploits human psychology rather than technical vulnerabilities. Attackers use pretexting, baiting, quid pro quo, and tailgating. Always verify identity before sharing information or granting access.", "duration_minutes": 6},
    {"title": "Safe Browsing & Link Safety", "category": "web",
     "content": "Hover over links before clicking to see the real URL. Look for HTTPS. Be wary of URL shorteners. Avoid clicking links in unexpected emails or messages. Use browser security extensions.", "duration_minutes": 4},
    {"title": "Business Email Compromise (BEC)", "category": "bec",
     "content": "BEC attacks impersonate executives or vendors to request wire transfers or sensitive data. Always verify unusual financial requests through a secondary channel like a phone call. Never rely solely on email for financial authorizations.", "duration_minutes": 7},
    {"title": "Incident Response Protocol", "category": "incident",
     "content": "If you suspect a phishing attack: Do NOT click any links. Do NOT provide credentials. Report it immediately to IT security. Forward the email as an attachment to security@company.com. Disconnect from network if you already clicked.", "duration_minutes": 5},
]
for m in modules_data:
    db.add(TrainingModule(**m))

# --- APP SETTINGS ---
settings_data = [
    ("org_name", "Acme Corporation"),
    ("sender_email", "security@acmecorp.com"),
    ("sender_name", "Acme Security Team"),
    ("mock_email", "true"),
    ("allow_self_register", "false"),
    ("default_campaign_status", "draft"),
    ("risk_threshold_high", "70"),
    ("risk_threshold_medium", "40"),
]
for key, value in settings_data:
    db.add(AppSettings(key=key, value=value))

db.commit()
print(f"  ✅ Created {len(modules_data)} training modules")
print(f"  ✅ Created app settings")
print()
print("✅ Seeding complete!")
print()
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("🔐 Login Credentials:")
print("   Super Admin: superadmin@phishguard.io / Admin@123")
print("   Admin:       admin@phishguard.io       / Admin@123")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
