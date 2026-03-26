from datetime import datetime
from sqlalchemy import Column, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.core.db import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)  # Trip end date for calculating duration
    is_public = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    user = relationship("User", backref="trips")
    steps = relationship("Step", back_populates="trip", cascade="all, delete-orphan", order_by="Step.timestamp")
