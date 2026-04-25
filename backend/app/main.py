from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .database import engine, Base
from .routers import auth, campaigns, users, templates, analytics, reports, settings, tracking
import os
from dotenv import load_dotenv

load_dotenv()

# Create all tables
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="PhishGuard API",
    description="Security Awareness & Phishing Simulation Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(users.router)
app.include_router(templates.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(tracking.router)

@app.get("/")
def root():
    return {"message": "PhishGuard API v1.0", "docs": "/api/docs", "status": "operational"}

@app.get("/health")
def health():
    return {"status": "healthy"}
