from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.resource import (
    Resource,
    ResourceAvailability,
    ResourceStatus,
    AvailabilityStatus,
    ResourceCategory,
)
from app.models.user import User, Business
from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
    ResourceAvailabilityCreate,
    ResourceAvailabilityResponse,
)
from app.services.auth_service import require_provider, get_current_user

router = APIRouter(prefix="/resources", tags=["Resources & Inventory"])

def build_resource_response(resource: Resource) -> ResourceResponse:
    return ResourceResponse(
        id=resource.id,
        provider_id=resource.provider_id,
        provider_name=resource.business.name if resource.business else None,
        provider_city=resource.business.city if resource.business else resource.location,
        provider_trust_score=resource.business.trust_score if resource.business else 90.0,
        name=resource.name,
        category=resource.category,
        description=resource.description,
        total_quantity=resource.total_quantity,
        available_quantity=resource.available_quantity,
        price=resource.price,
        price_unit=resource.price_unit,
        minimum_rental_period=resource.minimum_rental_period,
        condition=resource.condition,
        images=resource.images or [],
        location=resource.location,
        latitude=resource.latitude,
        longitude=resource.longitude,
        delivery_available=resource.delivery_available,
        delivery_charge=resource.delivery_charge,
        status=resource.status,
        availability=resource.availability,
        created_at=resource.created_at,
    )

@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    payload: ResourceCreate,
    auth_data: tuple[User, Business] = Depends(require_provider),
    db: AsyncSession = Depends(get_db),
):
    user, business = auth_data

    # Set quantities
    avail_qty = payload.available_quantity if payload.available_quantity is not None else payload.total_quantity
    
    # Location fallback to business
    loc = payload.location or business.city
    lat = payload.latitude if payload.latitude is not None else business.latitude
    lng = payload.longitude if payload.longitude is not None else business.longitude

    new_resource = Resource(
        provider_id=business.id,
        name=payload.name,
        category=payload.category,
        description=payload.description,
        total_quantity=payload.total_quantity,
        available_quantity=avail_qty,
        price=payload.price,
        price_unit=payload.price_unit,
        minimum_rental_period=payload.minimum_rental_period,
        condition=payload.condition,
        images=payload.images or [],
        location=loc,
        latitude=lat,
        longitude=lng,
        delivery_available=payload.delivery_available,
        delivery_charge=payload.delivery_charge,
        status=ResourceStatus.ACTIVE.value,
        availability=AvailabilityStatus.AVAILABLE.value if avail_qty > 0 else AvailabilityStatus.UNAVAILABLE.value,
    )
    db.add(new_resource)
    await db.commit()

    # Reload with business
    stmt = select(Resource).options(selectinload(Resource.business)).where(Resource.id == new_resource.id)
    res = (await db.execute(stmt)).scalar_one()
    return build_resource_response(res)

@router.get("/my-inventory", response_model=List[ResourceResponse])
async def get_my_inventory(
    auth_data: tuple[User, Business] = Depends(require_provider),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data
    stmt = (
        select(Resource)
        .options(selectinload(Resource.business))
        .where(Resource.provider_id == business.id)
        .order_by(Resource.created_at.desc())
    )
    resources = (await db.execute(stmt)).scalars().all()
    return [build_resource_response(r) for r in resources]

@router.get("", response_model=List[ResourceResponse])
async def list_all_resources(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Resource).options(selectinload(Resource.business)).where(Resource.status == ResourceStatus.ACTIVE.value)
    if category:
        stmt = stmt.where(Resource.category.ilike(f"%{category}%"))
    if location:
        stmt = stmt.where(Resource.location.ilike(f"%{location}%"))
    if max_price:
        stmt = stmt.where(Resource.price <= max_price)
    
    stmt = stmt.order_by(Resource.name.asc())
    resources = (await db.execute(stmt)).scalars().all()
    return [build_resource_response(r) for r in resources]

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Resource).options(selectinload(Resource.business)).where(Resource.id == resource_id)
    resource = (await db.execute(stmt)).scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return build_resource_response(resource)

@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    auth_data: tuple[User, Business] = Depends(require_provider),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data
    stmt = select(Resource).options(selectinload(Resource.business)).where(Resource.id == resource_id)
    resource = (await db.execute(stmt)).scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.provider_id != business.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this resource")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(resource, field, value)

    # Recalculate availability status if quantities changed
    if resource.available_quantity <= 0:
        resource.availability = AvailabilityStatus.UNAVAILABLE.value
    elif resource.available_quantity < resource.total_quantity:
        resource.availability = AvailabilityStatus.PARTIAL.value
    else:
        resource.availability = AvailabilityStatus.AVAILABLE.value

    await db.commit()
    await db.refresh(resource)
    return build_resource_response(resource)

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    auth_data: tuple[User, Business] = Depends(require_provider),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data
    stmt = select(Resource).where(Resource.id == resource_id)
    resource = (await db.execute(stmt)).scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.provider_id != business.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resource")

    await db.delete(resource)
    await db.commit()
    return None

@router.post("/{resource_id}/availability", response_model=ResourceAvailabilityResponse)
async def add_resource_availability(
    resource_id: int,
    payload: ResourceAvailabilityCreate,
    auth_data: tuple[User, Business] = Depends(require_provider),
    db: AsyncSession = Depends(get_db),
):
    _, business = auth_data
    stmt = select(Resource).where(Resource.id == resource_id)
    resource = (await db.execute(stmt)).scalar_one_or_none()
    if not resource or resource.provider_id != business.id:
        raise HTTPException(status_code=404, detail="Resource not found or unauthorized")

    record = ResourceAvailability(
        resource_id=resource_id,
        date=payload.date,
        blocked_quantity=payload.blocked_quantity,
        is_blocked=payload.is_blocked,
        reason=payload.reason,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

@router.get("/{resource_id}/availability", response_model=List[ResourceAvailabilityResponse])
async def get_resource_availability(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ResourceAvailability)
        .where(ResourceAvailability.resource_id == resource_id)
        .order_by(ResourceAvailability.date.asc())
    )
    records = (await db.execute(stmt)).scalars().all()
    return records
