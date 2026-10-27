"""Application settings loaded from environment variables / backend/.env."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    gapgpt_api_key: str = ""
    gapgpt_base_url: str = "https://api.gapgpt.app/v1"
    ai_default_model: str = "gpt-4o"
    ai_timeout_seconds: float = 20.0
    database_url: str = "sqlite:///./data/tickets.db"
    cors_origins: str = "http://localhost:3000"
    seed_on_startup: bool = True
    # Demo mode enables the X-User header "login", the demo user picker and the API docs.
    demo_mode: bool = True
    debug: bool = False
    # AI cost/abuse protection
    ai_rate_per_minute: int = 5
    ai_daily_cap: int = 300

    @property
    def ai_enabled(self) -> bool:
        return bool(self.gapgpt_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
