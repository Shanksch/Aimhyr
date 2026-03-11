from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # FastAPI
    app_name: str = "AI Interview Simulator API"
    debug: bool = False
    port: int = 8000
    host: str = "0.0.0.0"
    
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4-turbo-preview"
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    
    # NLP Models
    spacy_model: str = "en_core_web_sm"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
