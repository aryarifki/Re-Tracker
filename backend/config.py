"""Central configuration, loaded from .env."""
from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg2://adryan:adryan@localhost:5432/bandarmology")
    # Frontend Next.js origins allowed to call this API
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]
    API_V1_PREFIX: str = "/api"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
