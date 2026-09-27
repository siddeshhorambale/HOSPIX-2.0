from typing import List, Optional, Union
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.booking import (
    ResourceRequest,
    CounterOffer,
    Booking,
    BookingItem,
    BookingStatus,
)
from app.models.resource import (
    Resource,
    ResourceAvailability,
    AvailabilityStatus,
)
from app.models.user import User, Business
from app.schemas.booking import (
    ResourceRequestCreate,
    BatchRequestCreate,
    CounterOfferCreate,
    ResourceRequestResponse,
    CounterOfferResponse,
    BookingCreate,
    BookingResponse,
    BookingItemResponse,
)
from app.services.auth_service import get_current_user, get_current_business

router = APIRouter(prefix="/bookings", tags=["Bookings & State Machine"])
requests_router = APIRouter(prefix="/requests", tags=["Resource Requests"])

def build_request_response(req: ResourceRequest) -> ResourceRequestResponse:
    res = req.__dict__.get("resource")
    seeker = req.__dict__.get("seeker")
    provider = req.__dict__.get("provider")
    counters = req.__dict__.get("counter_offers") or []

    return ResourceRequestResponse(
        id=req.id,
        requirement_id=req.requirement_id,
        resource_id=req.resource_id,
        resource_name=res.name if res else None,
        resource_category=res.category if res else None,
        seeker_id=req.seeker_id,
        seeker_name=seeker.name if seeker else None,
        seeker_city=seeker.city if seeker else None,
        provider_id=req.provider_id,
        provider_name=provider.name if provider else None,
        provider_city=provider.city if provider else None,
        requested_quantity=req.requested_quantity,
        booking_date=req.booking_date,
        start_time=req.start_time or "10:00",
        end_time=req.end_time or "22:00",
        unit_price=req.unit_price,
        total_price=req.total_price,
        delivery_required=req.delivery_required,
        delivery_charge=req.delivery_charge,
        status=req.status,
        notes=req.notes,
        created_at=req.created_at,
        counter_offers=[
            CounterOfferResponse(
                id=c.id,
                resource_request_id=c.resource_request_id,
                offered_by_business_id=c.offered_by_business_id,
                counter_quantity=c.counter_quantity,
                counter_price=c.counter_price,
                counter_date=c.counter_date,
                counter_delivery_charge=c.counter_delivery_charge,
                notes=c.notes,
                status=c.status,
                created_at=c.created_at,
            )
            for c in counters
        ],
    )

def build_booking_response(b: Booking) -> BookingResponse:
    items = []
    loaded_items = b.__dict__.get("items")
    if loaded_items:
        for it in loaded_items:
            res_obj = it.__dict__.get("resource")
            items.append(
                BookingItemResponse(
                    id=it.id,
                    booking_id=it.booking_id,
                    resource_id=it.resource_id,
                    resource_name=res_obj.name if res_obj else None,
                    quantity=it.quantity,
                    unit_price=it.unit_price,
                    total_price=it.total_price,
                )
            )

    seeker_obj = b.__dict__.get("seeker")
    provider_obj = b.__dict__.get("provider")

    return BookingResponse(
        id=b.id,
        resource_request_id=b.resource_request_id,
        requirement_id=b.requirement_id,
        seeker_id=b.seeker_id,
        seeker_name=seeker_obj.name if seeker_obj else None,
        provider_id=b.provider_id,
        provider_name=provider_obj.name if provider_obj else None,
        status=b.status,
        total_amount=b.total_amount,
        booking_date=b.booking_date,
        start_time=b.start_time or "10:00",
        end_time=b.end_time or "22:00",
        confirmed_at=b.confirmed_at,
        created_at=b.created_at,
        items=items,
    )

