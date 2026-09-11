"""Foreign Flow Deep Dive Analytics endpoint."""
from __future__ import annotations

import json
import redis
import numpy as np
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
# Mengimpor semua fungsi analitik, termasuk yang baru dibuat
from src.services.foreign_analytics import (
    compute_hmm_regime, 
    compute_var_irf, 
    compute_foreign_hhi,
    compute_broker_heatmap,
    compute_broker_network
)

try:
    redis_client = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)
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
    cache_key = f"ff_deepdive_v2:{ticker}:{lookback_days}"

    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass 

    # 1. Macro Data Fetching (Harga & Foreign Flow)
    query_macro = text("""
        SELECT f.date, f.foreign_net_broker, p.close
        FROM broker_flow f
        LEFT JOIN prices p ON f.ticker = p.ticker AND f.date = p.date
        WHERE f.ticker = :ticker
        ORDER BY f.date DESC
        LIMIT :limit
    """)
    macro_rows = db.execute(query_macro, {"ticker": ticker, "limit": lookback_days}).fetchall()
    
    if not macro_rows or len(macro_rows) < 20:
        raise HTTPException(status_code=404, detail=f"Data historis {ticker} tidak mencukupi (Min 20 hari)")

    macro_rows = list(reversed(macro_rows))
    dates = [str(r.date) for r in macro_rows]
    foreign_net = [float(r.foreign_net_broker or 0) for r in macro_rows]
    
    closes = []
    last_close = 0.0
    for r in macro_rows:
        if r.close is not None and float(r.close) > 0:
            last_close = float(r.close)
        closes.append(last_close)
    
    returns = [0.0]
    for i in range(1, len(closes)):
        prev = closes[i-1]
        returns.append(float((closes[i] - prev) / prev) if prev else 0.0)

    # 2. Micro Data Fetching (TimeSeries Broker Asing per Hari)
    start_date = macro_rows[0].date
    query_micro = text("""
        SELECT date, broker_code, SUM(net_value) as net_value
        FROM broker_activity
        WHERE ticker = :ticker AND participant_type = 'Asing' AND date >= :start_date
        GROUP BY date, broker_code
    """)
    micro_rows_raw = db.execute(query_micro, {"ticker": ticker, "start_date": start_date}).fetchall()
    
    # Format list of dicts untuk pandas DataFrame
    micro_rows = [
        {"date": str(r.date), "broker_code": r.broker_code, "net_value": float(r.net_value)}
        for r in micro_rows_raw
    ]

    # Agregasi total per broker untuk HHI
    broker_net_totals = {}
    for r in micro_rows:
        broker_net_totals[r["broker_code"]] = broker_net_totals.get(r["broker_code"], 0.0) + r["net_value"]
    hhi_score = compute_foreign_hhi(list(broker_net_totals.values()))

    # Ekstraksi Emiten
    query_emiten = text("SELECT company_name, conglomerate_group FROM master_emiten WHERE ticker = :ticker")
    emiten_row = db.execute(query_emiten, {"ticker": ticker}).fetchone()
    company_name = emiten_row.company_name if emiten_row else "Perusahaan Tidak Diketahui"
    group_name = emiten_row.conglomerate_group if emiten_row else "Independen / Belum Terpetakan"

    # 3. Komputasi Machine Learning Lanjutan
    regime_data = compute_hmm_regime(foreign_net, n_states=3)
    var_irf_data = compute_var_irf(foreign_net, returns, lags=2, horizon=10)
    
    heatmap_data = compute_broker_heatmap(micro_rows, top_n=15)
    network_data = compute_broker_network(micro_rows, lookback_days, min_active_ratio=0.2, corr_threshold=0.65)
    
    f_arr = np.array(foreign_net)
    std_val = float(np.std(f_arr))
    zscore = float((f_arr[-1] - np.mean(f_arr)) / std_val) if std_val > 0 else 0.0

    payload = {
        "ticker": ticker,
        "company": {"name": company_name, "group": group_name},
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
            "hmm_states": [int(x) for x in regime_data.get("states", [])]
        },
        "models": {
            "regime_probabilities": [[float(p) for p in row] for row in regime_data.get("probabilities", [])],
            "impulse_response": var_irf_data,
            "broker_heatmap": heatmap_data,
            "broker_network": network_data
        }
    }

    if redis_client:
        try:
            redis_client.setex(cache_key, 28800, json.dumps(payload))
        except Exception:
            pass

    return payload
