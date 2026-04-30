"""
Redis connection pool — shared across all workers.
Reads REDIS_URL from environment (default: redis://localhost:6379/0).
Supports horizontal scaling: every backend instance connects to the same Redis.
"""
import os
import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SESSION_EXPIRE_SECONDS = int(os.getenv("SESSION_EXPIRE_SECONDS", 86400))  # 24 h

# Thread-safe connection pool — reused across requests
_pool = redis.ConnectionPool.from_url(
    REDIS_URL,
    max_connections=20,
    decode_responses=True,   # all values returned as str
)

def get_redis() -> redis.Redis:
    """Return a Redis client using the shared connection pool."""
    return redis.Redis(connection_pool=_pool)
