# 🛡️ PhishGuard — Phishing Simulation & Security Awareness Platform

> A full-stack, production-style cybersecurity training platform for student portfolios and final-year demonstrations. Built with **React + Vite**, **FastAPI**, and **SQLite/PostgreSQL**.

---

## ⚠️ Disclaimer

**PhishGuard is strictly for educational and security awareness training purposes.** It is designed to be run internally within organizations or as a demo environment. No real phishing emails are sent — all simulations use mock delivery only. Do not use this tool to attack or deceive individuals without explicit authorization.

---

## ✨ Features

| Module | What It Does |
|---|---|
| 🔐 Admin Auth | JWT-secured login with Super Admin & Admin roles |
| 📊 Dashboard | Live KPI cards, campaign trend charts, risk leaderboard |
| 🎯 Campaigns | Create, launch, pause, and track phishing simulations |
| 👥 Users | User management + CSV bulk import with risk scoring |
| 📧 Templates | Visual phishing template builder with live preview |
| 📈 Analytics | Click/report/submission rates, browser & device breakdown |
| 📋 Reports | Per-campaign reports with CSV export |
| 🎓 Training | 4-module security awareness training with progress tracking |
| 🪝 Tracking | Unique tokenized links per user; logs opens, clicks, submissions |
| ⚙️ Settings | Org config, risk thresholds, admin management, audit logs |

---

## 🗂️ Project Structure

```
phishguard/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point, CORS, routes
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models.py         # All database table models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # JWT auth, password hashing, guards
│   │   └── routers/
│   │       ├── auth.py       # Login, /me, admin creation, audit logs
│   │       ├── campaigns.py  # CRUD + launch/pause + stats
│   │       ├── users.py      # CRUD + CSV bulk upload + risk
│   │       ├── templates.py  # Email template CRUD
│   │       ├── tracking.py   # Click/submit/report tracking endpoints
│   │       ├── analytics.py  # Dashboard KPIs and chart data
│   │       ├── reports.py    # Summary + CSV export
│   │       └── settings.py   # App settings + training modules
│   ├── seed.py               # Populates DB with demo data
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables (gitignored)
│   └── .env.example          # Template for env vars
│
└── frontend/                 # React + Vite frontend
    ├── src/
    │   ├── App.jsx            # Router, route protection
    │   ├── main.jsx           # React DOM entry
    │   ├── index.css          # Tailwind + custom component classes
    │   ├── context/
    │   │   └── AuthContext.jsx # JWT auth state, login/logout
    │   ├── utils/
    │   │   └── api.js         # Axios instance with auth interceptor
    │   ├── components/
    │   │   ├── Layout.jsx     # Sidebar nav + top bar
    │   │   ├── StatCard.jsx   # KPI metric card
    │   │   ├── PageHeader.jsx # Page title + actions bar
    │   │   ├── RiskBadge.jsx  # Color-coded risk score badge
    │   │   └── StatusBadge.jsx# Campaign status badge
    │   └── pages/
    │       ├── LoginPage.jsx      # Auth login
    │       ├── Dashboard.jsx      # Main dashboard with live stats
    │       ├── Campaigns.jsx      # Campaign list with filters
    │       ├── CampaignDetail.jsx # Per-campaign target tracking
    │       ├── CampaignBuilder.jsx# 4-step campaign wizard
    │       ├── Users.jsx          # User table + CSV import
    │       ├── Templates.jsx      # Template cards + editor modal
    │       ├── Analytics.jsx      # Charts and analytics deep-dive
    │       ├── Reports.jsx        # Campaign report table + export
    │       ├── Settings.jsx       # Tabbed settings panel
    │       ├── Training.jsx       # Security awareness training modules
    │       └── PhishingLanding.jsx# Simulated login page + reveal
    ├── vite.config.js         # Vite config with API proxy
    ├── tailwind.config.js     # Tailwind + custom theme
    └── package.json
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `admins` | Admin accounts with role (super_admin / admin) |
| `users` | Target users with risk scores |
| `templates` | Phishing email templates with HTML/text body |
| `campaigns` | Campaigns linking admins, templates, and targets |
| `targets` | Per-user campaign instance with tracking state |
| `click_events` | Browser, OS, device metadata for each click |
| `report_events` | When users report a phishing email |
| `submission_events` | When users enter fake credentials |
| `send_logs` | Mock email delivery log |
| `training_modules` | Security awareness lesson content |
| `audit_logs` | Admin action history |
| `app_settings` | Key-value store for org config |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

---

### 1. Clone or Download

```bash
# If from a zip archive:
cd phishguard

# Or clone from git:
git clone https://github.com/yourname/phishguard.git
cd phishguard
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env if you want to change SECRET_KEY or other settings

# Seed the database with demo data
python seed.py
```

Expected output:
```
🌱 Seeding PhishGuard database...
  ✅ Created 2 admins
  ✅ Created 35 users
  ✅ Created 6 phishing templates
  ✅ Created 6 campaigns
  ✅ Created 103 campaign targets with simulated events
  ✅ Created 6 training modules
  ✅ Created app settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Login Credentials:
   Super Admin: superadmin@phishguard.io / Admin@123
   Admin:       admin@phishguard.io       / Admin@123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3. Start the Backend Server

```bash
# From the backend/ directory with venv active
uvicorn app.main:app --reload --port 8000
```

Backend is now running at → **http://localhost:8000**  
API Docs available at → **http://localhost:8000/api/docs**