async def check_and_reserve_inventory(
    db: AsyncSession,
    resource_id: int,
    quantity: int,
    booking_date: date,
    seeker_name: str,
    start_time: str = "10:00",
    end_time: str = "22:00",
) -> Resource:
    stmt_res = select(Resource).where(Resource.id == resource_id)
    resource = (await db.execute(stmt_res)).scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Check date-level calendar availability
    stmt_avail = select(ResourceAvailability).where(
        ResourceAvailability.resource_id == resource_id,
        ResourceAvailability.date == booking_date,
    )
    avail_records = (await db.execute(stmt_avail)).scalars().all()

    already_blocked_on_date = sum(r.blocked_quantity for r in avail_records if not r.is_blocked)
    any_full_block = any(r.is_blocked for r in avail_records)

    available_on_date = resource.total_quantity - already_blocked_on_date
    effective_available = min(resource.available_quantity, available_on_date)

    if any_full_block or effective_available < quantity or resource.available_quantity < quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This resource is no longer available for the selected time. Refreshing available options...",
        )

    # Deduct inventory
    resource.available_quantity -= quantity
    if resource.available_quantity <= 0:
        resource.available_quantity = 0
        resource.availability = AvailabilityStatus.UNAVAILABLE.value
    else:
        resource.availability = AvailabilityStatus.PARTIAL.value

    # Add calendar blocked record
    cal_block = ResourceAvailability(
        resource_id=resource.id,
        date=booking_date,
        blocked_quantity=quantity,
        is_blocked=False,
        reason=f"Confirmed Booking ({start_time}-{end_time}) for {seeker_name}",
    )
    db.add(cal_block)
    return resource

# -------------------------------------------------------------
# 1. CREATE BOOKING REQUESTS (BATCH OR SINGLE)
# -------------------------------------------------------------
@router.post("/requests", response_model=List[ResourceRequestResponse], status_code=status.HTTP_201_CREATED)
@requests_router.post("", response_model=List[ResourceRequestResponse], status_code=status.HTTP_201_CREATED)
@requests_router.post("/", response_model=List[ResourceRequestResponse], status_code=status.HTTP_201_CREATED)
async def create_booking_requests(
    payload: Union[BatchRequestCreate, ResourceRequestCreate],
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    if isinstance(payload, ResourceRequestCreate):
        req_id = payload.requirement_id
        items_list = [payload]
    else:
        req_id = payload.requirement_id
        items_list = payload.items or []

    if not items_list:
        raise HTTPException(status_code=400, detail="At least one resource request item is required")

    created_requests = []
    for item in items_list:
        stmt_res = select(Resource).where(Resource.id == item.resource_id)
        resource = (await db.execute(stmt_res)).scalar_one_or_none()
        if not resource:
            raise HTTPException(status_code=404, detail=f"Resource {item.resource_id} not found")

        total_price = (item.requested_quantity * item.unit_price) + (item.delivery_charge if item.delivery_required else 0.0)

        req = ResourceRequest(
            requirement_id=item.requirement_id or req_id,
            resource_id=resource.id,
            seeker_id=business.id,
            provider_id=resource.provider_id,
            requested_quantity=item.requested_quantity,
            booking_date=item.booking_date,
            start_time=item.start_time or "10:00",
            end_time=item.end_time or "22:00",
            unit_price=item.unit_price,
            total_price=total_price,
            delivery_required=item.delivery_required,
            delivery_charge=item.delivery_charge if item.delivery_required else 0.0,
            status=BookingStatus.PENDING.value,
            notes=item.notes,
        )
        db.add(req)
        await db.flush()
        created_requests.append(req.id)

    await db.commit()

    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.id.in_(created_requests))
    )
    loaded = (await db.execute(stmt)).scalars().all()
    return [build_request_response(r) for r in loaded]

# -------------------------------------------------------------
# 2. CREATE A DIRECT BOOKING IN PENDING STATE (POST /bookings)
# -------------------------------------------------------------
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreate,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Booking must contain at least one item")

    provider_id = payload.provider_id
    total_amount = 0.0

    items_to_create = []
    for it in payload.items:
        stmt_res = select(Resource).where(Resource.id == it.resource_id)
        resource = (await db.execute(stmt_res)).scalar_one_or_none()
        if not resource:
            raise HTTPException(status_code=404, detail=f"Resource {it.resource_id} not found")

        if provider_id is None:
            provider_id = resource.provider_id

        item_total = it.total_price if it.total_price is not None else (it.quantity * it.unit_price)
        total_amount += item_total
        items_to_create.append({
            "resource_id": resource.id,
            "quantity": it.quantity,
            "unit_price": it.unit_price,
            "total_price": item_total,
        })

    if payload.total_amount is not None:
        total_amount = payload.total_amount

    booking = Booking(
        resource_request_id=payload.resource_request_id,
        requirement_id=payload.requirement_id,
        seeker_id=business.id,
        provider_id=provider_id,
        status=BookingStatus.PENDING.value,
        total_amount=total_amount,
        booking_date=payload.booking_date,
        start_time=payload.start_time or "10:00",
        end_time=payload.end_time or "22:00",
        confirmed_at=None,
    )
    db.add(booking)
    await db.flush()

    for it_data in items_to_create:
        b_item = BookingItem(
            booking_id=booking.id,
            resource_id=it_data["resource_id"],
            quantity=it_data["quantity"],
            unit_price=it_data["unit_price"],
            total_price=it_data["total_price"],
        )
        db.add(b_item)

    await db.commit()

    stmt_reload = (
        select(Booking)
        .options(
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
            selectinload(Booking.items).selectinload(BookingItem.resource),
        )
        .where(Booking.id == booking.id)
    )
    loaded_booking = (await db.execute(stmt_reload)).scalar_one()
    return build_booking_response(loaded_booking)

