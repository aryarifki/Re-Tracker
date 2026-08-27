"""FastAPI entry point — SM Tracker API.

Run locally:
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
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

from app.routers import bandarmology
app.include_router(bandarmology.router)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "SM Tracker API", "version": "1.0.0"}


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
