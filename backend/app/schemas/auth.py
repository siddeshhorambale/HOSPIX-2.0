from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class BusinessCreate(BaseModel):
    name: str
    business_type: str = "rental"  # hotel, caterer, rental, event_planner
    city: str = "Thane"
    address: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = 19.2183
    longitude: Optional[float] = 72.9781

class BusinessResponse(BaseModel):
    id: int
    name: str
    business_type: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    pan_number: Optional[str] = None
    is_verified: bool = False
    latitude: float
    longitude: float
    trust_score: float

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    pan_number: str
    role: UserRole = UserRole.PROVIDER
    phone: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = "rental"
    city: Optional[str] = "Thane"
    address: Optional[str] = None
    latitude: Optional[float] = 19.2183
    longitude: Optional[float] = 72.9781

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    business: Optional[BusinessResponse] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
