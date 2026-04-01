from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, UniqueConstraint, Integer
from sqlalchemy.orm import relationship
import uuid
from app.core.db import Base


class Step(Base):
    __tablename__ = "steps"
    __table_args__ = (UniqueConstraint("trip_id", "client_uuid", name="uq_step_trip_client"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    note = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    client_uuid = Column(String(36), nullable=False)
    duration_days = Column(Integer, nullable=True)  # How many days spent at this location

    trip = relationship("Trip", back_populates="steps")
    images = relationship("StepImage", back_populates="step", cascade="all, delete-orphan", order_by="StepImage.order_index")
