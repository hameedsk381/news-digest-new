"""
FastAPI application entry point.
Configures CORS, lifespan events, and route mounting.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import database
from app.routes import upload, articles


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    await database.connect()
    yield
    # Shutdown
    await database.disconnect()


app = FastAPI(
    title="News Intelligence System",
    description="AI-powered newspaper analysis with article extraction, classification, and sentiment analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(articles.router, prefix="/api", tags=["Articles"])


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "News Intelligence System",
        "version": "1.0.0",
    }
