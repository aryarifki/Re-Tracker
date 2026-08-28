"""Router bandarmology — membungkus fungsi paket idx_bandarmology."""
from datetime import date
import threading

import pandas as pd
from fastapi import APIRouter, HTTPException

from ..idx_bridge import analysis, storage, universe, pipeline

router = APIRouter(prefix="/api/bandar", tags=["bandarmology"])
import math

def _clean(obj):
    """Ganti NaN/Inf menjadi None agar valid JSON."""
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


# ══════════════════════════════════════════════════════════
# Universe & Tickers
# ══════════════════════════════════════════════════════════

@router.get("/universe")
def get_universe(mode: str = "watchlist"):
    return {"tickers": universe.get_universe(mode=mode)}


@router.get("/tickers")
def master_tickers():
    try:
        return {"tickers": universe.get_master_tickers(active_only=True)}
    except Exception as e:
        return {"tickers": [], "error": str(e)}


# ══════════════════════════════════════════════════════════
# Metrics (6 kartu di header dashboard)
# ══════════════════════════════════════════════════════════

@router.get("/stocks/{ticker}/metrics")
def metrics(ticker: str, date: str | None = None, window: int = 30):
    ticker = ticker.upper()
    price_df = storage.read_prices([ticker])
    flow_df = storage.read_broker_flow([ticker])
    activity_df = storage.read_broker_activity([ticker])

    if flow_df.empty:
        raise HTTPException(404, f"No broker data for {ticker}")

    ts = pd.Timestamp(date) if date else flow_df["date"].max()
    win_start = ts - pd.Timedelta(days=window)
    flow_win = flow_df[(flow_df["date"] >= win_start) & (flow_df["date"] <= ts)]
    act_win = activity_df[(activity_df["date"] >= win_start) & (activity_df["date"] <= ts)]

    # ── Return harga ──
    def ret(periods: int):
        sub = price_df[price_df["date"] <= ts].sort_values("date")
        if len(sub) <= periods:
            return None
        base = float(sub.iloc[-periods - 1]["close"])
        if not base:
            return None
        return float(sub.iloc[-1]["close"]) / base - 1

    # ── Foreign net 5 hari ──
    foreign_5d = None
    if not flow_win.empty and "foreign_net_broker" in flow_win.columns:
        foreign_5d = float(
            flow_win.sort_values("date").tail(5)["foreign_net_broker"].fillna(0).sum()
        )

    # ── Top brokers ──
    top_buy, top_sell = analysis.top_net_broker_summary(ticker, trade_date=ts, top_n=6)

    # ── Sinyal terakhir ──
    signal_row = {}
    if not flow_win.empty:
        signal_row = flow_win.sort_values("date").iloc[-1].to_dict()

    # ── Conviction score (replica bobot app.py) ──
    causality = analysis.causality_foreign_vs_price(ticker, max_lags=5)
    p = None if causality is None else causality.get("min_p_value")
    if p is None or p != p:  # None atau NaN
        p_score = 50
    elif p <= 0.01:
        p_score = 100
    elif p <= 0.05:
        p_score = 80
    elif p <= 0.10:
        p_score = 55
    else:
        p_score = 20

    raw = str(signal_row.get("bandar_signal") or "").upper()
    s_map = {
        "AKUMULASI_KUAT": 100, "STRONG_ACCUMULATION": 100,
        "AKUMULASI": 80, "ACCUMULATION": 80, "NET_BUY": 80,
        "NETRAL": 50, "NEUTRAL": 50,
        "DISTRIBUSI": 25, "DISTRIBUTION": 25, "NET_SELL": 25,
        "DISTRIBUSI_KUAT": 0, "STRONG_DISTRIBUTION": 0,
    }
    s_score = s_map.get(raw, 40)

    f_score = 50
    if foreign_5d is not None:
        f_score = 100 if foreign_5d > 0 else (0 if foreign_5d < 0 else 50)

    w_score, w_note = 50.0, "No broker validation sample"
    scan = analysis.broker_alpha_scan(
        [ticker], horizon=10, min_events=5, min_net_value=0,
        group_by=("ticker", "broker_code"),
    )
    if not scan.empty:
        r = scan.sort_values(
            ["significant", "p_value_one_sided", "mean_fwd_return"],
            ascending=[False, True, False],
        ).iloc[0]
        w_score = max(0.0, min(100.0, float(r.get("win_rate", 0.5)) * 100))
        w_note = r["broker_code"] + " win rate " + format(r["win_rate"], ".0%")

    score = p_score * 0.30 + s_score * 0.30 + f_score * 0.20 + w_score * 0.20

    # ── Smart cumulative ──
    smart_cum = None
    if not act_win.empty and "broker_code" in act_win.columns:
        act_win = act_win.copy()
        act_win["profile"] = act_win["broker_code"].map(analysis.broker_profile_of)
        smart = act_win[act_win["profile"].isin({"smart_foreign", "local_institutional"})]
        if not smart.empty:
            smart_cum = float(smart["net_value"].sum())

    return _clean({
        "ticker": ticker,
        "analysis_date": str(ts.date()),
        "window_start": str(win_start.date()),
        "signal": signal_row.get("bandar_signal"),
        "conviction": {
            "score": round(score, 1),
            "p_value": p,
            "components": {
                "causality": p_score,
                "signal": s_score,
                "foreign": f_score,
                "broker": round(w_score, 1),
            },
            "broker_note": w_note,
        },
        "ret_5d": ret(5),
        "ret_10d": ret(10),
        "foreign_net_5d": foreign_5d,
        "smart_cumulative": smart_cum,
        "top_buyers": top_buy.to_dict("records") if not top_buy.empty else [],
        "top_sellers": top_sell.to_dict("records") if not top_sell.empty else [],
    })


