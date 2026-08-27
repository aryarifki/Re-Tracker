"""SQLAlchemy models mapping to EXISTING tables created by the data pipeline.

IMPORTANT: Do NOT run metadata.create_all() against the production DB.
The cron pipeline owns the schema; this file is read-only mapping.
"""
from __future__ import annotations

from datetime import date as date_type

from sqlalchemy import BigInteger, Date, Float, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Price(Base):
    """Mirror of the `prices` table (OHLCV daily bars)."""
    __tablename__ = "prices"
    __table_args__ = (
        Index("ix_prices_ticker_date", "ticker", "date"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date_type] = mapped_column(Date, nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[float] = mapped_column(BigInteger, nullable=False, default=0)


class BrokerFlow(Base):
    """Mirror of the `broker_flow` table (daily bandarmology summary)."""
    __tablename__ = "broker_flow"
    __table_args__ = (
        Index("ix_broker_flow_ticker_date", "ticker", "date"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date_type] = mapped_column(Date, nullable=False, index=True)
    ticker: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    bandar_signal: Mapped[str | None] = mapped_column(String(32), nullable=True)
    foreign_net_broker: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_value: Mapped[float | None] = mapped_column(Numeric(20, 2), nullable=True)
