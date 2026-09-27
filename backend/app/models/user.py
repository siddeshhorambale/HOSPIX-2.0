import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    PROVIDER = "PROVIDER"
    SEEKER = "SEEKER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PROVIDER, nullable=False)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    business_type = Column(String(100), nullable=False)  # hotel, caterer, rental, event_planner
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)  # Thane, Mulund, Bhiwandi, Navi Mumbai
    pan_number = Column(String(10), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    latitude = Column(Float, nullable=False, default=19.2183)
    longitude = Column(Float, nullable=False, default=72.9781)
    trust_score = Column(Float, default=90.0)  # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="business")
    resources = relationship("Resource", back_populates="business", cascade="all, delete-orphan")
    requirements = relationship("Requirement", back_populates="business", cascade="all, delete-orphan")
