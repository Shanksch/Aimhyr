"""
Main FastAPI application.
AI Interview Simulator Backend API.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, scoring, questions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-powered interview simulator backend API",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(health.router)
app.include_router(scoring.router)
app.include_router(questions.router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to AI Interview Simulator API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    logger.info("AI Interview Simulator API starting up...")
    logger.info(f"OpenAI API Key configured: {bool(settings.openai_api_key)}")
    logger.info(f"Frontend URL: {settings.frontend_url}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("AI Interview Simulator API shutting down...")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
