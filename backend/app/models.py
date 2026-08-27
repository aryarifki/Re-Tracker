"""SQLAlchemy ORM models — mencerminkan skema tabel yang sudah ada di PostgreSQL."""

from __future__ import annotations

from datetime import date as dt_date
from datetime import datetime

from sqlalchemy import BigInteger, Date, Numeric, PrimaryKeyConstraint, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Price(Base):
    """Tabel prices: data OHLCV harian per ticker."""
    __tablename__ = "prices"
    __table_args__ = (PrimaryKeyConstraint("date", "ticker"),)

    date: Mapped[dt_date] = mapped_column(Date, primary_key=True)
    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)
    open: Mapped[float | None] = mapped_column(Numeric(18, 4), nullable=True)
    high: Mapped[float | None] = mapped_column(Numeric(18, 4), nullable=True)
    low: Mapped[float | None] = mapped_column(Numeric(18, 4), nullable=True)
    close: Mapped[float | None] = mapped_column(Numeric(18, 4), nullable=True)
    volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class BrokerFlow(Base):
    """Tabel broker_flow: snapshot bandarmologi & aliran asing/lokal harian."""
    __tablename__ = "broker_flow"
    __table_args__ = (PrimaryKeyConstraint("date", "ticker"),)

    date: Mapped[dt_date] = mapped_column(Date, primary_key=True)
    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)

    bandar_signal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bandar_signal_score: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    foreign_net_broker: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    local_net_broker: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gov_net_broker: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    foreign_net_flow: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    domestic_net_flow: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    total_value: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    foreign_signal: Mapped[str | None] = mapped_column(String(50), nullable=True)
    conclusion_broker: Mapped[str | None] = mapped_column(Text, nullable=True)
    conclusion_flow: Mapped[str | None] = mapped_column(Text, nullable=True)
    fetched_at: Mapped[datetime | None] = mapped_column(nullable=True)


class BrokerActivity(Base):
    """Tabel broker_activity: detail per-broker (buy/sell/net) per hari."""
    __tablename__ = "broker_activity"
    __table_args__ = (PrimaryKeyConstraint("date", "ticker", "broker_code"),)

    date: Mapped[dt_date] = mapped_column(Date, primary_key=True)
    ticker: Mapped[str] = mapped_column(String(20), primary_key=True)
    broker_code: Mapped[str] = mapped_column(String(20), primary_key=True)

    participant_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    buy_value: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    sell_value: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    net_value: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    buy_lot: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    sell_lot: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    frequency: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    buy_avg_price: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    sell_avg_price: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    fetched_at: Mapped[datetime | None] = mapped_column(nullable=True)