# ══════════════════════════════════════════════════════════
# Tab Analisis
# ══════════════════════════════════════════════════════════

@router.get("/stocks/{ticker}/smart-flow")
def smart_flow(ticker: str, window: int = 30):
    ticker = ticker.upper()
    act = storage.read_broker_activity([ticker])
    if act.empty:
        return {"data": []}
    end = act["date"].max()
    win = act[(act["date"] >= end - pd.Timedelta(days=window)) & (act["date"] <= end)].copy()
    if win.empty:
        return {"data": []}
    win["profile"] = win["broker_code"].map(analysis.broker_profile_of)
    smart = win[win["profile"].isin({"smart_foreign", "local_institutional"})]
    if smart.empty:
        return {"data": []}
    daily = smart.groupby("date")["net_value"].sum().reset_index(name="smart_net").sort_values("date")
    daily["cumulative_net"] = daily["smart_net"].cumsum()
    daily["date"] = daily["date"].astype(str)
    return {"data": _clean(daily.to_dict("records"))}


@router.get("/stocks/{ticker}/broker-compare")
def broker_compare(ticker: str, window: int = 30, mode: str = "cumulative"):
    ticker = ticker.upper()
    act = storage.read_broker_activity([ticker])
    if act.empty:
        return {"data": []}
    end = act["date"].max()
    win = act[(act["date"] >= end - pd.Timedelta(days=window)) & (act["date"] <= end)]
    if win.empty:
        return {"data": []}
    pivot = win.pivot_table(
        index="date", columns="broker_code", values="net_value", aggfunc="sum"
    ).sort_index()
    if mode == "cumulative":
        pivot = pivot.cumsum()
    data = []
    for idx, row in pivot.iterrows():
        rec = {"date": str(idx)}
        for c in pivot.columns:
            v = row[c]
            rec[c] = float(v) if v == v else None  # NaN -> None
        data.append(rec)
    return {"data": data}


@router.get("/stocks/{ticker}/causality")
def causality(ticker: str):
    ticker = ticker.upper()
    f = analysis.causality_foreign_vs_price(ticker, max_lags=5)
    part = analysis.causality_by_participant(ticker, max_lags=5)
    broker = analysis.causality_by_broker(ticker, top_n=15, max_lags=5)
    return _clean({
        "foreign": f,
        "participants": part.to_dict("records") if part is not None and not part.empty else [],
        "brokers": broker.to_dict("records") if broker is not None and not broker.empty else [],
    })


@router.get("/validation/broker-scan")
def validation(ticker: str, horizon: int = 10, min_events: int = 5, min_net_b: float = 0.0):
    ticker = ticker.upper()
    df = analysis.broker_alpha_scan(
        [ticker], horizon=horizon, min_events=min_events,
        min_net_value=min_net_b * 1e9, group_by=("ticker", "broker_code"),
    )
    return {"data": _clean(df.to_dict("records")) if not df.empty else []}


@router.get("/stocks/{ticker}/event-study")
def event_study(ticker: str, horizons: str = "1,3,5,10", lookback_days: int = 20):
    ticker = ticker.upper()
    hs = tuple(int(h) for h in horizons.split(","))
    table = analysis.event_study_table(
        tickers=[ticker], horizons=hs, lookback_days=lookback_days,
        signals={"AKUMULASI_KUAT", "AKUMULASI", "STRONG_ACCUMULATION",
                 "ACCUMULATION", "NET_BUY"},
    )
    return {"data": _clean(table.to_dict("records")) if not table.empty else []}


