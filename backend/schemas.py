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

# ══════════════════════════════════════════════════════════
# Broker Flow / Bandarmology Schemas
# ══════════════════════════════════════════════════════════

class BrokerFlowHistoryResponse(BaseModel):
    """Envelope for GET /api/broker-flow/{ticker}/history."""
    ticker: str
    count: int
    data: list[BrokerFlowRow]
    sort_order: Literal["asc", "desc"] = "asc"


class BrokerFlowSummary(BaseModel):
    """Agregat N hari terakhir — untuk overlay grafik & panel statistik."""
    ticker: str
    period_days: int
    trading_days: int

    # Akumulasi net (dalam Rupiah)
    foreign_net_broker_sum: float
    local_net_broker_sum: float
    gov_net_broker_sum: float
    total_value_sum: float

    # Rasio distribusi (persentase 0-100)
    foreign_dominance_pct: float

    # Sinyal terakhir
    latest_bandar_signal: str | None
    latest_bandar_signal_score: float | None
    latest_foreign_signal: str | None

    # Hitungan sinyal dalam periode
    accumulation_days: int   # jumlah hari dengan bandar_signal mengandung 'akumulasi'
    distribution_days: int   # jumlah hari dengan bandar_signal mengandung 'distribusi'

    latest_date: date_type | None


class ErrorResponse(BaseModel):
    detail: str
