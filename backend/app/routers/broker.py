"""Router: /api/broker-flow — data bandarmologi & aktivitas broker."""

from __future__ import annotations

from datetime import date as dt_date

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import and_, desc, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BrokerActivity, BrokerFlow
from app.schemas import (
    BrokerActivityResponse,
    BrokerFlowHistoryResponse,
    BrokerFlowOut,
    BrokerActivityOut,
)

router = APIRouter(prefix="/broker-flow", tags=["Broker Flow"])


@router.get(
    "/{ticker}/history",
    response_model=BrokerFlowHistoryResponse,
    summary="Ambil snapshot bandarmologi harian untuk satu ticker",
)
def get_broker_flow_history(
    ticker: str,
    limit: int = Query(365, ge=1, le=2000),
    db: Session = get_db,
) -> BrokerFlowHistoryResponse:
    stmt = (
        select(BrokerFlow)
        .where(BrokerFlow.ticker == ticker.upper().strip())
        .order_by(desc(BrokerFlow.date))
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()

    if not rows:
        raise HTTPException(status_code=404, detail=f"No broker flow data for ticker {ticker}")

    return BrokerFlowHistoryResponse(
        ticker=ticker.upper().strip(),
        count=len(rows),
        data=[BrokerFlowOut.model_validate(r) for r in rows],
    )


@router.get(
    "/{ticker}/activity",
    response_model=BrokerActivityResponse,
    summary="Ambil detail aktivitas per-broker untuk tanggal tertentu",
)
def get_broker_activity(
    ticker: str,
    trade_date: dt_date | None = Query(None, description="YYYY-MM-DD (default: latest available)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = get_db,
) -> BrokerActivityResponse:
    ticker_clean = ticker.upper().strip()

    # Jika trade_date tidak diberikan, ambil tanggal terakhir yang tersedia
    if trade_date is None:
        latest_stmt = (
            select(BrokerActivity.date)
            .where(BrokerActivity.ticker == ticker_clean)
            .order_by(desc(BrokerActivity.date))
            .limit(1)
        )
        latest_row = db.execute(latest_stmt).scalar_one_or_none()
        if latest_row is None:
            raise HTTPException(status_code=404, detail=f"No broker activity data for ticker {ticker}")
        trade_date = latest_row

    stmt = (
        select(BrokerActivity)
        .where(
            and_(
                BrokerActivity.ticker == ticker_clean,
                BrokerActivity.date == trade_date,
            )
        )
        .order_by(desc(BrokerActivity.net_value))
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()

    return BrokerActivityResponse(
        ticker=ticker_clean,
        trade_date=trade_date,
        count=len(rows),
        data=[BrokerActivityOut.model_validate(r) for r in rows],
    )