# -------------------------------------------------------------
# 3. GET REQUESTS (INCOMING / OUTGOING)
# -------------------------------------------------------------
@router.get("/requests/incoming", response_model=List[ResourceRequestResponse])
async def get_incoming_requests(
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.provider_id == business.id)
        .order_by(ResourceRequest.created_at.desc())
    )
    requests = (await db.execute(stmt)).scalars().all()
    return [build_request_response(r) for r in requests]

@router.get("/requests/outgoing", response_model=List[ResourceRequestResponse])
async def get_outgoing_requests(
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.seeker_id == business.id)
        .order_by(ResourceRequest.created_at.desc())
    )
    requests = (await db.execute(stmt)).scalars().all()
    return [build_request_response(r) for r in requests]

# -------------------------------------------------------------
# 4. REQUEST ACCEPT / REJECT
# -------------------------------------------------------------
@router.post("/requests/{request_id}/accept", response_model=ResourceRequestResponse)
async def accept_request(
    request_id: int,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.id == request_id)
    )
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.provider_id != business.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    req.status = BookingStatus.ACCEPTED.value
    await db.commit()
    await db.refresh(req)
    return build_request_response(req)

@router.post("/requests/{request_id}/reject", response_model=ResourceRequestResponse)
async def reject_request(
    request_id: int,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.id == request_id)
    )
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.provider_id != business.id and req.seeker_id != business.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    req.status = BookingStatus.REJECTED.value
    await db.commit()
    await db.refresh(req)
    return build_request_response(req)

# -------------------------------------------------------------
# 5. COUNTER-OFFER FLOW (POST /requests/{id}/counter-offer)
# -------------------------------------------------------------
async def execute_counter_offer(
    request_id: int,
    payload: CounterOfferCreate,
    business: Business,
    db: AsyncSession,
) -> ResourceRequestResponse:
    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.id == request_id)
    )
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.provider_id != business.id and req.seeker_id != business.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    qty = payload.resolved_quantity()
    price = payload.resolved_price()
    offer_date = payload.resolved_date() or req.booking_date
    delivery = payload.resolved_delivery() if payload.resolved_delivery() is not None else req.delivery_charge

    counter = CounterOffer(
        resource_request_id=req.id,
        offered_by_business_id=business.id,
        counter_quantity=qty,
        counter_price=price,
        counter_date=offer_date,
        counter_delivery_charge=delivery,
        notes=payload.notes,
        status="PENDING",
    )
    db.add(counter)

    req.status = BookingStatus.COUNTER_OFFER.value
    await db.commit()
    db.expire_all()

    stmt_reload = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.id == request_id)
    )
    req_updated = (await db.execute(stmt_reload)).scalar_one()
    return build_request_response(req_updated)

@router.post("/requests/{request_id}/counter-offer", response_model=ResourceRequestResponse)
@router.post("/requests/{request_id}/counter", response_model=ResourceRequestResponse)
async def create_counter_offer_endpoint(
    request_id: int,
    payload: CounterOfferCreate,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    return await execute_counter_offer(request_id, payload, business, db)

@requests_router.post("/{request_id}/counter-offer", response_model=ResourceRequestResponse)
@requests_router.post("/{request_id}/counter", response_model=ResourceRequestResponse)
async def create_counter_offer_root(
    request_id: int,
    payload: CounterOfferCreate,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    return await execute_counter_offer(request_id, payload, business, db)

@router.post("/requests/{request_id}/counter/{counter_id}/accept", response_model=ResourceRequestResponse)
@requests_router.post("/{request_id}/counter/{counter_id}/accept", response_model=ResourceRequestResponse)
async def accept_counter_offer(
    request_id: int,
    counter_id: int,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.counter_offers),
        )
        .where(ResourceRequest.id == request_id)
    )
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    stmt_c = select(CounterOffer).where(
        CounterOffer.id == counter_id,
        CounterOffer.resource_request_id == request_id,
    )
    counter = (await db.execute(stmt_c)).scalar_one_or_none()
    if not counter:
        raise HTTPException(status_code=404, detail="Counter offer not found")

    counter.status = "ACCEPTED"
    req.requested_quantity = counter.counter_quantity
    req.unit_price = counter.counter_price
    if counter.counter_date:
        req.booking_date = counter.counter_date
    if counter.counter_delivery_charge is not None:
        req.delivery_charge = counter.counter_delivery_charge
    req.total_price = (req.requested_quantity * req.unit_price) + req.delivery_charge
    req.status = BookingStatus.ACCEPTED.value

    await db.commit()
    await db.refresh(req)
    return build_request_response(req)

