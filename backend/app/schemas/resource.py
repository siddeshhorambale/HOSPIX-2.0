from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field
from app.models.resource import ResourceCategory, ResourceStatus, AvailabilityStatus

class ResourceAvailabilityCreate(BaseModel):
    date: date
    blocked_quantity: int = Field(gt=0)
    is_blocked: bool = False
    reason: Optional[str] = None

class ResourceAvailabilityResponse(BaseModel):
    id: int
    resource_id: int
    date: date
    blocked_quantity: int
    is_blocked: bool
    reason: Optional[str] = None

    class Config:
        from_attributes = True

class ResourceCreate(BaseModel):
    name: str = Field(min_length=2)
    category: str  # Must match predefined categories
    description: Optional[str] = None
    total_quantity: int = Field(gt=0)
    available_quantity: Optional[int] = None
    price: float = Field(gt=0)
    price_unit: str = "per_day"
    minimum_rental_period: int = 1
    condition: str = "Good"  # Excellent, Good, Fair
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_available: bool = True
    delivery_charge: float = 0.0
    images: Optional[List[str]] = []

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    total_quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    price: Optional[float] = None
    price_unit: Optional[str] = None
    minimum_rental_period: Optional[int] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_available: Optional[bool] = None
    delivery_charge: Optional[float] = None
    status: Optional[str] = None
    availability: Optional[str] = None

class ResourceResponse(BaseModel):
    id: int
    provider_id: int
    provider_name: Optional[str] = None
    provider_city: Optional[str] = None
    provider_trust_score: Optional[float] = None
    name: str
    category: str
    description: Optional[str] = None
    total_quantity: int
    available_quantity: int
    price: float
    price_unit: str
    minimum_rental_period: int
    condition: str
    images: Optional[List[str]] = []
    location: str
    latitude: float
    longitude: float
    delivery_available: bool
    delivery_charge: float
    status: str
    availability: str
    created_at: datetime

    class Config:
        from_attributes = True
