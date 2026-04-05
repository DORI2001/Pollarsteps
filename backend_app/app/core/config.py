from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl
from typing import Optional, Union
import os
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    app_name: str = "Pollarsteps Clone API"
    database_url: Union[AnyUrl, str]
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24 * 7
    ai_chronicler_url: Optional[str] = None
    
    # Gemini API configuration for recommendations
    gemini_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Email configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Pollarsteps"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


def get_settings() -> Settings:
    return Settings()
