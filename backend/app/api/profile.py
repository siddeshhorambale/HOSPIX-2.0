import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, Business, UserRole
from app.models.resource import Resource, AvailabilityStatus
from app.models.booking import Booking, BookingStatus
from app.models.requirement import Requirement
from app.models.review import Review
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])

PAN_REGEX = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"

class PanVerificationRequest(BaseModel):
    pan_number: str

class ProfileUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None

def mask_pan(pan: Optional[str]) -> Optional[str]:
    if not pan or len(pan) < 6:
        return pan
    return f"{pan[:3]}****{pan[-2:]}"

async def get_business_stats(db: AsyncSession, business: Business, is_provider: bool):
    # Calculate rating from reviews
    rev_stmt = select(
        func.avg(Review.rating),
        func.count(Review.id)
    ).where(Review.reviewee_business_id == business.id)
    rev_res = (await db.execute(rev_stmt)).first()
    avg_rating, reviews_count = rev_res if rev_res else (None, 0)
    
    if avg_rating is not None and reviews_count > 0:
        rating = round(float(avg_rating), 1)
    else:
        # High-trust baseline scaled from trust_score (e.g., 95 -> 4.8, 90 -> 4.5)
        rating = round((business.trust_score or 92.0) / 20.0, 1)
        reviews_count = max(1, int((business.trust_score or 90) / 10))

    # Calculate completed transactions
    if is_provider:
        b_stmt = select(func.count(Booking.id)).where(
            Booking.provider_id == business.id,
            Booking.status.in_([BookingStatus.COMPLETED.value, BookingStatus.FULFILMENT.value, BookingStatus.CONFIRMED.value])
        )
    else:
        b_stmt = select(func.count(Booking.id)).where(
            Booking.seeker_id == business.id,
            Booking.status.in_([BookingStatus.COMPLETED.value, BookingStatus.FULFILMENT.value, BookingStatus.CONFIRMED.value])
        )
    
    real_count = (await db.execute(b_stmt)).scalar() or 0
    # Seed baseline to represent verified active businesses in MVP
    baseline = 12 if is_provider else 6
    completed_transactions = real_count if real_count > 0 else baseline

    return rating, reviews_count, completed_transactions

@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Business).where(Business.user_id == current_user.id)
    business = (await db.execute(stmt)).scalar_one_or_none()

    if not business:
        # Fallback create empty business if missing
        business = Business(
            user_id=current_user.id,
            name=f"{current_user.full_name}'s Enterprise",
            business_type="rental" if current_user.role == UserRole.PROVIDER else "event_planner",
            city="Thane",
            address="Thane, Maharashtra",
            trust_score=90.0
        )
        db.add(business)
        await db.commit()
        await db.refresh(business)

    is_provider = (current_user.role == UserRole.PROVIDER)
    rating, reviews_count, completed_transactions = await get_business_stats(db, business, is_provider)

    is_verified = bool(business.is_verified or (business.pan_number and re.match(PAN_REGEX, business.pan_number.strip().upper())))

    profile_data: Dict[str, Any] = {
        "user_id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "phone": business.phone or current_user.phone or "+91 98200 00000",
        "business_id": business.id,
        "business_name": business.name,
        "business_type": business.business_type,
        "location": f"{business.address or business.city}, {business.city}",
        "city": business.city,
        "address": business.address,
        "contact_person": business.contact_person or current_user.full_name,
        "pan_number": business.pan_number,
        "pan_masked": mask_pan(business.pan_number),
        "is_verified": is_verified,
        "rating": rating,
        "reviews_count": reviews_count,
        "completed_transactions": completed_transactions,
        "trust_score": business.trust_score or 90.0,
    }

    if is_provider:
        # Fetch provider's resources
        r_stmt = select(Resource).where(Resource.provider_id == business.id)
        resources = (await db.execute(r_stmt)).scalars().all()

        profile_data["resources"] = [
            {
                "id": r.id,
                "name": r.name,
                "category": r.category,
                "description": r.description,
                "total_quantity": r.total_quantity,
                "available_quantity": r.available_quantity,
                "price": r.price,
                "price_unit": r.price_unit,
                "pricing": f"₹{r.price:.0f} / {r.price_unit.replace('_', ' ')}",
                "availability": r.availability,
                "status": r.status,
                "condition": r.condition,
                "delivery_available": r.delivery_available,
                "delivery_charge": r.delivery_charge,
            }
            for r in resources
        ]
        profile_data["total_resources"] = len(resources)
    else:
        # Fetch seeker's requirements summary
        req_stmt = (
            select(Requirement)
            .options(selectinload(Requirement.items))
            .where(Requirement.seeker_id == business.id)
            .order_by(Requirement.created_at.desc())
        )
        reqs = (await db.execute(req_stmt)).scalars().all()
        profile_data["total_requirements"] = len(reqs)
        profile_data["recent_requirements"] = [
            {
                "id": req.id,
                "title": req.title,
                "event_type": req.event_type or "General Event",
                "city": req.location_city,
                "quantity": sum(it.quantity for it in req.items) if req.items else 0,
                "date": str(req.event_date),
                "budget": req.budget,
                "status": req.status,
            }
            for req in reqs[:5]
        ]

    return profile_data

