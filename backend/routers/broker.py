"""Broker Flow (Bandarmology) endpoints."""
from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from models import BrokerFlow
from schemas import BrokerFlowHistoryResponse, BrokerFlowRow, BrokerFlowSummary

router = APIRouter(prefix="/broker-flow", tags=["Broker Flow (Bandarmology)"])

# Kata kunci klasifikasi sinyal — sesuaikan dengan output pipeline Anda
ACCUMULATION_KEYWORDS = ("akumulasi", "accumulation", "bullish")
DISTRIBUTION_KEYWORDS = ("distribusi", "distribution", "bearish")


def _normalize_ticker(ticker: str) -> str:
    return ticker.upper().replace(".JK", "").strip()


@router.get(
    "/{ticker}/latest",
    response_model=BrokerFlowRow,
    summary="Baris bandarmologi terakhir untuk satu ticker",
    responses={404: {"description": "Ticker tidak ditemukan / belum ada data"}},
)
def get_latest_broker_flow(
    ticker: str,
    db: Session = Depends(get_db),
) -> BrokerFlowRow:
    ticker = _normalize_ticker(ticker)

    row = db.execute(
        select(BrokerFlow)
        .where(BrokerFlow.ticker == ticker)
        .order_by(BrokerFlow.date.desc())
        .limit(1)
    ).scalar_one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Tidak ada data broker_flow untuk ticker '{ticker}'",
        )
    return row


@router.get(
    "/{ticker}/history",
    response_model=BrokerFlowHistoryResponse,
    summary="Histori bandarmologi (deret waktu) untuk satu ticker",
)
def get_broker_flow_history(
    ticker: str,
    start_date: date | None = Query(None, description="Filter start (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="Filter end (YYYY-MM-DD)"),
    limit: int = Query(250, ge=1, le=2500),
    db: Session = Depends(get_db),
) -> BrokerFlowHistoryResponse:
    ticker = _normalize_ticker(ticker)

    stmt = select(BrokerFlow).where(BrokerFlow.ticker == ticker)
    if start_date:
        stmt = stmt.where(BrokerFlow.date >= start_date)
    if end_date:
        stmt = stmt.where(BrokerFlow.date <= end_date)

    stmt = stmt.order_by(BrokerFlow.date.desc()).limit(limit)
    rows = list(reversed(db.execute(stmt).scalars().all()))  # ascending

    return BrokerFlowHistoryResponse(
        ticker=ticker,
        count=len(rows),
        data=rows,
        sort_order="asc",
    )


@router.get(
    "/{ticker}/summary",
    response_model=BrokerFlowSummary,
    summary="Agregat bandarmologi N hari terakhir (default 30 hari)",
)
def get_broker_flow_summary(
    ticker: str,
    days: int = Query(30, ge=1, le=365, description="Periode agregasi"),
    db: Session = Depends(get_db),
) -> BrokerFlowSummary:
    ticker = _normalize_ticker(ticker)
    cutoff = date.today() - timedelta(days=days)

    rows = db.execute(
        select(BrokerFlow)
        .where(BrokerFlow.ticker == ticker, BrokerFlow.date >= cutoff)
        .order_by(BrokerFlow.date.asc())
    ).scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"Tidak ada data broker_flow untuk '{ticker}' dalam {days} hari terakhir",
        )

    # ── Agregasi di Python (dataset kecil, <1 tahun ≈ 250 baris — aman & fleksibel) ──
    foreign_sum = sum(float(r.foreign_net_broker or 0) for r in rows)
    local_sum = sum(float(r.local_net_broker or 0) for r in rows)
    gov_sum = sum(float(r.gov_net_broker or 0) for r in rows)
    total_sum = sum(float(r.total_value or 0) for r in rows)

    total_parties = abs(foreign_sum) + abs(local_sum) + abs(gov_sum)
    foreign_dominance = (
        abs(foreign_sum) / total_parties * 100 if total_parties > 0 else 0.0
    )

    acc_days = sum(
        1 for r in rows
        if r.bandar_signal and any(k in r.bandar_signal.lower() for k in ACCUMULATION_KEYWORDS)
    )
    dist_days = sum(
        1 for r in rows
        if r.bandar_signal and any(k in r.bandar_signal.lower() for k in DISTRIBUTION_KEYWORDS)
    )

    latest = rows[-1]

    return BrokerFlowSummary(
        ticker=ticker,
        period_days=days,
        trading_days=len(rows),
        foreign_net_broker_sum=round(foreign_sum, 2),
        local_net_broker_sum=round(local_sum, 2),
        gov_net_broker_sum=round(gov_sum, 2),
        total_value_sum=round(total_sum, 2),
        foreign_dominance_pct=round(foreign_dominance, 2),
        latest_bandar_signal=latest.bandar_signal,
        latest_bandar_signal_score=float(latest.bandar_signal_score) if latest.bandar_signal_score else None,
        latest_foreign_signal=latest.foreign_signal,
        accumulation_days=acc_days,
        distribution_days=dist_days,
        latest_date=latest.date,
    )
