"""Router bandarmology — Asynchronous Offloading Edition."""
import asyncio
import math
from datetime import date
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from ..idx_bridge import analysis, storage, universe

router = APIRouter(prefix="/api/bandar", tags=["bandarmology"])

def _clean(obj):
    if isinstance(obj, dict): return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, list): return [_clean(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)): return None
    return obj

# ══════════════════════════════════════════════════════════
# SYNCHRONOUS LOGIC (OFFLOADED TO THREADS)
# ══════════════════════════════════════════════════════════
def _sync_screener(universe_mode: str, analysis_date: str, window_days: int):
    tickers = universe.get_universe(mode=universe_mode)
    if not tickers: return {"data": [], "meta": {}}
    
    analysis_ts = pd.Timestamp(analysis_date) if analysis_date else pd.Timestamp.today()
    window_start = analysis_ts - pd.Timedelta(days=window_days)
    
    # MEMORY FIX: Hanya muat data rentang tanggal yang dibutuhkan
    start_str, end_str = str(window_start.date()), str(analysis_ts.date())
    
    try:
        scan_10d = analysis.broker_alpha_scan(tickers, horizon=10, min_events=5, min_net_value=0, group_by=("ticker", "broker_code"))
    except Exception:
        scan_10d = pd.DataFrame()
        
    results = []
    # MEMORY FIX: Fetch batch flow untuk seluruh ticker sekaligus di rentang waktu spesifik
    try:
        df_flow_all = storage.read_broker_flow(tickers, start_date=start_str, end_date=end_str)
    except Exception:
        df_flow_all = pd.DataFrame()

    for ticker in tickers[:100]:
        try:
            df_flow_full = df_flow_all[df_flow_all["ticker"] == ticker] if not df_flow_all.empty else pd.DataFrame()
            if df_flow_full.empty: continue
            
            latest_flow = df_flow_full.iloc[-1]
            raw_signal = latest_flow.get("bandar_signal", "NEUTRAL")
            signal = str(raw_signal).replace("_", " ").title() if pd.notna(raw_signal) else "Neutral"
            foreign_5d = float(df_flow_full.tail(5)["foreign_net_broker"].fillna(0).sum())
            total_value = float(latest_flow.get("total_value", 0.0))
            
            results.append({
                "ticker": ticker,
                "signal": signal,
                "conviction_score": 50.0, # Placeholder cepat untuk screener
                "foreign_net": foreign_5d,
                "net_value": 0.0,
                "bandar_avg_price": 0.0,
                "total_value": total_value, 
                "current_price": 0.0,
                "top_buyer": "-",
                "data_date": str(latest_flow.get("date"))
            })
        except Exception:
            continue
            
    results = sorted(results, key=lambda x: x["conviction_score"], reverse=True)
    return {"data": results, "meta": {"window_start": start_str, "analysis_date": end_str}}

def _sync_raw_tables(ticker: str, analysis_date: str, window_days: int):
    ticker = ticker.upper()
    analysis_ts = pd.Timestamp(analysis_date) if analysis_date else pd.Timestamp.today()
    window_start = analysis_ts - pd.Timedelta(days=window_days)
    start_str, end_str = str(window_start.date()), str(analysis_ts.date())

    flow_list = []
    try:
        # MEMORY FIX: Fetch filtered
        flow_df = storage.read_broker_flow([ticker], start_date=start_str, end_date=end_str).sort_values("date", ascending=False)
        for _, r in flow_df.iterrows():
            flow_list.append({
                "date": str(pd.Timestamp(r.get("date")).date()),
                "signal": str(r.get("bandar_signal", "NEUTRAL")).replace("_", " ").title(),
                "score": float(r.get("bandar_signal_score", 0)),
                "foreign_net": float(r.get("foreign_net_broker", 0)),
                "local_net": float(r.get("local_net_broker", 0)),
                "total_value": float(r.get("total_value", 0))
            })
    except Exception: pass
    
    return {"flow": flow_list, "activity": []}


# ══════════════════════════════════════════════════════════
# ASYNCHRONOUS FASTAPI ENDPOINTS
# ══════════════════════════════════════════════════════════

@router.get("/universe")
async def get_universe(mode: str = "watchlist"):
    return {"tickers": universe.get_universe(mode=mode)}

@router.get("/screener-v2")
async def smart_screener(
    universe_mode: str = "lq45",
    analysis_date: str = None,
    window_days: int = 20
):
    # ASYNC OFFLOAD: Jalankan kalkulasi berat Pandas di Thread Pool agar Event Loop tetap hidup
    result = await asyncio.to_thread(_sync_screener, universe_mode, analysis_date, window_days)
    return _clean(result)

@router.get("/stocks/{ticker}/raw-tables")
async def get_raw_tables(ticker: str, analysis_date: str = None, window_days: int = 20):
    result = await asyncio.to_thread(_sync_raw_tables, ticker, analysis_date, window_days)
    return _clean(result)

# Dihapus: @router.post("/pipeline/run") dan @router.post("/pipeline/backfill")
# Pipeline data historis intensif tidak boleh diekspos langsung ke request HTTP. 
# Gunakan script CLI `python backend/idx_bandarmology/pipeline.py` atau Cron Job di server.