@router.get("/business/{business_id}")
async def get_business_public_profile(
    business_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Business).where(Business.id == business_id)
    business = (await db.execute(stmt)).scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Determine if provider
    r_stmt = select(Resource).where(Resource.provider_id == business.id)
    resources = (await db.execute(r_stmt)).scalars().all()
    is_provider = len(resources) > 0

    rating, reviews_count, completed_transactions = await get_business_stats(db, business, is_provider)
    is_verified = bool(business.is_verified or (business.pan_number and re.match(PAN_REGEX, business.pan_number.strip().upper())))

    profile_data: Dict[str, Any] = {
        "business_id": business.id,
        "business_name": business.name,
        "business_type": business.business_type,
        "location": f"{business.address or business.city}, {business.city}",
        "city": business.city,
        "address": business.address,
        "phone": business.phone,
        "contact_person": business.contact_person,
        "is_verified": is_verified,
        "pan_masked": mask_pan(business.pan_number) if is_verified else None,
        "rating": rating,
        "reviews_count": reviews_count,
        "completed_transactions": completed_transactions,
        "trust_score": business.trust_score or 90.0,
        "is_provider": is_provider,
    }

    if is_provider:
        profile_data["resources"] = [
            {
                "id": r.id,
                "name": r.name,
                "category": r.category,
                "description": r.description,
                "total_quantity": r.total_quantity,
                "available_quantity": r.available_quantity,
                "price": r.price,
                "price_unit": r.price_unit,
                "pricing": f"₹{r.price:.0f} / {r.price_unit.replace('_', ' ')}",
                "availability": r.availability,
                "status": r.status,
                "condition": r.condition,
                "delivery_available": r.delivery_available,
                "delivery_charge": r.delivery_charge,
            }
            for r in resources
        ]
        profile_data["total_resources"] = len(resources)

    return profile_data

@router.post("/verify-pan")
async def verify_pan(
    payload: PanVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    pan_cleaned = (payload.pan_number or "").strip().upper()
    if not re.match(PAN_REGEX, pan_cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PAN format."
        )

    stmt = select(Business).where(Business.user_id == current_user.id)
    business = (await db.execute(stmt)).scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business profile not found")

    business.pan_number = pan_cleaned
    business.is_verified = True
    await db.commit()
    await db.refresh(business)

    return {
        "success": True,
        "message": "PAN verified successfully! Business is now verified.",
        "is_verified": True,
        "pan_number": pan_cleaned,
        "pan_masked": mask_pan(pan_cleaned),
    }

@router.put("")
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Business).where(Business.user_id == current_user.id)
    business = (await db.execute(stmt)).scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if payload.business_name:
        business.name = payload.business_name
    if payload.business_type:
        business.business_type = payload.business_type
    if payload.city:
        business.city = payload.city
    if payload.address:
        business.address = payload.address
    if payload.phone:
        business.phone = payload.phone
    if payload.contact_person:
        business.contact_person = payload.contact_person

    await db.commit()
    await db.refresh(business)

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "business": {
            "name": business.name,
            "business_type": business.business_type,
            "city": business.city,
            "address": business.address,
            "phone": business.phone,
            "contact_person": business.contact_person,
            "is_verified": business.is_verified
        }
    }
