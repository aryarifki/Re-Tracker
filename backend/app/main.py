"""Entry point FastAPI — konfigurasi CORS, router registration, dan health check."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import broker, stocks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Hook startup/shutdown."""
    print(f"🚀 {settings.project_name} starting up...")
    yield
    print("🛑 Shutting down gracefully.")


app = FastAPI(
    title=settings.project_name,
    description="API pelacak data saham & bandarmologi IDX. Decoupled dari pipeline pengumpul data.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS: Izinkan Next.js (localhost:3000) dan domain production ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Router Registration ──────────────────────────────────────────────────
app.include_router(stocks.router, prefix=settings.api_v1_str)
app.include_router(broker.router, prefix=settings.api_v1_str)


@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.project_name}
