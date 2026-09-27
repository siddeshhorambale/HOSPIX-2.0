from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field

class RequirementItemCreate(BaseModel):
    resource_type: str
    quantity: int = Field(gt=0)
    max_unit_budget: Optional[float] = None

class RequirementItemResponse(BaseModel):
    id: int
    resource_type: str
    quantity: int
    max_unit_budget: Optional[float] = None

    class Config:
        from_attributes = True

class RequirementCreate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = "wedding"
    location_city: str = "Thane"
    latitude: Optional[float] = 19.2183
    longitude: Optional[float] = 72.9781
    event_date: date
    start_time: Optional[str] = "17:00"
    end_time: Optional[str] = "23:00"
    budget: float = Field(gt=0)
    delivery_required: bool = True
    raw_prompt: Optional[str] = None
    items: List[RequirementItemCreate] = Field(min_length=1)

class RequirementResponse(BaseModel):
    id: int
    seeker_id: int
    seeker_business_name: Optional[str] = None
    title: str
    event_type: Optional[str] = None
    location_city: str
    latitude: float
    longitude: float
    event_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    budget: float
    delivery_required: bool
    status: str
    raw_prompt: Optional[str] = None
    created_at: datetime
    items: List[RequirementItemResponse] = []

    class Config:
        from_attributes = True
