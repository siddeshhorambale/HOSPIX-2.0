from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field
from app.models.booking import BookingStatus

class ResourceRequestCreate(BaseModel):
    requirement_id: Optional[int] = None
    resource_id: int
    requested_quantity: int = Field(gt=0)
    booking_date: date
    start_time: Optional[str] = "10:00"
    end_time: Optional[str] = "22:00"
    unit_price: float = Field(gt=0)
    delivery_required: bool = True
    delivery_charge: float = 0.0
    notes: Optional[str] = None

class BatchRequestCreate(BaseModel):
    requirement_id: Optional[int] = None
    items: List[ResourceRequestCreate]

class CounterOfferCreate(BaseModel):
    counter_quantity: Optional[int] = None
    quantity: Optional[int] = None
    counter_price: Optional[float] = None
    price: Optional[float] = None
    counter_date: Optional[date] = None
    date: Optional[date] = None
    counter_delivery_charge: Optional[float] = None
    delivery_charge: Optional[float] = None
    notes: Optional[str] = None

    def resolved_quantity(self) -> int:
        val = self.counter_quantity if self.counter_quantity is not None else self.quantity
        if val is None or val <= 0:
            raise ValueError("A positive counter quantity is required")
        return val

    def resolved_price(self) -> float:
        val = self.counter_price if self.counter_price is not None else self.price
        if val is None or val <= 0:
            raise ValueError("A positive counter price is required")
        return val

    def resolved_date(self) -> Optional[date]:
        return self.counter_date or self.date

    def resolved_delivery(self) -> Optional[float]:
        return self.counter_delivery_charge if self.counter_delivery_charge is not None else self.delivery_charge

class CounterOfferResponse(BaseModel):
    id: int
    resource_request_id: int
    offered_by_business_id: int
    counter_quantity: int
    counter_price: float
    counter_date: Optional[date] = None
    counter_delivery_charge: Optional[float] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ResourceRequestResponse(BaseModel):
    id: int
    requirement_id: int
    resource_id: int
    resource_name: Optional[str] = None
    resource_category: Optional[str] = None
    seeker_id: int
    seeker_name: Optional[str] = None
    seeker_city: Optional[str] = None
    provider_id: int
    provider_name: Optional[str] = None
    provider_city: Optional[str] = None
    requested_quantity: int
    booking_date: date
    start_time: Optional[str] = "10:00"
    end_time: Optional[str] = "22:00"
    unit_price: float
    total_price: float
    delivery_required: bool
    delivery_charge: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    counter_offers: List[CounterOfferResponse] = []

    class Config:
        from_attributes = True

class BookingItemCreate(BaseModel):
    resource_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0)
    total_price: Optional[float] = None

class BookingItemResponse(BaseModel):
    id: int
    booking_id: int
    resource_id: int
    resource_name: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    requirement_id: Optional[int] = None
    resource_request_id: Optional[int] = None
    provider_id: Optional[int] = None
    booking_date: date
    start_time: Optional[str] = "10:00"
    end_time: Optional[str] = "22:00"
    items: List[BookingItemCreate]
    total_amount: Optional[float] = None
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    resource_request_id: Optional[int] = None
    requirement_id: Optional[int] = None
    seeker_id: int
    seeker_name: Optional[str] = None
    provider_id: int
    provider_name: Optional[str] = None
    status: str
    total_amount: float
    booking_date: date
    start_time: Optional[str] = "10:00"
    end_time: Optional[str] = "22:00"
    confirmed_at: Optional[datetime] = None
    created_at: datetime
    items: List[BookingItemResponse] = []

    class Config:
        from_attributes = True
