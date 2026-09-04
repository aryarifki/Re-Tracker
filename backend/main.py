"""FastAPI entry point — SM Tracker API.

Run locally:
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import BrokerFlow
from routers import stocks, broker  # broker: Langkah 2

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: pipeline/cron lama Anda pegang DB; API hanya read-only di sini.
    yield
    # Shutdown


app = FastAPI(
    title="SM Tracker API",
    description="Backend untuk pelacak saham & bandarmologi IDX (migrasi dari Streamlit).",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS: izinkan Next.js (localhost:3000) mengakses API ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(stocks.router, prefix=settings.API_V1_PREFIX)
app.include_router(broker.router, prefix=settings.API_V1_PREFIX)

try:
    from routers import bandarmology
    app.include_router(bandarmology.router, prefix=settings.API_V1_PREFIX)
except ImportError:
    pass

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "SM Tracker API", "version": "1.0.0"}


@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    latest_date = db.query(func.max(BrokerFlow.date)).scalar()
    return {
        "status": "healthy",
        "latest_date": latest_date.isoformat() if latest_date else None
    }


@app.get("/api/status", tags=["Health"])
def system_status(db: Session = Depends(get_db)):
    """Endpoint dinamis untuk status dashboard & tanggal data terbaru di PostgreSQL."""
    latest_date = db.query(func.max(BrokerFlow.date)).scalar()
    return {
        "status": "ONLINE",
        "latest_date": latest_date.isoformat() if latest_date else "2026-09-01"
    }
    
