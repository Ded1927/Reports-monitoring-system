from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SESSION_EXPIRE_SECONDS: int = 86400
    
    # Ensure variables match the keys exactly
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    """
    Load environment variables and validate them.
    If a required variable (without a default value) is missing, 
    Pydantic will immediately raise a ValidationError, preventing the app from starting.
    """
    return Settings()

# Instantiate once on module load so it crashes during boot if invalid
settings = get_settings()
