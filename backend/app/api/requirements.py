from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.requirement import Requirement, RequirementItem, RequirementStatus
from app.models.booking import Booking, ResourceRequest, BookingStatus
from app.models.user import User, Business
from app.schemas.requirement import (
    RequirementCreate,
    RequirementResponse,
    RequirementItemResponse,
)
from app.services.auth_service import require_seeker

router = APIRouter(prefix="/requirements", tags=["Requirements"])

def build_requirement_response(req: Requirement) -> RequirementResponse:
    return RequirementResponse(
        id=req.id,
        seeker_id=req.seeker_id,
        seeker_business_name=req.business.name if req.business else None,
        title=req.title,
        event_type=req.event_type,
        location_city=req.location_city,
        latitude=req.latitude,
        longitude=req.longitude,
        event_date=req.event_date,
        start_time=req.start_time,
        end_time=req.end_time,
        budget=req.budget,
        delivery_required=req.delivery_required,
        status=req.status,
        raw_prompt=req.raw_prompt,
        created_at=req.created_at,
        items=[
            RequirementItemResponse(
                id=item.id,
                resource_type=item.resource_type,
                quantity=item.quantity,
                max_unit_budget=item.max_unit_budget,
            )
            for item in req.items
        ],
    )

@router.post("", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED)
async def create_requirement(
    payload: RequirementCreate,
    auth_data: tuple[User, Business] = Depends(require_seeker),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data

    # Generate title if not given
    items_desc = ", ".join([f"{it.quantity} {it.resource_type}" for it in payload.items])
    title = payload.title or f"Need {items_desc} for {payload.event_type or 'Event'} in {payload.location_city}"

    new_req = Requirement(
        seeker_id=business.id,
        title=title,
        event_type=payload.event_type,
        location_city=payload.location_city,
        latitude=payload.latitude or business.latitude,
        longitude=payload.longitude or business.longitude,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        budget=payload.budget,
        delivery_required=payload.delivery_required,
        raw_prompt=payload.raw_prompt,
        status=RequirementStatus.OPEN.value,
    )
    db.add(new_req)
    await db.flush()

    for item in payload.items:
        req_item = RequirementItem(
            requirement_id=new_req.id,
            resource_type=item.resource_type.lower().strip(),
            quantity=item.quantity,
            max_unit_budget=item.max_unit_budget,
        )
        db.add(req_item)

    await db.commit()

    # Reload with items and business
    stmt = (
        select(Requirement)
        .options(selectinload(Requirement.items), selectinload(Requirement.business))
        .where(Requirement.id == new_req.id)
    )
    req_loaded = (await db.execute(stmt)).scalar_one()
    return build_requirement_response(req_loaded)

@router.get("", response_model=List[RequirementResponse])
async def list_my_requirements(
    auth_data: tuple[User, Business] = Depends(require_seeker),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data
    stmt = (
        select(Requirement)
        .options(selectinload(Requirement.items), selectinload(Requirement.business))
        .where(Requirement.seeker_id == business.id)
        .order_by(Requirement.created_at.desc())
    )
    results = (await db.execute(stmt)).scalars().all()
    return [build_requirement_response(r) for r in results]

@router.get("/{requirement_id}", response_model=RequirementResponse)
async def get_requirement(
    requirement_id: int,
    auth_data: tuple[User, Business] = Depends(require_seeker),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data
    stmt = (
        select(Requirement)
        .options(selectinload(Requirement.items), selectinload(Requirement.business))
        .where(Requirement.id == requirement_id)
    )
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    if req.seeker_id != business.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this requirement")
    return build_requirement_response(req)

@router.delete("/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_requirement(
    requirement_id: int,
    auth_data: tuple[User, Business] = Depends(require_seeker),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data
    stmt = select(Requirement).where(Requirement.id == requirement_id)
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    if req.seeker_id != business.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this requirement")

    # Check for dependent bookings to preserve data integrity and prevent historical deletion
    stmt_bookings = (
        select(Booking)
        .join(ResourceRequest, Booking.resource_request_id == ResourceRequest.id, isouter=True)
        .where((Booking.requirement_id == requirement_id) | (ResourceRequest.requirement_id == requirement_id))
    )
    linked_bookings = (await db.execute(stmt_bookings)).scalars().all()

    active_or_completed = [
        b for b in linked_bookings
        if b.status in [BookingStatus.CONFIRMED.value, BookingStatus.FULFILMENT.value, BookingStatus.COMPLETED.value]
    ]
    if active_or_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete requirement linked to active or confirmed bookings. Transactional history must be preserved."
        )

    # For any cancelled or non-confirmed bookings, dissociate requirement_id safely
    for b in linked_bookings:
        if b.requirement_id == requirement_id:
            b.requirement_id = None

    await db.delete(req)
    await db.commit()
    return None
