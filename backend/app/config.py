import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "HOSPIX"
    PROJECT_TAGLINE: str = "From finding a supplier to fulfilling a requirement"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./hospix.db")
    
    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "hospix-super-secret-key-2026-production-grade")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # External APIs
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MAPBOX_ACCESS_TOKEN: str = os.getenv("MAPBOX_ACCESS_TOKEN", "")
    NUGEN_API_KEY: str = os.getenv("NUGEN_API_KEY", "")
    NUGEN_BASE_URL: str = os.getenv("NUGEN_BASE_URL", "https://api.nugen.in")
    NUGEN_ALIGNMENT_ID: str = os.getenv("NUGEN_ALIGNMENT_ID", "alignment_01m3fw6jtv7gc7ed")
    NUGEN_MODEL_ID: str = os.getenv("NUGEN_MODEL_ID", "gpt-oss-120b")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    
    # Matching Engine Default Weights
    WEIGHT_AVAILABILITY: float = 0.30
    WEIGHT_QUANTITY_COVERAGE: float = 0.25
    WEIGHT_DISTANCE: float = 0.15
    WEIGHT_PRICE: float = 0.15
    WEIGHT_COMPATIBILITY: float = 0.10
    WEIGHT_TRUST: float = 0.05
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
