from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class MatchItemDetail(BaseModel):
    resource_id: int
    resource_name: str
    category: str
    provider_id: int
    provider_name: str
    provider_city: str
    provider_latitude: Optional[float] = 19.2183
    provider_longitude: Optional[float] = 72.9781
    offered_quantity: int
    unit_price: float
    subtotal: float
    delivery_charge: float

class MatchResultResponse(BaseModel):
    match_type: str  # SINGLE or POOLED
    overall_score: float
    availability_score: float
    quantity_score: float
    distance_score: float
    price_score: float
    compatibility_score: float
    trust_score: float
    total_cost: float
    explanation: List[str]
    is_full_coverage: bool
    provider_names: List[str]
    items: List[MatchItemDetail]
