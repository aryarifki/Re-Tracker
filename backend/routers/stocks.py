"""Stock price history endpoints."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Price
from schemas import PriceHistoryResponse

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get(
    "/{ticker}/history",
    response_model=PriceHistoryResponse,
    summary="Historical OHLCV data for one ticker",
)
def get_stock_history(
    ticker: str,
    start_date: date | None = Query(None, description="Filter start (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="Filter end (YYYY-MM-DD)"),
    limit: int = Query(500, ge=1, le=5000, description="Max rows returned"),
    db: Session = Depends(get_db),
) -> PriceHistoryResponse:
    ticker = ticker.upper().replace(".JK", "").strip()

    stmt = select(Price).where(Price.ticker == ticker)

    if start_date:
        stmt = stmt.where(Price.date >= start_date)
    if end_date:
        stmt = stmt.where(Price.date <= end_date)

    stmt = stmt.order_by(Price.date.desc()).limit(limit)

    rows = db.execute(stmt).scalars().all()

    # Return ascending (oldest first) — what charting libraries expect
    rows = list(reversed(rows))

    return PriceHistoryResponse(
        ticker=ticker,
        count=len(rows),
        data=rows,
        sort_order="asc",
    )