---

### 4. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend is now running at → **http://localhost:5173**

---

### 5. Login

Open **http://localhost:5173** in your browser.

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@phishguard.io | Admin@123 |
| Admin | admin@phishguard.io | Admin@123 |

---

## 🔑 Key API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate and get JWT |
| GET | `/api/analytics/dashboard` | All dashboard KPI data |
| GET | `/api/campaigns/` | List all campaigns |
| POST | `/api/campaigns/` | Create new campaign |
| POST | `/api/campaigns/{id}/launch` | Launch a campaign |
| GET | `/api/users/` | List users with search |
| POST | `/api/users/bulk-upload` | CSV import |
| GET | `/api/reports/export/csv` | Download CSV report |
| GET | `/track/click/{token}` | Record a simulated click |
| POST | `/track/submit/{token}` | Record credential submission |
| POST | `/track/report/{token}` | Record phishing report |

Full interactive docs: **http://localhost:8000/api/docs**

---

## 🔐 Risk Scoring Algorithm

Each user has a `risk_score` (0–100) updated dynamically:

| Event | Score Change |
|---|---|
| Clicked a phishing link | **+15 points** |
| Submitted credentials | **+25 points** |
| Reported a phishing email | **−10 points** |

| Score Range | Risk Level |
|---|---|
| 70–100 | 🔴 High Risk |
| 40–69 | 🟡 Medium Risk |
| 1–39 | 🔵 Low Risk |
| 0 | ✅ No Risk |

---

## 🔒 Security Design

- **No real emails sent** — all delivery is simulated (mock mode)
- **JWT authentication** on all admin API routes
- **Role-based access** — Super Admin can create admins and view audit logs
- **Input sanitization** via Pydantic schemas
- **Rate limiting** via SlowAPI
- **CORS** restricted to configured frontend URL
- **Audit logging** for all significant admin actions
- **Simulated credential page** — fake login page educates users immediately
- **No credentials stored** from the fake login page

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | (set a strong key!) | JWT signing secret |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token expiry time |
| `DATABASE_URL` | `sqlite:///./phishguard.db` | DB connection string |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |
| `MOCK_EMAIL` | `true` | Disable real SMTP |

---

## 🏗️ Production Deployment Notes

For a real deployment:

1. **Change `SECRET_KEY`** to a long random string (32+ chars)
2. **Use PostgreSQL** by updating `DATABASE_URL`
3. **Build the frontend**: `npm run build` and serve from a CDN or Nginx
4. **Reverse proxy** backend with Nginx or Caddy
5. **Use HTTPS** — never deploy over plain HTTP
6. **Set strong CORS** origins in `.env`
7. **Keep `MOCK_EMAIL=true`** unless you want real email delivery

---

## 🎓 What This Demonstrates (for Portfolio)

- Full-stack architecture: React SPA ↔ REST API ↔ SQLite/PostgreSQL
- JWT authentication with role-based access control
- Real-time dashboard with Chart.js visualizations
- Multi-step wizard for campaign creation
- File upload (CSV) with server-side parsing
- Unique tokenized tracking URLs per user
- Risk scoring algorithm with live updates
- Dark-mode UI with Tailwind CSS custom design system
- Modular FastAPI routers with Pydantic validation
- SQLAlchemy ORM with relational data model
- Audit logging and rate limiting
- CSV export for reporting

---

## 📸 Pages Overview

| Page | Path | Description |
|---|---|---|
| Login | `/login` | Auth screen with demo creds |
| Dashboard | `/dashboard` | Live KPIs + charts + risk leaderboard |
| Campaigns | `/campaigns` | List + launch + status management |
| Campaign Detail | `/campaigns/:id` | Per-target breakdown table |
| Campaign Builder | `/campaigns/new` | 4-step creation wizard |
| Users | `/users` | Table + bulk CSV import |
| Templates | `/templates` | Card grid + editor modal + preview |
| Analytics | `/analytics` | Deep-dive charts (funnel, trend, devices) |
| Reports | `/reports` | Summary table + per-campaign CSV export |
| Settings | `/settings` | Org config, risk thresholds, audit logs |
| Training | `/training` | 4-module awareness course |
| Phishing Landing | `/phishing-landing` | Fake login → educational reveal |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 + IBM Plex fonts |
| Charts | Chart.js 4 + react-chartjs-2 |
| HTTP Client | Axios |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend Framework | FastAPI 0.110 |
| ORM | SQLAlchemy 2 |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| Validation | Pydantic v2 |
| Rate Limiting | SlowAPI |
| Database | SQLite (dev) / PostgreSQL (prod) |

---

## 🙋 FAQ

**Q: Will it send real phishing emails?**  
A: No. `MOCK_EMAIL=true` is the default. All email delivery is simulated — only database records are created.

**Q: Can I use real SMTP?**  
A: You can set `MOCK_EMAIL=false` and configure SMTP variables, but this is NOT recommended for demo environments. Only use in a properly authorized internal testing setup.

**Q: How do I reset the demo data?**  
A: Delete `phishguard.db` and re-run `python seed.py`.

**Q: Can I use PostgreSQL instead of SQLite?**  
A: Yes. Set `DATABASE_URL=postgresql://user:password@localhost:5432/phishguard` in your `.env`. Run `pip install psycopg2-binary` as well.

---

*Built with ❤️ as a cybersecurity portfolio project. For educational use only.*
