import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class RequirementStatus(str, enum.Enum):
    OPEN = "OPEN"
    MATCHED = "MATCHED"
    FULFILLED = "FULFILLED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    seeker_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    event_type = Column(String(100), nullable=True)  # wedding, conference, party, banquet
    location_city = Column(String(100), nullable=False)  # Thane, Mulund, etc.
    latitude = Column(Float, nullable=False, default=19.2183)
    longitude = Column(Float, nullable=False, default=72.9781)
    event_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True, default="10:00")
    end_time = Column(String(10), nullable=True, default="22:00")
    budget = Column(Float, nullable=False)
    delivery_required = Column(Boolean, default=True)
    status = Column(String(50), nullable=False, default=RequirementStatus.OPEN.value)
    raw_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="requirements")
    items = relationship("RequirementItem", back_populates="requirement", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="requirement", cascade="all, delete-orphan")

class RequirementItem(Base):
    __tablename__ = "requirement_items"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False)  # chairs, tables, chafing dishes, etc.
    quantity = Column(Integer, nullable=False)
    max_unit_budget = Column(Float, nullable=True)

    requirement = relationship("Requirement", back_populates="items")
