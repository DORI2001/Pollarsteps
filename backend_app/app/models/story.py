from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
import uuid
from app.core.db import Base


class Story(Base):
    __tablename__ = "stories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="ready")
    share_token = Column(String(64), nullable=True, unique=True, index=True)
    is_public = Column(Boolean, nullable=False, default=False)
    song_provider = Column(String(32), nullable=True)
    song_id = Column(String(128), nullable=True)
    song_title = Column(String, nullable=True)
    song_thumbnail = Column(String, nullable=True)
    song_start_time = Column(Integer, nullable=True, default=0)
    song_duration = Column(Integer, nullable=True, default=15)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    slides = relationship("StorySlide", back_populates="story", cascade="all, delete-orphan", order_by="StorySlide.order_index")


class StorySlide(Base):
    __tablename__ = "story_slides"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    story_id = Column(String(36), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)
    image_url = Column(String, nullable=True)
    caption = Column(String, nullable=True)
    map_tile_url = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=False, default=4000)

    story = relationship("Story", back_populates="slides")
