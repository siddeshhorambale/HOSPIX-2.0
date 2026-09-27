import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, Business, UserRole
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

PAN_REGEX = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"

@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    # Validate PAN format
    pan_cleaned = (payload.pan_number or "").strip().upper()
    if not re.match(PAN_REGEX, pan_cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PAN format."
        )

    # Check if email exists
    stmt = select(User).where(User.email == payload.email)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Create user
    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        phone=payload.phone
    )
    db.add(new_user)
    await db.flush()

    # Create associated business profile
    business_name = payload.business_name or f"{payload.full_name}'s Business"
    new_business = Business(
        user_id=new_user.id,
        name=business_name,
        business_type=payload.business_type or "rental",
        contact_person=payload.full_name,
        phone=payload.phone,
        pan_number=pan_cleaned,
        is_verified=True,
        address=payload.address or f"{payload.city or 'Thane'}, Maharashtra",
        city=payload.city or "Thane",
        latitude=payload.latitude or 19.2183,
        longitude=payload.longitude or 72.9781,
        trust_score=92.0
    )
    db.add(new_business)
    await db.commit()

    # Reload with business
    stmt_reload = select(User).options(selectinload(User.business)).where(User.id == new_user.id)
    user_loaded = (await db.execute(stmt_reload)).scalar_one()

    access_token = create_access_token({"sub": str(user_loaded.id), "role": user_loaded.role.value})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_loaded
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.business)).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
