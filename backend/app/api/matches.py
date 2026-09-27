from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.requirement import Requirement
from app.models.user import User, Business
from app.models.match import MatchType
from app.schemas.match import MatchResultResponse, MatchItemDetail
from app.services.auth_service import require_seeker
from app.services.matching_service import generate_matches_for_requirement

router = APIRouter(prefix="/matching", tags=["Matching & Pooling Engine"])

class SearchRequest(BaseModel):
    requirement_id: int

@router.post("/search")
async def search_matches(
    payload: SearchRequest,
    auth_data: tuple[User, Business] = Depends(require_seeker),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data

    stmt = (
        select(Requirement)
        .options(selectinload(Requirement.items), selectinload(Requirement.business))
        .where(Requirement.id == payload.requirement_id)
    )
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    if req.seeker_id != business.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    matches_result = await generate_matches_for_requirement(db, req)

    if isinstance(matches_result, dict):
        raw_singles = matches_result.get("single_matches", [])
        raw_pooled = matches_result.get("pooled_solutions", [])
    else:
        raw_singles = [m for m in matches_result if m.get("match_type") != MatchType.POOLED.value]
        raw_pooled = [m for m in matches_result if m.get("match_type") == MatchType.POOLED.value]

    def build_match_response(m, forced_type=None):
        item_details = []
        for it in m["items"]:
            res = it.get("resource")
            item_details.append(
                MatchItemDetail(
                    resource_id=res.id,
                    resource_name=res.name,
                    category=res.category,
                    provider_id=res.provider_id,
                    provider_name=res.business.name if res.business else "Unknown",
                    provider_city=res.business.city if res.business else res.location,
                    provider_latitude=res.latitude if res.latitude is not None else 19.2183,
                    provider_longitude=res.longitude if res.longitude is not None else 72.9781,
                    offered_quantity=it.get("offered_quantity", 0),
                    unit_price=it["unit_price"],
                    subtotal=it["subtotal"],
                    delivery_charge=it["delivery_charge"],
                )
            )

        m_type = forced_type or m.get("match_type", MatchType.SINGLE.value)
        return MatchResultResponse(
            match_type=m_type,
            overall_score=m.get("overall_score", 0),
            availability_score=m.get("availability_score", 100),
            quantity_score=m.get("quantity_score", 100),
            distance_score=m.get("distance_score", 100),
            price_score=m.get("price_score", 100),
            compatibility_score=m.get("compatibility_score", 100),
            trust_score=m.get("trust_score", 100),
            total_cost=m["total_cost"],
            explanation=m.get("explanation", []),
            is_full_coverage=m.get("is_full_coverage", True),
            provider_names=m.get("provider_names", []),
            items=item_details,
        )

    single_matches = [build_match_response(m, MatchType.SINGLE.value) for m in raw_singles]
    # Enforce strictly pool size >= 2
    pooled_solutions = [
        build_match_response(m, MatchType.POOLED.value)
        for m in raw_pooled
        if len(m.get("provider_names", [])) >= 2
    ]

    return {
        "single_matches": single_matches,
        "pooled_solutions": pooled_solutions
    }
