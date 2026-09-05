"""SQLAlchemy models mapping to EXISTING tables created by the data pipeline."""
from __future__ import annotations
from datetime import date as date_type, datetime
from decimal import Decimal
from sqlalchemy import BigInteger, Date, DateTime, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Price(Base):
    __tablename__ = "prices"
    __table_args__ = (
        Index("ix_prices_ticker_date_desc", "ticker", "date"),
        {"extend_existing": True},
    )
    date: Mapped[date_type] = mapped_column(Date, primary_key=True)
    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)
    open: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    high: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    low: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    close: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

class BrokerFlow(Base):
    __tablename__ = "broker_flow"
    __table_args__ = (
        Index("ix_broker_flow_ticker_date_desc", "ticker", "date"),
        {"extend_existing": True},
    )
    date: Mapped[date_type] = mapped_column(Date, primary_key=True)
    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)
    bandar_signal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bandar_signal_score: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    foreign_signal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    foreign_net_broker: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    local_net_broker: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    gov_net_broker: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    foreign_net_flow: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    domestic_net_flow: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    total_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    conclusion_broker: Mapped[str | None] = mapped_column(Text, nullable=True)
    conclusion_flow: Mapped[str | None] = mapped_column(Text, nullable=True)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
