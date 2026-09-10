"""Foreign Flow Deep Dive Analytics endpoint."""
from __future__ import annotations

import json
import redis
import numpy as np
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

# Injeksi database dari Re-Tracker
from database import get_db

# Mengimpor modul analitik TDD yang sudah kita buat
from src.services.foreign_analytics import compute_hmm_regime, compute_var_irf, compute_foreign_hhi

# Inisialisasi koneksi Redis lokal (Graceful fallback jika mati)
try:
    redis_client = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)
    redis_client.ping()
except Exception:
    redis_client = None

router = APIRouter(prefix="/api/foreign-flow", tags=["Foreign Flow Deep Dive"])

@router.get(
    "/{ticker}",
    summary="Data kalkulasi HMM, VAR, dan HHI untuk Foreign Flow",
)
def get_foreign_flow_analytics(
    ticker: str,
    lookback_days: int = Query(60, ge=20, le=250, description="Jumlah hari observasi (default 60)"),
    db: Session = Depends(get_db)
):
    ticker = ticker.upper().strip()
    cache_key = f"ff_deepdive:{ticker}:{lookback_days}"

    # 1. Cek Data di Redis Cache (Response < 50ms)
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass 

    # 2. Tarik Data Makro (Harga & Net Foreign Flow)
    query_macro = text("""
        SELECT f.date, f.foreign_net_broker, p.close
        FROM broker_flow f
        JOIN prices p ON f.ticker = p.ticker AND f.date = p.date
        WHERE f.ticker = :ticker
        ORDER BY f.date DESC
        LIMIT :limit
    """)
    
    macro_rows = db.execute(query_macro, {"ticker": ticker, "limit": lookback_days}).fetchall()
    
    if not macro_rows or len(macro_rows) < 20:
        raise HTTPException(status_code=404, detail="Data historis tidak mencukupi untuk analitik (Min 20 hari)")

    # Balik ke urutan kronologis (terlama ke terbaru) untuk algoritma Time-Series
    macro_rows = list(reversed(macro_rows))
    
    dates = [str(r.date) for r in macro_rows]
    foreign_net = [float(r.foreign_net_broker or 0) for r in macro_rows]
    closes = [float(r.close or 0) for r in macro_rows]
    
    # Hitung Return Harian untuk model VAR
    returns = [0.0]
    for i in range(1, len(closes)):
        prev = closes[i-1]
        returns.append((closes[i] - prev) / prev if prev else 0.0)

    # 3. Tarik Data Mikrostruktur Broker (Konsentrasi Asing)
    start_date = macro_rows[0].date
    query_micro = text("""
        SELECT broker_code, SUM(net_value) as total_net
        FROM broker_activity
        WHERE ticker = :ticker AND participant_type = 'Asing' AND date >= :start_date
        GROUP BY broker_code
    """)
    micro_rows = db.execute(query_micro, {"ticker": ticker, "start_date": start_date}).fetchall()
    broker_net_values = [float(r.total_net) for r in micro_rows]

    # 4. Komputasi Engine Kuantitatif
    regime_data = compute_hmm_regime(foreign_net, n_states=3)
    var_irf_data = compute_var_irf(foreign_net, returns, lags=2, horizon=10)
    hhi_score = compute_foreign_hhi(broker_net_values)
    
    # Hitung kekuatan momentum (Z-Score)
    f_arr = np.array(foreign_net)
    std_val = np.std(f_arr)
    zscore = float((f_arr[-1] - np.mean(f_arr)) / std_val) if std_val > 0 else 0.0

    # Susun Payload Final
    payload = {
        "ticker": ticker,
        "lookback_days": lookback_days,
        "latest_date": dates[-1],
        "features": {
            "foreign_hhi": round(hhi_score, 4),
            "foreign_zscore": round(zscore, 2),
        },
        "timeseries": {
            "dates": dates,
            "foreign_net": foreign_net,
            "close_prices": closes,
            "hmm_states": regime_data.get("states", [])
        },
        "models": {
            "regime_probabilities": regime_data.get("probabilities", []),
            "impulse_response": var_irf_data
        }
    }

    # 5. Simpan ke Redis (Cache bertahan selama 8 Jam)
    if redis_client:
        try:
            redis_client.setex(cache_key, 28800, json.dumps(payload))
        except Exception:
            pass

    return payload
