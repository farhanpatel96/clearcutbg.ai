from typing import List, Set
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment or defaults."""

    APP_NAME: str = "ClearCut AI - Background Remover API"
    APP_ENV: str = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS origins allowed to access the API
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # File and Image Resource Limits
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_IMAGE_PIXELS: int = 25_000_000  # 25 MP max (e.g., 5000x5000)
    MAX_IMAGE_DIMENSION: int = 6000  # max width or height

    # Model Configuration
    # Supported: 'u2net' (balanced high quality), 'u2netp' (lightweight), 'isnet-general-use', 'birefnet-general'
    MODEL_NAME: str = "u2net"

    # Concurrency control: limits simultaneous active AI inferences to protect memory & CPU
    MAX_CONCURRENT_INFERENCES: int = 2

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "30/minute"

    # Validation rules
    ALLOWED_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".webp"}
    ALLOWED_MIME_TYPES: Set[str] = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
