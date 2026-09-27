import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Date
from sqlalchemy.orm import relationship
from app.database import Base

class ResourceCategory(str, enum.Enum):
    FURNITURE = "Furniture"
    DINING = "Dining"
    HOSPITALITY_EQUIPMENT = "Hospitality Equipment"
    EVENT_EQUIPMENT = "Event Equipment"
    LINEN = "Linen"

class ResourceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"

class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"
    PARTIAL = "PARTIAL"

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # Furniture, Dining, Hospitality Equipment, etc.
    description = Column(Text, nullable=True)
    total_quantity = Column(Integer, nullable=False, default=1)
    available_quantity = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)
    price_unit = Column(String(50), nullable=False, default="per_day")
    minimum_rental_period = Column(Integer, nullable=False, default=1)  # in days
    condition = Column(String(50), nullable=False, default="Good")  # Excellent, Good, Fair
    images = Column(JSON, nullable=True, default=list)  # list of image URLs/identifiers
    location = Column(String(100), nullable=False)  # Thane, Mulund, etc.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    delivery_available = Column(Boolean, nullable=False, default=True)
    delivery_charge = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default=ResourceStatus.ACTIVE.value)
    availability = Column(String(50), nullable=False, default=AvailabilityStatus.AVAILABLE.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="resources")
    availability_records = relationship("ResourceAvailability", back_populates="resource", cascade="all, delete-orphan")
    match_items = relationship("MatchItem", back_populates="resource", cascade="all, delete-orphan")
    booking_items = relationship("BookingItem", back_populates="resource")

class ResourceAvailability(Base):
    __tablename__ = "resource_availability"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    blocked_quantity = Column(Integer, nullable=False, default=0)
    is_blocked = Column(Boolean, default=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    resource = relationship("Resource", back_populates="availability_records")
