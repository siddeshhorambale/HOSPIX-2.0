from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, Business
from app.services.auth_service import get_current_user, get_current_business
from app.services.analytics_service import get_analytics_overview

router = APIRouter(prefix="/analytics", tags=["Business Intelligence & Analytics"])

@router.get("/overview", response_model=Dict[str, Any])
@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
async def read_analytics_overview(
    current_user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    """
    Read-only lightweight Business Intelligence and Marketplace Analytics.
    Returns authenticated role-scoped KPIs, timeline series, resource demand, and pooling ratios.
    """
    return await get_analytics_overview(db, current_user, business)
