"""SQLAlchemy 2.0 engine, session factory, and declarative base."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# Engine — echo=True hanya untuk debug, matikan di production
engine = create_engine(
    str(settings.database_url),
    pool_pre_ping=True,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class untuk semua model SQLAlchemy."""
    pass


def get_db() -> Session:
    """Dependency injection: yield DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
