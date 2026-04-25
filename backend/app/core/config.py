from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Solar-01"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "solar01"

    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    OS_API_KEY: str = ""
    OS_API_SECRET: str = ""
    ADDRESSBASE_API_KEY: str = ""
    ADDRESSBASE_API_SECRET: str = ""

    COMPANIES_HOUSE_CLIENT_ID: str = ""
    COMPANIES_HOUSE_CLIENT_SECRET: str = ""

    APOLLO_API_KEY: str = ""

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    BREVO_API_KEY: str = ""

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_PRO: str = ""
    STRIPE_PRICE_PROFESSIONAL: str = ""
    STRIPE_PRICE_ENTERPRISE: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
