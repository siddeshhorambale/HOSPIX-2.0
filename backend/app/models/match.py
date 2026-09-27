import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class MatchType(str, enum.Enum):
    SINGLE = "SINGLE"
    POOLED = "POOLED"

class MatchStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True)
    match_type = Column(String(50), nullable=False, default=MatchType.SINGLE.value)
    overall_score = Column(Float, nullable=False, default=0.0)
    availability_score = Column(Float, nullable=False, default=0.0)
    quantity_score = Column(Float, nullable=False, default=0.0)
    distance_score = Column(Float, nullable=False, default=0.0)
    price_score = Column(Float, nullable=False, default=0.0)
    compatibility_score = Column(Float, nullable=False, default=0.0)
    trust_score = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default=MatchStatus.PROPOSED.value)
    explanation = Column(JSON, nullable=False, default=list)  # List of strings e.g. ["Covers 100% quantity", ...]
    total_cost = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    requirement = relationship("Requirement", back_populates="matches")
    items = relationship("MatchItem", back_populates="match", cascade="all, delete-orphan")
    resource_requests = relationship("ResourceRequest", back_populates="match")

class MatchItem(Base):
    __tablename__ = "match_items"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    offered_quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    delivery_charge = Column(Float, nullable=False, default=0.0)

    match = relationship("Match", back_populates="items")
    resource = relationship("Resource", back_populates="match_items")
