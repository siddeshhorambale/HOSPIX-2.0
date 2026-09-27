from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.requirement import Requirement
from app.services.weather_service import get_live_weather
from app.services.social_signal_service import get_real_world_signals
from app.services.digital_twin_service import run_digital_twin_simulation
from app.services.nugen_service import NUGEN_ALIGNMENT_METADATA

router = APIRouter(prefix="/weather-twin", tags=["Weather-Driven Digital Twin & Nugen"])

class SimulationRequest(BaseModel):
    requirement_id: Optional[int] = None
    rainfall_mm: float = Field(default=45.0, ge=0.0, le=250.0, description="Rainfall intensity in mm/hr")
    duration_hours: float = Field(default=2.0, ge=0.5, le=24.0, description="Storm duration in hours")
    temperature_c: float = Field(default=27.0, ge=-10.0, le=55.0, description="Temperature in Celsius")
    wind_kmh: float = Field(default=16.0, ge=0.0, le=120.0, description="Wind speed in km/h")
    city: str = Field(default="Thane", description="Target hub city")

@router.get("/live-weather")
async def get_live_weather_endpoint(
    city: Optional[str] = Query(default="Thane"),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
):
    """Fetch live meteorological data from Open-Meteo for regional HOSPIX hubs."""
    return await get_live_weather(latitude=latitude, longitude=longitude, city=city)

@router.get("/signals")
async def get_signals_endpoint(
    city: Optional[str] = Query(default="Thane"),
    rainfall_mm: Optional[float] = Query(default=0.0),
    wind_kmh: Optional[float] = Query(default=12.0),
):
    """Retrieve real-world traveler alerts, public disaster bulletins, and transit advisories."""
    return get_real_world_signals(city=city, rainfall_mm=rainfall_mm, wind_kmh=wind_kmh)

@router.get("/requirements")
async def get_simulation_requirements(db: AsyncSession = Depends(get_db)):
    """Fetch real HOSPIX requirements available to drive What-If simulation scenarios."""
    stmt = select(Requirement).order_by(Requirement.id.desc()).limit(15)
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "city": r.location_city,
            "date": str(r.event_date),
            "budget": r.budget,
            "status": r.status,
        }
        for r in rows
    ]

@router.post("/simulate")
async def run_simulation_endpoint(
    payload: SimulationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Execute Digital Twin What-If counterfactual scenario with Nugen Domain-Specific reasoning.
    Strictly read-only: does not modify or write to production database.
    """
    return await run_digital_twin_simulation(
        db=db,
        requirement_id=payload.requirement_id,
        scenario_rainfall_mm=payload.rainfall_mm,
        scenario_duration_hours=payload.duration_hours,
        scenario_temperature_c=payload.temperature_c,
        scenario_wind_kmh=payload.wind_kmh,
        scenario_city=payload.city,
    )

@router.get("/alignment-status")
async def get_nugen_alignment_status():
    """Retrieve verified Nugen AI alignment project and domain customization metadata."""
    return NUGEN_ALIGNMENT_METADATA
