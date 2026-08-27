"""Router: /api/stocks — data harga & OHLCV."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.dependencies import DbSession
from app.models import Price
from app.schemas import PriceHistoryResponse, PriceOut

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get(
    "/{ticker}/history",
    response_model=PriceHistoryResponse,
    summary="Ambil data harga historis (OHLCV) untuk satu ticker",
    description="Mengembalikan riwayat harga harian yang tersedia di tabel prices, diurutkan dari terbaru.",
)
def get_stock_history(
    ticker: str,
    limit: int = Query(500, ge=1, le=5000, description="Jumlah baris maksimum"),
    db: DbSession,
) -> PriceHistoryResponse:
    from sqlalchemy import desc, select

    stmt = (
        select(Price)
        .where(Price.ticker == ticker.upper().strip())
        .order_by(desc(Price.date))
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()

    if not rows:
        raise HTTPException(status_code=404, detail=f"No price data found for ticker {ticker}")

    return PriceHistoryResponse(
        ticker=ticker.upper().strip(),
        count=len(rows),
        data=[PriceOut.model_validate(r) for r in rows],
    )
