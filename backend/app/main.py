from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # Ensure all models are registered with Base

# Lifespan for table creation
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables asynchronously
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"HOSPIX B2B Hospitality Resource Exchange - {settings.PROJECT_TAGLINE}",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "database": "connected"
    }

# Register API routers
from app.api.auth import router as auth_router
from app.api.seed import router as seed_router
from app.api.resources import router as resources_router
from app.api.ai import router as ai_router
from app.api.requirements import router as requirements_router
from app.api.matches import router as matches_router
from app.api.bookings import router as bookings_router, requests_router
from app.api.profile import router as profile_router
from app.api.analytics import router as analytics_router
from app.api.weather_twin import router as weather_twin_router

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(seed_router, prefix=settings.API_V1_STR)
app.include_router(resources_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(requirements_router, prefix=settings.API_V1_STR)
app.include_router(matches_router, prefix=settings.API_V1_STR)
app.include_router(bookings_router, prefix=settings.API_V1_STR)
app.include_router(requests_router, prefix=settings.API_V1_STR)
app.include_router(profile_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(weather_twin_router, prefix=settings.API_V1_STR)






