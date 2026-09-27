import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COUNTER_OFFER = "COUNTER_OFFER"
    CONFIRMED = "CONFIRMED"
    FULFILMENT = "FULFILMENT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class ResourceRequest(Base):
    __tablename__ = "resource_requests"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="SET NULL"), nullable=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    seeker_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_quantity = Column(Integer, nullable=False)
    booking_date = Column(Date, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    delivery_required = Column(Boolean, default=True)
    delivery_charge = Column(Float, default=0.0)
    start_time = Column(String(10), nullable=True, default="10:00")
    end_time = Column(String(10), nullable=True, default="22:00")
    status = Column(String(50), nullable=False, default=BookingStatus.PENDING.value)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    match = relationship("Match", back_populates="resource_requests")
    resource = relationship("Resource")
    seeker = relationship("Business", foreign_keys=[seeker_id])
    provider = relationship("Business", foreign_keys=[provider_id])
    counter_offers = relationship("CounterOffer", back_populates="resource_request", cascade="all, delete-orphan")
    booking = relationship("Booking", back_populates="resource_request", uselist=False)

class CounterOffer(Base):
    __tablename__ = "counter_offers"

    id = Column(Integer, primary_key=True, index=True)
    resource_request_id = Column(Integer, ForeignKey("resource_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    offered_by_business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    counter_quantity = Column(Integer, nullable=False)
    counter_price = Column(Float, nullable=False)
    counter_date = Column(Date, nullable=True)
    counter_delivery_charge = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, ACCEPTED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    resource_request = relationship("ResourceRequest", back_populates="counter_offers")
    offered_by = relationship("Business", foreign_keys=[offered_by_business_id])

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    resource_request_id = Column(Integer, ForeignKey("resource_requests.id", ondelete="SET NULL"), unique=True, nullable=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id", ondelete="SET NULL"), nullable=True, index=True)
    seeker_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default=BookingStatus.PENDING.value)
    total_amount = Column(Float, nullable=False)
    booking_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=True, default="10:00")
    end_time = Column(String(10), nullable=True, default="22:00")
    confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requirement = relationship("Requirement")
    resource_request = relationship("ResourceRequest", back_populates="booking")
    seeker = relationship("Business", foreign_keys=[seeker_id])
    provider = relationship("Business", foreign_keys=[provider_id])
    items = relationship("BookingItem", back_populates="booking", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False)

class BookingItem(Base):
    __tablename__ = "booking_items"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    booking = relationship("Booking", back_populates="items")
    resource = relationship("Resource", back_populates="booking_items")