# -------------------------------------------------------------
# 6. TRANSACTIONAL CONFIRMATION (PUT /bookings/{id}/confirm)
# -------------------------------------------------------------
async def execute_booking_confirmation(
    booking: Booking,
    business: Business,
    db: AsyncSession,
) -> BookingResponse:
    if business.id not in [booking.seeker_id, booking.provider_id]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if booking.status == BookingStatus.CONFIRMED.value:
        return build_booking_response(booking)

    if booking.status not in [BookingStatus.PENDING.value, BookingStatus.ACCEPTED.value, BookingStatus.COUNTER_OFFER.value]:
        raise HTTPException(status_code=400, detail=f"Cannot confirm booking in '{booking.status}' state")

    seeker_name = booking.seeker.name if getattr(booking, "seeker", None) else f"Seeker #{booking.seeker_id}"

    # Transactional Availability check across each item
    for item in booking.items:
        await check_and_reserve_inventory(
            db=db,
            resource_id=item.resource_id,
            quantity=item.quantity,
            booking_date=booking.booking_date,
            seeker_name=seeker_name,
            start_time=booking.start_time or "10:00",
            end_time=booking.end_time or "22:00",
        )

    # State update
    booking.status = BookingStatus.CONFIRMED.value
    booking.confirmed_at = datetime.utcnow()
    if booking.resource_request:
        booking.resource_request.status = BookingStatus.CONFIRMED.value

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed during confirmation: {str(e)}")

    # Reload
    stmt_reload = (
        select(Booking)
        .options(
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
            selectinload(Booking.items).selectinload(BookingItem.resource),
        )
        .where(Booking.id == booking.id)
    )
    loaded = (await db.execute(stmt_reload)).scalar_one()
    return build_booking_response(loaded)

