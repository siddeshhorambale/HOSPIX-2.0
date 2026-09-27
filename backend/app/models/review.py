from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    reviewer_business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    reviewee_business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="review")
    reviewer = relationship("Business", foreign_keys=[reviewer_business_id])
    reviewee = relationship("Business", foreign_keys=[reviewee_business_id])
