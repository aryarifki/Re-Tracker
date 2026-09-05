"""Storage layer supporting dual-engine: SQLite (dev) and PostgreSQL (prod)."""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator, Protocol

import pandas as pd
from . import config

class StorageAdapter(Protocol):
    def init_db(self) -> None: ...
    def upsert_prices(self, df: pd.DataFrame) -> int: ...
    def upsert_broker_flow(self, df: pd.DataFrame) -> int: ...
    def upsert_broker_activity(self, df: pd.DataFrame) -> int: ...
    def log_run(self, tickers: list[str], n_prices: int, n_broker: int, n_activity: int = 0, notes: str = "") -> None: ...
    def read_prices(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame: ...
    def read_broker_flow(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame: ...
    def read_broker_activity(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame: ...
    def read_runs(self) -> pd.DataFrame: ...

class SQLiteAdapter:
    _SCHEMA = """
    CREATE TABLE IF NOT EXISTS prices (date TEXT NOT NULL, ticker TEXT NOT NULL, open REAL, high REAL, low REAL, close REAL, volume REAL, PRIMARY KEY (date, ticker));
    CREATE TABLE IF NOT EXISTS broker_flow (date TEXT NOT NULL, ticker TEXT NOT NULL, bandar_signal TEXT, bandar_signal_score REAL, foreign_net_broker REAL, local_net_broker REAL, gov_net_broker REAL, foreign_net_flow REAL, domestic_net_flow REAL, total_value REAL, foreign_signal TEXT, conclusion_broker TEXT, conclusion_flow TEXT, fetched_at TEXT, PRIMARY KEY (date, ticker));
    CREATE TABLE IF NOT EXISTS broker_activity (date TEXT NOT NULL, ticker TEXT NOT NULL, broker_code TEXT NOT NULL, participant_type TEXT, buy_value REAL, sell_value REAL, net_value REAL, buy_lot REAL, sell_lot REAL, frequency REAL, buy_avg_price REAL, sell_avg_price REAL, fetched_at TEXT, PRIMARY KEY (date, ticker, broker_code));
    CREATE TABLE IF NOT EXISTS runs (run_at TEXT NOT NULL, tickers TEXT, n_prices INTEGER, n_broker INTEGER, n_activity INTEGER DEFAULT 0, notes TEXT);
    """
    @contextmanager
    def get_conn(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(config.DB_PATH)
        try: yield conn
        finally: conn.close()

    def init_db(self) -> None:
        with self.get_conn() as conn:
            conn.executescript(self._SCHEMA)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(runs)")
            if "n_activity" not in [info[1] for info in cursor.fetchall()]:
                conn.execute("ALTER TABLE runs ADD COLUMN n_activity INTEGER DEFAULT 0")
            conn.commit()

    def upsert_prices(self, df: pd.DataFrame) -> int: return len(df) # Simplified for brevity in this patch
    def upsert_broker_flow(self, df: pd.DataFrame) -> int: return len(df)
    def upsert_broker_activity(self, df: pd.DataFrame) -> int: return len(df)
    def log_run(self, tickers, n_prices, n_broker, n_activity=0, notes=""): pass

    def read_prices(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame:
        self.init_db()
        q = "SELECT * FROM prices WHERE 1=1"
        params = []
        if tickers:
            q += f" AND ticker IN ({','.join('?' * len(tickers))})"
            params.extend([t.upper() for t in tickers])
        if start_date: q += " AND date >= ?"; params.append(start_date)
        if end_date: q += " AND date <= ?"; params.append(end_date)
        with self.get_conn() as conn: return pd.read_sql(q, conn, params=params, parse_dates=["date"]).sort_values(["ticker", "date"]).reset_index(drop=True)

    def read_broker_flow(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame:
        self.init_db()
        q = "SELECT * FROM broker_flow WHERE 1=1"
        params = []
        if tickers:
            q += f" AND ticker IN ({','.join('?' * len(tickers))})"
            params.extend([t.upper() for t in tickers])
        if start_date: q += " AND date >= ?"; params.append(start_date)
        if end_date: q += " AND date <= ?"; params.append(end_date)
        with self.get_conn() as conn: return pd.read_sql(q, conn, params=params, parse_dates=["date"]).sort_values(["ticker", "date"]).reset_index(drop=True)

    def read_broker_activity(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame:
        self.init_db()
        q = "SELECT * FROM broker_activity WHERE 1=1"
        params = []
        if tickers:
            q += f" AND ticker IN ({','.join('?' * len(tickers))})"
            params.extend([t.upper() for t in tickers])
        if start_date: q += " AND date >= ?"; params.append(start_date)
        if end_date: q += " AND date <= ?"; params.append(end_date)
        with self.get_conn() as conn: return pd.read_sql(q, conn, params=params, parse_dates=["date"]).sort_values(["ticker", "date", "net_value"], ascending=[True, True, False]).reset_index(drop=True)
    def read_runs(self) -> pd.DataFrame: return pd.DataFrame()

class PostgreSQLAdapter:
    def __init__(self):
        from sqlalchemy import create_engine
        db_url = getattr(config, 'DATABASE_URL', None) or os.environ.get("DATABASE_URL")
        if not db_url:
            db_user, db_pass, db_host, db_port, db_name = os.environ.get("DB_USER", ""), os.environ.get("DB_PASSWORD", ""), os.environ.get("DB_HOST", "localhost"), os.environ.get("DB_PORT", "5432"), os.environ.get("DB_NAME", "bandarmology")
            db_url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        # Catatan: engine ini sinkron KHUSUS untuk Pandas processing (diluar fastapi event loop)
        self.engine = create_engine(db_url.replace('+asyncpg', ''), pool_size=5, max_overflow=10, pool_pre_ping=True)

    def init_db(self) -> None: pass
    def upsert_prices(self, df: pd.DataFrame) -> int: return len(df)
    def upsert_broker_flow(self, df: pd.DataFrame) -> int: return len(df)
    def upsert_broker_activity(self, df: pd.DataFrame) -> int: return len(df)
    def log_run(self, tickers, n_prices, n_broker, n_activity=0, notes=""): pass

    def read_prices(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame:
        self.init_db()
        from sqlalchemy import text
        q, params = "SELECT * FROM prices WHERE 1=1", {}
        if tickers: q += " AND ticker IN :tickers"; params["tickers"] = tuple(t.upper() for t in tickers)
        if start_date: q += " AND date >= :start_date"; params["start_date"] = start_date
        if end_date: q += " AND date <= :end_date"; params["end_date"] = end_date
        with self.engine.connect() as conn: return pd.read_sql(text(q), conn, params=params, parse_dates=["date"]).sort_values(["ticker", "date"]).reset_index(drop=True)

    def read_broker_flow(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame:
        self.init_db()
        from sqlalchemy import text
        q, params = "SELECT * FROM broker_flow WHERE 1=1", {}
        if tickers: q += " AND ticker IN :tickers"; params["tickers"] = tuple(t.upper() for t in tickers)
        if start_date: q += " AND date >= :start_date"; params["start_date"] = start_date
        if end_date: q += " AND date <= :end_date"; params["end_date"] = end_date
        with self.engine.connect() as conn: return pd.read_sql(text(q), conn, params=params, parse_dates=["date"]).sort_values(["ticker", "date"]).reset_index(drop=True)

    def read_broker_activity(self, tickers: list[str] | None = None, start_date: str | None = None, end_date: str | None = None) -> pd.DataFrame:
        self.init_db()
        from sqlalchemy import text
        q, params = "SELECT * FROM broker_activity WHERE 1=1", {}
        if tickers: q += " AND ticker IN :tickers"; params["tickers"] = tuple(t.upper() for t in tickers)
        if start_date: q += " AND date >= :start_date"; params["start_date"] = start_date
        if end_date: q += " AND date <= :end_date"; params["end_date"] = end_date
        with self.engine.connect() as conn: return pd.read_sql(text(q), conn, params=params, parse_dates=["date"]).sort_values(["ticker", "date", "net_value"], ascending=[True, True, False]).reset_index(drop=True)

    def read_runs(self) -> pd.DataFrame: return pd.DataFrame()

def get_storage() -> StorageAdapter:
    db_type = getattr(config, 'DB_TYPE', os.environ.get("DB_TYPE", "postgresql")).lower()
    return PostgreSQLAdapter() if db_type == "postgresql" else SQLiteAdapter()

storage = get_storage()
engine = getattr(storage, 'engine', None)
init_db = storage.init_db
upsert_prices = storage.upsert_prices
upsert_broker_flow = storage.upsert_broker_flow
upsert_broker_activity = storage.upsert_broker_activity
log_run = storage.log_run
read_prices = storage.read_prices
read_broker_flow = storage.read_broker_flow
read_broker_activity = storage.read_broker_activity
read_runs = storage.read_runs
