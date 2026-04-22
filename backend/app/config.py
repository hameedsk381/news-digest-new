"""
Application configuration using pydantic-settings.
Loads values from .env file and environment variables.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # MongoDB
    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "news_intelligence"

    # Tesseract OCR
    tesseract_path: Optional[str] = None

    # Groq LLM API
    groq_api_key: Optional[str] = None

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