@router.get("/screener")
def screener(universe_mode: str = "watchlist", horizon: int = 10):
    tickers = universe.get_universe(mode=universe_mode)
    scan = analysis.broker_alpha_scan(
        tickers, horizon=horizon, min_events=5, min_net_value=0,
        group_by=("ticker", "broker_code"),
    )
    return {"data": _clean(scan.to_dict("records")) if not scan.empty else []}


@router.get("/stocks/{ticker}/raw")
def raw_tables(ticker: str, window: int = 30):
    ticker = ticker.upper()
    flow = storage.read_broker_flow([ticker])
    act = storage.read_broker_activity([ticker])
    end = flow["date"].max() if not flow.empty else act["date"].max()
    start = end - pd.Timedelta(days=window)

    def trim(df):
        if df.empty:
            return []
        d = df.copy()
        d["date"] = pd.to_datetime(d["date"])
        w = d[(d["date"] >= start) & (d["date"] <= end)].copy()
        w["date"] = w["date"].astype(str)
        # Ubah ke object dulu agar None benar-benar bisa menggantikan NaN
        w = w.astype(object).where(pd.notna(w), None)
        return w.to_dict("records")

    return _clean({"flow": trim(flow), "activity": trim(act)})


@router.get("/stocks/{ticker}/broker-profiles")
def broker_profiles(ticker: str, lookback_days: int = 30):
    df = analysis.broker_profile_flow_table(ticker.upper(), lookback_days=lookback_days)
    return {"data": _clean(df.to_dict("records")) if df is not None and not df.empty else []}


@router.get("/stocks/{ticker}/price-performance")
def price_performance(ticker: str):
    df = analysis.price_performance_table(ticker.upper())
    return {"data": _clean(df.to_dict("records")) if df is not None and not df.empty else []}


@router.get("/stocks/{ticker}/broker-distribution")
def broker_distribution(ticker: str, trade_date: str | None = None, top_n: int = 12):
    ts = pd.Timestamp(trade_date) if trade_date else None
    df = analysis.broker_distribution_table(ticker.upper(), trade_date=ts, top_n=top_n)
    return {"data": _clean(df.to_dict("records")) if df is not None and not df.empty else []}


# ══════════════════════════════════════════════════════════
# Pipeline (tombol-tombol di sidebar)
# ══════════════════════════════════════════════════════════

@router.post("/pipeline/run")
def run_pipeline(universe_mode: str = "watchlist"):
    def _job():
        pipeline.run(universe_mode=universe_mode)

    threading.Thread(target=_job, daemon=True).start()
    return {"status": "started", "universe_mode": universe_mode}


@router.post("/pipeline/backfill")
def backfill(tickers: str = "BBCA", start: str = "2024-01-01", end: str | None = None):
    def _job():
        pipeline.backfill_broker_history(
            tickers=tickers.split(","), start=start, end=end
        )

    threading.Thread(target=_job, daemon=True).start()
    return {"status": "started", "tickers": tickers.split(","), "start": start}
# ══════════════════════════════════════════════════════════
# Daily Summary (Home mobile TradePulse)
# ══════════════════════════════════════════════════════════

@router.get("/daily-summary")
def daily_summary(universe_mode: str = "watchlist"):
    tickers = universe.get_universe(mode=universe_mode)
    items = []
    for t in tickers:
        try:
            price_df = storage.read_prices([t])
            flow_df = storage.read_broker_flow([t])
            if flow_df.empty:
                continue
            flow_df = flow_df.sort_values("date")
            last = flow_df.iloc[-1]

            # return 5 hari terakhir
            ret_5d = None
            sub = price_df[price_df["date"] <= last["date"]].sort_values("date")
            if len(sub) > 5:
                base = float(sub.iloc[-6]["close"])
                if base:
                    ret_5d = float(sub.iloc[-1]["close"]) / base - 1

            # foreign net 5 hari
            f5 = None
            tail5 = flow_df.tail(5)
            if "foreign_net_broker" in tail5.columns:
                f5 = float(tail5["foreign_net_broker"].fillna(0).sum())

            items.append({
                "ticker": t,
                "date": str(last["date"]),
                "signal": last.get("bandar_signal"),
                "signal_score": last.get("bandar_signal_score"),
                "close": float(sub.iloc[-1]["close"]) if len(sub) else None,
                "ret_5d": ret_5d,
                "foreign_net_5d": f5,
                "spark": [float(x) for x in sub.tail(30)["close"]],
            })
        except Exception:
            continue

    from collections import Counter
    counts = Counter((i["signal"] or "NETRAL").upper() for i in items)
    top = sorted(items, key=lambda x: (x["signal_score"] or 0), reverse=True)[:5]

    return _clean({
        "as_of": max((i["date"] for i in items), default=None),
        "signal_counts": dict(counts),
        "items": items,
        "top_conviction": top,
    })
