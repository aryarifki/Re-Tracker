from datetime import date, timedelta
import pandas as pd
from fastapi import APIRouter, Query, HTTPException
from .idx_bridge import analysis, storage, universe

router = APIRouter(prefix="/api/bandar", tags=["bandarmology"])

@router.get("/universe")
def get_universe(mode: str = "watchlist"):
    return {"tickers": universe.get_universe(mode=mode)}

@router.get("/tickers")
def master_tickers():
    try:
        return {"tickers": universe.get_master_tickers(active_only=True)}
    except Exception:
        return {"tickers": []}

@router.get("/stocks/{ticker}/metrics")
def metrics(ticker: str, date: str | None = None, window: int = 30):
    price_df = storage.read_prices([ticker])
    flow_df = storage.read_broker_flow([ticker])
    activity_df = storage.read_broker_activity([ticker])
    if flow_df.empty:
        raise HTTPException(404, f"No data for {ticker}")
    ts = pd.Timestamp(date) if date else flow_df["date"].max()
    win_start = ts - pd.Timedelta(days=window)
    flow_win = flow_df[(flow_df["date"] >= win_start) & (flow_df["date"] <= ts)]
    act_win = activity_df[(activity_df["date"] >= win_start) & (activity_df["date"] <= ts)]

    def ret(periods: int):
        sub = price_df[price_df["date"] <= ts].sort_values("date")
        if len(sub) <= periods:
            return None
        base = float(sub.iloc[-periods - 1]["close"])
        return float(sub.iloc[-1]["close"]) / base - 1 if base else None

    foreign_5d = float(flow_win.sort_values("date").tail(5)["foreign_net_broker"].fillna(0).sum())
    top_buy, top_sell = analysis.top_net_broker_summary(ticker, trade_date=ts, top_n=6)
    signal_row = flow_win[flow_win["date"] <= ts].sort_values("date").iloc[-1].to_dict() if not flow_win.empty else {}
    causality = analysis.causality_foreign_vs_price(ticker, max_lags=5)
    scan = analysis.broker_alpha_scan([ticker], horizon=10, min_events=5, min_net_value=0, group_by=("ticker", "broker_code"))

    # conviction (replica of app.py weights)
    p = None if not causality else float(causality.get("min_p_value", float("nan")))
    p_score = 50 if p is None or p != p else (100 if p <= 0.01 else 80 if p <= 0.05 else 55 if p <= 0.10 else 20)
    raw = str(signal_row.get("bandar_signal") or "").upper()
    s_score = {"AKUMULASI_KUAT": 100, "STRONG_ACCUMULATION": 100, "AKUMULASI": 80, "ACCUMULATION": 80,
               "NET_BUY": 80, "NETRAL": 50, "NEUTRAL": 50, "DISTRIBUSI": 25, "DISTRIBUTION": 25,
               "NET_SELL": 25, "DISTRIBUSI_KUAT": 0, "STRONG_DISTRIBUTION": 0}.get(raw, 40)
    f_score = 100 if foreign_5d > 0 else 0 if foreign_5d < 0 else 50
    w_score, w_note = 50.0, "No broker validation sample"
    if not scan.empty:
        r = scan.sort_values(["significant", "p_value_one_sided", "mean_fwd_return"],
                             ascending=[False, True, False]).iloc[0]
        w_score = max(0, min(100, float(r.get("win_rate", 0.5)) * 100))
        w_note = f"{r['broker_code']} win rate {r['win_rate']:.0%}"
    score = p_score * 0.30 + s_score * 0.30 + f_score * 0.20 + w_score * 0.20

    return {
        "ticker": ticker, "analysis_date": str(ts.date()),
        "signal": signal_row.get("bandar_signal"),
        "conviction": {"score": round(score, 1), "p_value": p,
                       "components": {"causality": p_score, "signal": s_score,
                                      "foreign": f_score, "broker": round(w_score, 1)},
                       "broker_note": w_note},
        "ret_5d": ret(5), "ret_10d": ret(10),
        "foreign_net_5d": foreign_5d,
        "close": float(flow_win["close"].iloc[-1]) if "close" in flow_win else None,
        "top_buyers": top_buy.to_dict("records") if not top_buy.empty else [],
        "top_sellers": top_sell.to_dict("records") if not top_sell.empty else [],
tambahan }

@router.get("/stocks/{ticker}/smart-flow")
def smart_flow(ticker: str, window: int = 30):
    act = storage.read_broker_activity([ticker])
    from .idx_bridge import analysis as a
    end = act["date"].max() if not act.empty else pd.Timestamp.today()
    win = act[(act["date"] >= end - pd.Timedelta(days=window)) & (act["date"] <= end)].copy()
    if win.empty:
        return {"data": []}
    win["profile"] = win["broker_code"].map(analysis.broker_profile_of)
    smart = win[win["profile"].isin({"smart_foreign", "local_institutional"})]
    daily = smart.groupby("date")["net_value"].sum().reset_index(name="smart_net").sort_values("date")
    daily["cumulative_net"] = daily["smart_net"].cumsum()
    return {"data": daily.assign(date=daily["date"].astype(str)).to_dict("records")}

@router.get("/stocks/{ticker}/broker-compare")
def broker_compare(ticker: str, window: int = 30, mode: str = "cumulative"):
    act = storage.read_broker_activity([ticker])
    end = act["date"].max()
    win = act[(act["date"] >= end - pd.Timedelta(days=window)) & (act["date"] <= end)]
    pivot = win.pivot_table(index="date", columns="broker_code", values="net_value", aggfunc="sum").sort_index()
    if mode == "cumulative":
        pivot = pivot.cumsum()
    return {"data": [{"date": str(idx), **{c: float(row[c]) for c in pivot.columns}}
                     for idx, row in pivot.iterrows()]}

@router.get("/stocks/{ticker}/causality")
def causality(ticker: str):
    f = analysis.causality_foreign_vs_price(ticker, max_lags=5)
    part = analysis.causality_by_participant(ticker, max_lags=5)
    broker = analysis.causality_by_broker(ticker, top_n=15, max_lags=5)
    return {
        "foreign": f,
        "participants": part.to_dict("records") if not part.empty else [],
        "brokers": broker.to_dict("records") if not broker.empty else [],
    }

@router.get("/validation/broker-scan")
def validation(ticker: str, horizon: int = 10, min_events: int = 5, min_net_b: float = 0.0):
    df = analysis.broker_alpha_scan([ticker], horizon=horizon, min_events=min_events,
                                    min_net_value=min_net_b * 1e9, group_by=("ticker", "broker_code"))
    return {"data": df.to_dict("records")}

@router.get("/stocks/{ticker}/event-study")
def event_study(ticker: str, horizons: str = "1,3,5,10", lookback_days: int = 20):
    hs = tuple(int(h) for h in horizons.split(","))
    table = analysis.event_study_table(tickers=[ticker], horizons=hs,
                                       lookback_days=lookback_days,
                                       signals={"AKUMULASI_KUAT", "AKUMULASI", "STRONG_ACCUMULATION", "ACCUMULATION", "NET_BUY"})
    return {"data": table.to_dict("records")}

@router.get("/screener")
def screener(universe_mode: str = "watchlist", horizon: int = 10, only_acc: bool = True):
    tickers = universe.get_universe(mode="watchlist")
    scan = analysis.broker_alpha_scan(tickers, horizon=horizon, min_events=5, min_net_value=0, group_by=("ticker", "broker_code"))
    return {"data": scan.to_dict("records")}
