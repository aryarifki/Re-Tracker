"""Pydantic schemas — serialization & validation for API I/O."""
from __future__ import annotations

from datetime import date as date_type
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class PriceBar(BaseModel):
    """One OHLCV row — shape matches TradingView Lightweight Charts."""
    model_config = ConfigDict(from_attributes=True)

    date: date_type
    ticker: str
    open: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    volume: int | None = None


class BrokerFlowRow(BaseModel):
    """Full bandarmology row for one (date, ticker)."""
    model_config = ConfigDict(from_attributes=True)

    date: date_type
    ticker: str

    bandar_signal: str | None = None
    bandar_signal_score: float | None = None
    foreign_signal: str | None = None

    foreign_net_broker: float | None = None
    local_net_broker: float | None = None
    gov_net_broker: float | None = None

    foreign_net_flow: float | None = None
    domestic_net_flow: float | None = None
    total_value: float | None = None

    conclusion_broker: str | None = None
    conclusion_flow: str | None = None

    fetched_at: datetime | None = None


class PriceHistoryResponse(BaseModel):
    """Envelope for GET /api/stocks/{ticker}/history."""
    ticker: str
    count: int
    data: list[PriceBar]

    sort_order: Literal["asc", "desc"] = "asc"


class ErrorResponse(BaseModel):
    detail: str
