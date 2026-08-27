"""Pydantic schemas untuk validasi data masuk & serialisasi data keluar."""

from __future__ import annotations

from datetime import date as dt_date
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Shared ───────────────────────────────────────────────────────────────
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Prices ───────────────────────────────────────────────────────────────
class PriceOut(BaseSchema):
    date: dt_date
    ticker: str
    open: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    volume: int | None = None


class PriceHistoryResponse(BaseSchema):
    ticker: str
    count: int
    data: list[PriceOut]


# ── Broker Flow ──────────────────────────────────────────────────────────
class BrokerFlowOut(BaseSchema):
    date: dt_date
    ticker: str
    bandar_signal: str | None = None
    bandar_signal_score: float | None = None
    foreign_net_broker: float | None = None
    local_net_broker: float | None = None
    gov_net_broker: float | None = None
    foreign_net_flow: float | None = None
    domestic_net_flow: float | None = None
    total_value: float | None = None
    foreign_signal: str | None = None
    conclusion_broker: str | None = None
    conclusion_flow: str | None = None
    fetched_at: datetime | None = None


class BrokerFlowHistoryResponse(BaseSchema):
    ticker: str
    count: int
    data: list[BrokerFlowOut]


# ── Broker Activity ──────────────────────────────────────────────────────
class BrokerActivityOut(BaseSchema):
    date: dt_date
    ticker: str
    broker_code: str
    participant_type: str | None = None
    buy_value: float | None = None
    sell_value: float | None = None
    net_value: float | None = None
    buy_lot: float | None = None
    sell_lot: float | None = None
    frequency: float | None = None
    buy_avg_price: float | None = None
    sell_avg_price: float | None = None
    fetched_at: datetime | None = None


class BrokerActivityResponse(BaseSchema):
    ticker: str
    trade_date: dt_date
    count: int
    data: list[BrokerActivityOut]
