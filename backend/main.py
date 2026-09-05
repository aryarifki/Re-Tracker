"""FastAPI entry point — InvestOwl API."""
from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database import engine, get_db
from models import BrokerFlow
from routers import stocks, broker
from app.routers import bandarmology

DbSession = Annotated[AsyncSession, Depends(get_db)]

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.connect() as conn:
            await conn.execute(select(1))
    except Exception as exc:
        raise RuntimeError(f"Database connection failed on startup: {exc}") from exc
    yield
    await engine.dispose()

app = FastAPI(
    title="InvestOwl API",
    description="Enterprise-grade IDX Bandarmology & Stock Tracker Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(stocks.router, prefix=settings.API_V1_PREFIX)
app.include_router(broker.router, prefix=settings.API_V1_PREFIX)
app.include_router(bandarmology.router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["Health"])
async def health_check(db: DbSession):
    try:
        async with asyncio.timeout(2.0):
            stmt = select(func.max(BrokerFlow.date))
            result = await db.execute(stmt)
            latest_date = result.scalar()
            return {
                "status": "healthy",
                "database": "connected",
                "latest_data_date": latest_date.isoformat() if latest_date else None,
            }
    except TimeoutError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database response timed out")
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Healthcheck failure: {err}")
