"""
Database engine with production-grade connection pooling.

Pool settings tuned for 25k concurrent users:
  - pool_size=20     — persistent connections kept alive per process
  - max_overflow=40  — extra connections allowed under burst load (total 60/process)
  - pool_timeout=30  — raise after 30 s if no connection available
  - pool_recycle=1800 — recycle connections every 30 min (avoids stale TCP to PG)
  - pool_pre_ping=True — test connection health before use (detects dropped links)
"""
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://cyber_user:cyber_password@db:5432/cyber_mon_db"
)

engine = create_engine(
    DATABASE_URL,
    # ── Connection Pool ────────────────────────────────────────────────
    pool_size=20,          # persistent connections per process
    max_overflow=40,       # burst connections on top of pool_size
    pool_timeout=30,       # seconds to wait for a free connection
    pool_recycle=1800,     # recycle connections every 30 min
    pool_pre_ping=True,    # validate connection before use
    # ── Query tuning ───────────────────────────────────────────────────
    echo=False,            # set True to log SQL (dev only)
    connect_args={
        "options": "-c statement_timeout=30000",  # 30 s max query time
    },
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,   # avoid lazy-load after commit (reduces N+1 risk)
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
