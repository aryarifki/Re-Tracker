"""Pydantic schemas — serialization & validation for API I/O."""
from __future__ import annotations

from datetime import date as date_type
from typing import Literal

from pydantic import BaseModel, ConfigDict


class PriceBar(BaseModel):
    """One OHLCV row — shape matches TradingView Lightweight Charts."""
    model_config = ConfigDict(from_attributes=True)

    date: date_type
    ticker: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class BrokerFlowRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date_type
    ticker: str
    bandar_signal: str | None = None
    foreign_net_broker: float | None = None
    total_value: float | None = None


class PriceHistoryResponse(BaseModel):
    """Envelope for GET /api/stocks/{ticker}/history."""
    ticker: str
    count: int
    data: list[PriceBar]

    sort_order: Literal["asc", "desc"] = "asc"


class ErrorResponse(BaseModel):
    detail: str
