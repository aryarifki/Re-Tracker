"""Foreign Flow Deep Dive Analytics endpoint (Pre-computed Mode)."""
from __future__ import annotations

import json
import redis
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from database import get_db

try:
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True
    )
    redis_client.ping()
except Exception:
    redis_client = None

router = APIRouter(prefix="/api/foreign-flow", tags=["Foreign Flow Deep Dive"])

@router.get("/{ticker}")
def get_foreign_flow_analytics(
    ticker: str,
    lookback_days: int = Query(60, ge=20, le=250),
    db: Session = Depends(get_db)
):
    ticker = ticker.upper().strip()
    cache_key = f"ff_deepdive_v3:{ticker}:{lookback_days}"

    # 1. Cek Cache Redis terlebih dahulu
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass 

    # 2. Ambil data dari tabel pre-computed (Sangat cepat, < 10ms)
    query = text("""
        SELECT ticker, lookback_days, latest_date, features, timeseries, models, 
               company_name, group_name
        FROM analytics_foreign_flow
        WHERE ticker = :ticker AND lookback_days = :lookback_days
    """)
    
    row = db.execute(query, {"ticker": ticker, "lookback_days": lookback_days}).fetchone()
    
    if not row:
        raise HTTPException(
            status_code=404, 
            detail=f"Data analitik untuk {ticker} pada window {lookback_days} hari belum dihitung oleh Smtracker."
        )

    # 3. Rangkai payload agar persis dengan struktur frontend
    payload = {
        "ticker": row.ticker,
        "company": {
            "name": row.company_name or "Perusahaan Tidak Diketahui", 
            "group": row.group_name or "Independen / Belum Terpetakan"
        },
        "lookback_days": row.lookback_days,
        "latest_date": str(row.latest_date),
        "features": row.features or {},
        "timeseries": row.timeseries or {},
        "models": row.models or {}
    }

    # 4. Simpan ke Redis (Cache 8 jam)
    if redis_client:
        try:
            redis_client.setex(cache_key, 28800, json.dumps(payload))
        except Exception:
            pass

    return payload
