from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
import uuid
from app.core.db import Base


class StepImage(Base):
    __tablename__ = "step_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    step_id = Column(String(36), ForeignKey("steps.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    step = relationship("Step", back_populates="images")