@router.put("/{booking_id}/confirm", response_model=BookingResponse)
@router.post("/{booking_id}/confirm", response_model=BookingResponse)
async def confirm_booking_by_id(
    booking_id: int,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
            selectinload(Booking.resource_request),
            selectinload(Booking.items).selectinload(BookingItem.resource),
        )
        .where(Booking.id == booking_id)
    )
    booking = (await db.execute(stmt)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return await execute_booking_confirmation(booking, business, db)

@router.post("/requests/{request_id}/confirm", response_model=BookingResponse)
@router.put("/requests/{request_id}/confirm", response_model=BookingResponse)
async def confirm_request_to_booking(
    request_id: int,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    # Lock and load resource request
    stmt = (
        select(ResourceRequest)
        .options(
            selectinload(ResourceRequest.resource),
            selectinload(ResourceRequest.seeker),
            selectinload(ResourceRequest.provider),
            selectinload(ResourceRequest.booking),
        )
        .where(ResourceRequest.id == request_id)
    )
    req = (await db.execute(stmt)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if business.id not in [req.seeker_id, req.provider_id]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if req.status not in [BookingStatus.ACCEPTED.value, BookingStatus.PENDING.value, BookingStatus.COUNTER_OFFER.value]:
        raise HTTPException(status_code=400, detail=f"Cannot confirm request in '{req.status}' state")

    # If booking already exists, confirm it
    if req.booking:
        stmt_b = (
            select(Booking)
            .options(
                selectinload(Booking.seeker),
                selectinload(Booking.provider),
                selectinload(Booking.resource_request),
                selectinload(Booking.items).selectinload(BookingItem.resource),
            )
            .where(Booking.id == req.booking.id)
        )
        existing_booking = (await db.execute(stmt_b)).scalar_one()
        return await execute_booking_confirmation(existing_booking, business, db)

    # 1. Transactional Availability Check
    seeker_name = req.seeker.name if req.seeker else f"Seeker #{req.seeker_id}"
    await check_and_reserve_inventory(
        db=db,
        resource_id=req.resource_id,
        quantity=req.requested_quantity,
        booking_date=req.booking_date,
        seeker_name=seeker_name,
        start_time=req.start_time or "10:00",
        end_time=req.end_time or "22:00",
    )

    # 2. Create Confirmed Booking record
    booking = Booking(
        resource_request_id=req.id,
        requirement_id=req.requirement_id,
        seeker_id=req.seeker_id,
        provider_id=req.provider_id,
        status=BookingStatus.CONFIRMED.value,
        total_amount=req.total_price,
        booking_date=req.booking_date,
        start_time=req.start_time or "10:00",
        end_time=req.end_time or "22:00",
        confirmed_at=datetime.utcnow(),
    )
    db.add(booking)
    await db.flush()

    # 3. Create Booking Item
    b_item = BookingItem(
        booking_id=booking.id,
        resource_id=req.resource_id,
        quantity=req.requested_quantity,
        unit_price=req.unit_price,
        total_price=req.requested_quantity * req.unit_price,
    )
    db.add(b_item)

    # Update request state
    req.status = BookingStatus.CONFIRMED.value

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed during booking confirmation: {str(e)}")

    # Reload
    stmt_reload = (
        select(Booking)
        .options(
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
            selectinload(Booking.items).selectinload(BookingItem.resource),
        )
        .where(Booking.id == booking.id)
    )
    loaded = (await db.execute(stmt_reload)).scalar_one()
    return build_booking_response(loaded)

# -------------------------------------------------------------
# 7. STATE TRANSITIONS: FULFILMENT, COMPLETED, CANCEL
# -------------------------------------------------------------
@router.put("/{booking_id}/state", response_model=BookingResponse)
@router.put("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_state(
    booking_id: int,
    target_status: str,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.items).selectinload(BookingItem.resource),
            selectinload(Booking.resource_request),
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
        )
        .where(Booking.id == booking_id)
    )
    booking = (await db.execute(stmt)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if business.id not in [booking.seeker_id, booking.provider_id]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    valid_statuses = [
        BookingStatus.CONFIRMED.value,
        BookingStatus.FULFILMENT.value,
        BookingStatus.COMPLETED.value,
        BookingStatus.CANCELLED.value,
    ]
    if target_status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid target state. Allowed: {valid_statuses}")

    upper_status = target_status.upper()
    booking.status = upper_status
    if booking.resource_request:
        booking.resource_request.status = upper_status

    await db.commit()
    
    # Reload with full relations
    stmt_reload = (
        select(Booking)
        .options(
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
            selectinload(Booking.items).selectinload(BookingItem.resource),
        )
        .where(Booking.id == booking_id)
    )
    loaded = (await db.execute(stmt_reload)).scalar_one()
    return build_booking_response(loaded)

@router.get("", response_model=List[BookingResponse])
@router.get("/", response_model=List[BookingResponse])
async def list_user_bookings(
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
            selectinload(Booking.items).selectinload(BookingItem.resource),
        )
        .where((Booking.seeker_id == business.id) | (Booking.provider_id == business.id))
        .order_by(Booking.created_at.desc())
    )
    bookings = (await db.execute(stmt)).scalars().all()
    return [build_booking_response(b) for b in bookings]

@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    business: Business = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.items),
            selectinload(Booking.resource_request),
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
        )
        .where(Booking.id == booking_id)
    )
    booking = (await db.execute(stmt)).scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if business.id not in [booking.seeker_id, booking.provider_id]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if booking.status == BookingStatus.CANCELLED.value:
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    # Restore inventory if previously confirmed
    if booking.status in [BookingStatus.CONFIRMED.value, BookingStatus.FULFILMENT.value]:
        for item in booking.items:
            stmt_res = select(Resource).where(Resource.id == item.resource_id)
            resource = (await db.execute(stmt_res)).scalar_one_or_none()
            if resource:
                resource.available_quantity += item.quantity
                if resource.available_quantity > resource.total_quantity:
                    resource.available_quantity = resource.total_quantity
                resource.availability = AvailabilityStatus.AVAILABLE.value

    booking.status = BookingStatus.CANCELLED.value
    if booking.resource_request:
        booking.resource_request.status = BookingStatus.CANCELLED.value

    await db.commit()
    
    stmt_reload = (
        select(Booking)
        .options(
            selectinload(Booking.seeker),
            selectinload(Booking.provider),
            selectinload(Booking.items).selectinload(BookingItem.resource),
        )
        .where(Booking.id == booking_id)
    )
    loaded = (await db.execute(stmt_reload)).scalar_one()
    return build_booking_response(loaded)
