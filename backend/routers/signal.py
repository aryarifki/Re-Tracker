from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import date
import json

from database import get_db

router = APIRouter(prefix="/api/signal", tags=["AI Signals"])

@router.get("/daily")
def get_daily_signals(limit: int = 5, db: Session = Depends(get_db)):
    """Mengambil Top AI Signals berdasarkan tanggal scan terbaru."""
    
    # 1. Cari tanggal scan terakhir yang ada di database
    date_query = text("SELECT MAX(date) FROM analytics_daily_signals")
    latest_date = db.execute(date_query).scalar()

    if not latest_date:
        raise HTTPException(status_code=404, detail="Belum ada sinyal yang digenerate oleh AI.")

    # 2. Ambil Top saham berdasarkan composite_score di tanggal tersebut
    query = text("""
        SELECT a.ticker, a.date, a.ml_win_prob, a.composite_score, 
               a.technical_score, a.smart_money_score, a.sector_score, 
               a.fundamental_score, a.ml_label, a.features_snapshot
        FROM analytics_daily_signals a
        WHERE a.date = :date
        ORDER BY a.composite_score DESC
        LIMIT :limit
    """)
    
    rows = db.execute(query, {"date": latest_date, "limit": limit}).fetchall()
    
    signals = []
    for r in rows:
        features = r.features_snapshot if isinstance(r.features_snapshot, dict) else json.loads(r.features_snapshot or "{}")
        
        signals.append({
            "ticker": r.ticker,
            "date": str(r.date),
            "ml_label": r.ml_label,
            "ml_win_prob": float(r.ml_win_prob) if r.ml_win_prob else 0.0,
            "composite_score": r.composite_score,
            "scores": {
                "technical": r.technical_score,
                "smart_money": r.smart_money_score,
                "sector": r.sector_score,
                "fundamental": r.fundamental_score
            },
            "features": features
        })
        
    return {
        "latest_date": str(latest_date),
        "count": len(signals),
        "data": signals
    }
